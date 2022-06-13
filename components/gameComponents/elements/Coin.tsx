import { sharedInstance as events } from "../EventCenter";
import { CustomGameScene } from "../SocketClient";

export type CoinType = "dai" | "chainlink" | "matic" | "eth" | "encode";

export class Coins {
  coins: Map<string, Phaser.Physics.Matter.Sprite> = new Map();
  pickupSound!: Phaser.Sound.BaseSound;

  constructor(scene: CustomGameScene) {
    // Setup coins
    ["dai", "chainlink", "matic", "eth", "encode"].map((coinType) => {
      scene.data.set(coinType, 0);
    });

    // add pickup sound
    try {
      this.pickupSound = scene.sound.get("coinPickup");
      if (!this.pickupSound) {
        scene.sound.add("coinPickup");
        this.pickupSound = scene.sound.get("coinPickup");
      }
    } catch (err) {
      console.log(err);
      scene.sound.add("coinPickup");
      this.pickupSound = scene.sound.get("coinPickup");
    }
    // create anims
    scene.anims.create({
      key: "spin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpin00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    scene.anims.create({
      key: "ChainLinkSpin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpinLink00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    scene.anims.create({
      key: "MaticSpin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpinMatic00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    scene.anims.create({
      key: "EncodeSpin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpinEncode00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
  }

  addCoin(scene: CustomGameScene, x: number, y: number, coinType: CoinType) {
    const coin = scene.matter.add.sprite(x, y, "coin", "coinSpin0001.png", {
      isStatic: true,
      isSensor: true,
    });
    const currentCoinLength = this.coins.size;
    coin.setData("coinType", coinType);
    coin.setDisplaySize(70, 70);
    coin.setName("coin");
    switch (coinType) {
      case "matic":
        coin.anims.play("MaticSpin", true);
        coin.setData("id", `MaticCoin${currentCoinLength + 1}`);
        break;
      case "chainlink":
        coin.anims.play("ChainLinkSpin", true);
        coin.setData("id", `ChainLinkCoin${currentCoinLength + 1}`);
        break;
      case "dai":
        coin.anims.play("spin", true);
        coin.setData("id", `DaiCoin${currentCoinLength + 1}`);
        break;
      case "encode":
        coin.anims.play("EncodeSpin", true);
        coin.setData("id", `EncodeCoin${currentCoinLength + 1}`);
        break;
      default:
        break;
    }

    this.coins.set(coin.getData("id"), coin);
  }

  pickupCoin(scene: CustomGameScene, coin: Phaser.Physics.Matter.Sprite) {
    const coinType = coin.getData("coinType");
    const current = scene.data.get(coinType);
    const updated = current + 1;
    scene.data.set(coinType, updated);
    events.emit("coinCollected", { coinType, coinCount: updated });
    if (scene.socketClient) {
      scene.socketClient.socket.emit("coinCollected", coin.getData("id"));
    }
    this.playSound();
    coin.destroy();
  }

  findCoin(id: string) {
    const coin = this.coins.get(id);
    return coin;
  }

  playSound() {
    if (this.pickupSound) {
      this.pickupSound.play();
    }
  }
}
