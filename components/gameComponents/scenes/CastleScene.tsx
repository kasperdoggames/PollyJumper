import "phaser";
import { Coins, CoinType } from "../elements/Coin";
import Acid from "../elements/Acid";
import {
  createPlatform,
  moveHorizontal,
  moveVertical,
} from "../elements/Platform";
import { PlayerController } from "../playerController";
import SocketClient from "../SocketClient";
import { sharedInstance as events } from "../EventCenter";

type gameState = "waiting" | "running" | "end";

export default class CastleScene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  player!: PlayerController;
  otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  music!: Phaser.Sound.BaseSound;
  bg_1!: Phaser.GameObjects.TileSprite;
  coins!: Coins;
  socketClient!: SocketClient;
  start!: { x: number; y: number };
  loading: boolean = true;
  timer!: Phaser.Time.TimerEvent;
  gameId!: string;
  level!: string;
  gameState: gameState = "waiting";
  emitMessages: { key: string; data: any }[] = [];
  dangerZone!: Acid;

  loadFromSocket() {
    this.socketClient = new SocketClient(this);
  }

  init() {
    this.level = "castle";
    // Load UI
    this.scene.launch("ui");
    this.scene.launch("dialog");
    // load up socketIO
    this.loadFromSocket();
    // init the keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  preload() {
    // Load all assets for level
    this.load.atlas(
      "polly",
      "/assets/player/polly.png",
      "/assets/player/polly.json"
    );

    // tilemaps
    this.load.image("castle_tiles", "/assets/castle_level/castle_tileset.png");
    this.load.tilemapTiledJSON(
      "castle_level",
      "/assets/castle_level/castle_scene.json"
    );

    // coins and platforms
    this.load.atlas("coin", "/assets/coin.png", "/assets/coin.json");
    this.load.image("bell", "/assets/bell.png");

    // acid
    this.load.spritesheet(
      "acidTileSprites",
      "/assets/castle_level/acid_tileset.png",
      {
        frameWidth: 70,
        frameHeight: 70,
      }
    );

    // parallax
    this.load.image("bg_1", "/assets/castle_level/castle_bg.png");

    // load audio
    this.load.audio("castleMusic", "/assets/castle_level/castleMusic.mp3");
    this.load.audio("acidSplash", "/assets/castle_level/acidSplash.ogg");
    this.load.audio("coinPickup", "/assets/coinPickup.ogg");
    this.load.audio("bell", "/assets/bell.mp3");
  }

  create() {
    // create coins class
    this.coins = new Coins(this);
    // create the tile map instance
    const map = this.make.tilemap({ key: "castle_level" });
    // add the tileset to the map
    const tileset = map.addTilesetImage("castle_tileset", "castle_tiles");
    // create the ground layer from the loaded tileset
    const ground = map.createLayer("ground", tileset);
    map.createLayer("ground2", tileset);
    map.createLayer("ground3", tileset).setDepth(-1);

    // set collisions based on custom value on the tilesheet data
    ground.setCollisionByProperty({ collides: true });

    // parallax
    this.bg_1 = this.add.tileSprite(0, 0, 0, 0, "bg_1");
    this.bg_1.setOrigin(0, 0);
    this.bg_1.setScrollFactor(0);
    this.bg_1.setDepth(-2);

    // convert the layer to matter physics for ground
    this.matter.world.convertTilemapLayer(ground);

    // creatre bounds for the sprite
    const bounds = this.matter.world.setBounds(
      0,
      0,
      ground.width,
      ground.height
    );

    // label the walls as "bounds"
    Object.values(bounds.walls).forEach((o) => (o.label = "bounds"));

    // get objects layer from the tilemap
    const objectsLayer = map.getObjectLayer("objects");

    // create player controller/state
    this.player = new PlayerController(this);

    // loop over all objects in the object layer to assign objects
    objectsLayer.objects.forEach((element) => {
      const { x = 0, y = 0, name } = element;

      switch (name) {
        case "start":
          this.player.sprite.setPosition(x - 1, y);
          this.start = { x, y };
          break;
        case "finish":
          this.matter.add
            .sprite(x, y, "bell")
            .setStatic(true)
            .setName("finish");
          break;
        case "acid":
          this.dangerZone = new Acid(this, x, y);
          break;
        case "coin":
          const coinType: CoinType = element.properties[0]?.value;
          this.coins.addCoin(this, x, y, coinType);
          break;
        default:
          break;
      }
    });

    // setup collisions
    this.matter.world.on(
      "collisionstart",
      (_event: any, bodyA: any, bodyB: any) => {
        // don't care about any other collisions
        if (
          bodyA.gameObject?.name !== "polly" &&
          bodyB.gameObject?.name !== "polly"
        ) {
          return;
        }
        const [polly, other] =
          bodyB.gameObject?.name === "polly" ? [bodyB, bodyA] : [bodyA, bodyB];
        if (other.gameObject?.name === "acidSprite") {
          this.dangerZone.meltSound();
          this.player.stateMachine.transition("melt");
          return;
        }
        if (other.gameObject?.name === "coin") {
          this.coins.pickupCoin(this, other.gameObject);
          return;
        }
        if (other.gameObject?.name === "finish") {
          const finish = this.sound.get("bell");
          finish.play();
          this.player.sprite.anims.play("idle");
          this.socketClient.counter = 10;
          this.socketClient.socket.emit("gameUpdate", {
            level: this.level,
            gameId: this.gameId,
            state: "end",
            winner: true,
          });
        }
        if (other.position.y > polly.position.y) {
          this.player.isTouchingGround = true;
          return;
        }
        other.friction = 0;
      }
    );

    // set bounds for the camera
    this.cameras.main.setBounds(0, 0, ground.width, ground.height);
    // camera to follow the player (this will change to auto scroll up)
    this.cameras.main.startFollow(this.player.sprite, true);

    if (!this.sound.get("castleMusic")) {
      // add background music
      this.music = this.sound.add("castleMusic", {
        delay: 0,
        loop: true,
        seek: 0,
        mute: false,
        volume: 0.2,
        rate: 1,
        detune: 0,
      });
    }

    if (!this.sound.get("bell")) {
      this.sound.add("bell");
    }
    // Background music
    if (!this.sound.locked) {
      // already unlocked so play
      if (!this.music.isPlaying) {
        this.music.play();
      }
    } else {
      // wait for 'unlocked' to fire and then play
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (!this.music.isPlaying) {
          this.music.play();
        }
      });
    }

    // pause on blur and resume when back
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        return;
      }
      this.music?.pause();
    });

    this.game.events.on(Phaser.Core.Events.RESUME, () => {
      if (this.music.isPaused) {
        this.music.resume();
      }
    });

    events.on("dead", () => {
      console.log("player died");
      this.socketClient.socket.emit("dead");
      // get players and sort based on highest point
      this.otherPlayers.delete(this.socketClient.socket.id);
      const ordered = Array.from(this.otherPlayers.values()).sort(
        (a, b) => b.y - a.y
      );

      if (ordered.length === 0 && this.gameState === "running") {
        // emit end game as all players dead
        console.log("end game request");
        this.socketClient.counter = 10;
        this.socketClient.socket.emit("gameUpdate", {
          level: this.level,
          gameId: this.gameId,
          state: "end",
          winner: false,
        });
        return;
      }
      // follow highest player
      try {
        this.cameras.main.startFollow(ordered[0]);
      } catch (err) {
        console.log(err);
      }
    });
  }

  update() {
    if (this.emitMessages.length > 0) {
      for (let i = 0; i < this.emitMessages.length; i++) {
        const data = this.emitMessages.pop();
        if (data) {
          events.emit(data.key, data.data);
        }
      }
    }
    if (this.loading || this.socketClient.counter >= 0) {
      return;
    }
    if (this.gameState !== "end") {
      // run through state for player controller
      this.player.stateMachine.step();
      // update acid
      this.dangerZone.update();
      this.bg_1.tilePositionY = this.cameras.main.scrollY * 0.3;
    }
  }
}
