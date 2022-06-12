export class Acid {
  scene!: Phaser.Scene;
  acidTileSprite!: Phaser.GameObjects.TileSprite;
  acidSprite!: Phaser.Physics.Matter.Sprite;
  acidpart!: Phaser.GameObjects.Rectangle;
  acidSplashAudio!: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    // add audio
    this.acidSplashAudio = scene.sound.add("acidSplash");
    // create a tile sprite from loaded spritesheet
    this.acidTileSprite = scene.add.tileSprite(
      x,
      y,
      1400,
      70,
      "acidTileSprites"
    );
    this.acidTileSprite.setPosition(x, y);
    this.acidTileSprite.setFrame(55);

    this.acidSprite = scene.matter.add
      .sprite(x, y, "acidSprite")
      .setVisible(false);

    this.acidSprite.setStatic(true);
    this.acidSprite.setPosition(x, y + 15);
    this.acidSprite.setDepth(2);
    this.acidSprite.setName("acidSprite");
    this.acidSprite.setDisplaySize(1400, 70);

    // this will be hidden but something to get a frame index
    this.acidSprite.anims.create({
      key: "run",
      frameRate: 10,
      frames: this.acidSprite.anims.generateFrameNames("coin", {
        start: 1,
        end: 4,
        prefix: "coinSpin00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.acidSprite.anims.play("run", true);

    this.acidpart = scene.add.rectangle(0, 0, 1400, 1040, 0x80ca20);
    this.acidpart.setDepth(1);
    this.acidpart.setPosition(x, y + 520);
  }

  meltSound() {
    if (!this.acidSplashAudio.isPlaying) {
      this.acidSplashAudio.play();
    }
  }

  update() {
    // set animation frame
    this.acidTileSprite.setFrame(this.acidSprite.anims.currentFrame.index + 54);
    // move acid up
    this.acidSprite.y -= 0.5;
    this.acidpart.y -= 0.5;
    this.acidTileSprite.y -= 0.5;
  }
}

export default Acid;
