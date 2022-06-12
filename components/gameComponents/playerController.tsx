import "phaser";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { StateMachine } from "./StateMachine";
import { sharedInstance as events } from "./EventCenter";

export class PlayerController {
  sprite!: Phaser.Physics.Matter.Sprite;
  stateMachine!: StateMachine;
  speed = 4;
  jumpSpeed = -20;
  controls: Phaser.Types.Input.Keyboard.CursorKeys;
  isTouchingGround = false;
  spriteY?: number;
  jumpCount = 0;
  scene: any;
  socket!: Socket<DefaultEventsMap, DefaultEventsMap>;
  level!: string;

  constructor(scene: any) {
    this.scene = scene;
    if (scene.socketClient?.socket) {
      this.socket = scene.socketClient.socket;
    }
    this.level = scene.level;

    // create a player instance from the spritesheet
    this.sprite = scene.matter.add
      .sprite(0, 0, "polly", "idle_01.png")
      .setFixedRotation();

    // add a name for the player
    this.sprite.setName("polly");

    this.createAnims();
    this.sprite.anims.play("idle");
    this.controls = scene.cursors;
    this.stateMachine = new StateMachine(
      "idle",
      {
        idle: this.idleState,
        run: this.runState,
        jump: this.jumpState,
        melt: this.meltState,
        crumble: this.crumbleState,
      },
      [this]
    );
  }

  // Create animations
  createAnims() {
    this.scene.anims.create({
      key: "crumble",
      frameRate: 18,
      frames: this.sprite.anims.generateFrameNames("polly", {
        start: 1,
        end: 12,
        prefix: "melt00",
        suffix: ".png",
        zeroPad: 2,
      }),
    });
    this.scene.anims.create({
      key: "melt",
      frameRate: 18,
      frames: this.sprite.anims.generateFrameNames("polly", {
        start: 1,
        end: 12,
        prefix: "melt00",
        suffix: ".png",
        zeroPad: 2,
      }),
    });
    this.scene.anims.create({
      key: "run",
      frameRate: 20,
      frames: this.sprite.anims.generateFrameNames("polly", {
        start: 1,
        end: 12,
        prefix: "run00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.scene.anims.create({
      key: "idle",
      frameRate: 20,
      frames: this.sprite.anims.generateFrameNames("polly", {
        start: 1,
        end: 12,
        prefix: "idle00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.scene.anims.create({
      key: "jump",
      frames: [{ key: "polly", frame: "run0005.png" }],
      repeat: 0,
    });
    this.scene.anims.create({
      key: "doublejump",
      frames: [{ key: "polly", frame: "run0006.png" }],
      repeat: 0,
    });
    this.scene.anims.create({
      key: "fall",
      frames: [{ key: "polly", frame: "run0010.png" }],
      repeat: 0,
    });
  }

  // set states for state machine
  idleState = {
    enter: () => {
      this.sprite.setVelocity(0);
      this.sprite.anims.play("idle");
    },
    execute: () => {
      const { space, left, right } = this.controls;
      if (space.isDown && this.isTouchingGround) {
        this.stateMachine.transition("jump");
        return;
      }

      if (left.isDown || right.isDown) {
        this.stateMachine.transition("run");
        return;
      }
      if (this.socket) {
        this.socket.emit("playerUpdate", {
          level: this.level,
          gameId: this.scene.gameId,
          playerData: {
            state: "idle",
            location: this.sprite.body.position,
          },
        });
      }
    },
  };

  crumbleState = {
    enter: () => {
      this.sprite.setTint(0x737373);
      this.sprite.setAlpha(0.8);
      this.sprite.setVelocity(0);
      this.socket.emit("playerUpdate", {
        level: this.level,
        gameId: this.scene.gameId,
        playerData: {
          state: "crumble",
          location: this.sprite.body.position,
        },
      });
      this.sprite.anims.play("crumble").on("animationcomplete", () => {
        events.emit("playerMessage", "You Died");
        events.emit("dead");
      });
    },
    execute: () => {},
  };

  meltState = {
    enter: () => {
      this.sprite.setVelocity(0);
      if (this.socket) {
        this.socket.emit("playerUpdate", {
          level: this.level,
          gameId: this.scene.gameId,
          playerData: {
            state: "melt",
            location: this.sprite.body.position,
          },
        });
      }
      this.sprite.anims.play("melt").on("animationcomplete", () => {
        events.emit("playerMessage", "You Died");
        events.emit("dead");
      });
    },
    execute: () => {},
  };

  runState = {
    enter: () => {
      this.sprite.anims.play("run");
      if (this.socket) {
        this.socket.emit("playerUpdate", {
          level: this.level,
          gameId: this.scene.gameId,
          playerData: {
            state: "run",
            location: this.sprite.body.position,
            flipX: this.sprite.flipX,
          },
        });
      }
    },
    execute: () => {
      const { space, left, right } = this.controls;
      if (space.isDown && this.isTouchingGround) {
        this.stateMachine.transition("jump");
        return;
      }

      if (left.isDown) {
        this.sprite.setVelocityX(-this.speed);
        this.sprite.flipX = true;
      } else if (right.isDown) {
        this.sprite.setVelocityX(this.speed);
        this.sprite.flipX = false;
      }
      if (this.socket) {
        this.socket.emit("playerUpdate", {
          level: this.level,
          gameId: this.scene.gameId,
          playerData: {
            state: "run",
            location: this.sprite.body.position,
            flipX: this.sprite.flipX,
          },
        });
      }
      if (!(left.isDown || right.isDown)) {
        this.stateMachine.transition("idle");
        return;
      }
    },
  };

  jumpState = {
    enter: () => {
      this.spriteY = this.sprite.y;
    },
    execute: () => {
      const { space, left, right } = this.controls;
      const jumpPressed = Phaser.Input.Keyboard.JustDown(space);
      const animation = this.jumpCount === 1 ? "jump" : "doublejump";
      if (jumpPressed && (this.isTouchingGround || this.jumpCount < 2)) {
        this.sprite.setVelocityY(this.jumpSpeed);
        this.sprite.anims.play(animation, true);
        this.isTouchingGround = false;
        this.jumpCount++;
      }
      // check height of jump for correct animation to play
      if (this.spriteY && this.sprite.y < this.spriteY) {
        this.spriteY = this.sprite.y;
        this.sprite.anims.play(animation, true);
      } else if (this.spriteY && this.sprite.y > this.spriteY) {
        this.spriteY = this.sprite.y;
        this.sprite.anims.play("fall", true);
      }
      // allow movement in the air
      if (left.isDown) {
        this.sprite.setVelocityX(-this.speed);
        this.sprite.flipX = true;
      } else if (right.isDown) {
        this.sprite.setVelocityX(this.speed);
        this.sprite.flipX = false;
      }
      if (this.socket) {
        this.socket.emit("playerUpdate", {
          level: this.level,
          gameId: this.scene.gameId,
          playerData: {
            state: "jump",
            location: this.sprite.body.position,
            flipX: this.sprite.flipX,
          },
        });
      }
      if (this.isTouchingGround) {
        this.jumpCount = 0;
        this.stateMachine.transition("idle");
      }
    },
  };
}
