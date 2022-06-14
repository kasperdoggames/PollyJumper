export class SpaceGas {
  scene!: Phaser.Scene;
  gasTileSprite!: Phaser.GameObjects.TileSprite;
  gasSprite!: Phaser.Physics.Matter.Sprite;
  gasPart!: Phaser.GameObjects.Rectangle;
  acidSplashAudio!: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    // add audio
    this.acidSplashAudio = scene.sound.add("acidSplash");
    // create a tile sprite from loaded spritesheet
    this.gasTileSprite = scene.add.tileSprite(x, y, 1400, 70, "gasTileSprites");
    this.gasTileSprite.setPosition(x, y);
    this.gasTileSprite.setFrame(55);

    this.gasSprite = scene.matter.add
      .sprite(x, y, "gasSprite")
      .setVisible(false);

    this.gasSprite.setStatic(true);
    this.gasSprite.setPosition(x, y + 15);
    this.gasSprite.setDepth(2);
    this.gasSprite.setName("gasSprite");
    this.gasSprite.setDisplaySize(1400, 70);

    // this will be hidden but something to get a frame index
    this.gasSprite.anims.create({
      key: "run",
      frameRate: 10,
      frames: this.gasSprite.anims.generateFrameNames("coin", {
        start: 1,
        end: 4,
        prefix: "coinSpin00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.gasSprite.anims.play("run", true);

    this.gasPart = scene.add.rectangle(0, 0, 1400, 1040, 0xb62fb1);
    this.gasPart.setDepth(1);
    this.gasPart.setPosition(x, y + 520);
  }

  meltSound() {
    if (!this.acidSplashAudio.isPlaying) {
      this.acidSplashAudio.play();
    }
  }

  update() {
    // set animation frame
    this.gasTileSprite.setFrame(this.gasSprite.anims.currentFrame.index + 54);
    // move acid up
    this.gasSprite.y -= 0.5;
    this.gasPart.y -= 0.5;
    this.gasTileSprite.y -= 0.5;
  }
}

export default SpaceGas;
