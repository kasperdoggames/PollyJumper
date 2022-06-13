# Polly Jumper ChainLink Game

## Game Overview

You play as Polly in a multiplayer platform game. Polly is a personification of the Polygon logo and is racing to ring that finish bell before anyone else!

Polly can jump and double jump to reach higher platforms to avoid drowning in water or dying in other unfortunate ways.

In order to play the game, the user is required to mint a unqiue Polly NFT through the web app via the use of MetaMask crypto wallet.

Once the NFT is minted via the smart contract, the user is awarded 10 $cool tokens.
$cool tokens can be staked to play the game (each game requires 1 $cool token). If the user wins the game, they are awarded all staked tokens. If nobody wins, all staked cool tokens are lost.

More information on the smart contracts used to control this can be found [here](https://github.com/kasperdoggames/PollyJumper/tree/main/hardhat)

## Web Client

The web client is built using [NextJS](https://nextjs.org/), styled with [tailwindcss](https://tailwindcss.com/) and is using a custom [Express](https://expressjs.com/) backend server running on Node V16.

The smart contracts and MetaMask integration are built using [ethers](https://docs.ethers.io/v5/) and [rainbowkit](https://github.com/rainbow-me/rainbowkit)

NFT images are stored vis ipfs using [nft.storage](https://nft.storage/)

## Game Engine

The game mechanics and logic is developed using [Phaser 3.5](https://phaser.io/) and [MatterJS](https://brm.io/matter-js/).

Mulitplayer features are possible via the use of [socket.io](https://socket.io/).

## Getting Started

### Requirements

An `.env.local` file is required in the root folder with the following variables:

```env
ALCHEMY_ID=
SIGNER_WALLET_KEY=
```

### Running the application locally

- `npm i`
- `npm run dev`

## Contracts

The three Contracts are deployed to Polygon Testnet.

GameToken deployed to: `0x8C45664D025E6Ad8A736aD710D7742d04e174700`

GameNFTToken deployed to: `0x929e9F17282C4126A727773722250De046b7B41f`

P2EGame deployed to: `0xe5962FEf7e5dB9fF80F2fe0D128EA038826D1a11`

## IPFS

NFT Images: ipfs://bafybeiafdnqwc7iwpji5ze2udyf3jtk6b4fl5ydmj4u7mf4z3kul7gacuq/
NFT Metadata: ipfs://bafybeiaffsmzgb3xkth42qqtfuvbbr5caekzyvqugznkjdijhkfk2o7ezy/
