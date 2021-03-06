import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getP2EGameContract, getGameTokenContract } from "../support/eth";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { BaseProvider } from "@ethersproject/providers";
import { GetAccountResult } from "@wagmi/core";
import { P2EGAME_CONTRACT_ADDRESS } from "../support/contract_addresses";

export default function Home() {
  type GameSates = "Begin" | "New" | "Started" | "Finished";

  const GameSessionStateEnum: {
    [key: number]: GameSates;
  } = {
    0: "Begin",
    1: "New",
    2: "Started",
    3: "Finished",
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const { data } = useAccount();
  // const [cryptAccount, setCryptAccount] =
  //   useState<GetAccountResult<BaseProvider>>();
  const [gameSessionState, setGameSessionState] = useState<GameSates | null>(
    null
  );
  const [gameTokenBalance, setGameTokenBalance] = useState<number | null>(null);
  const [playersAddedToGame, setPlayersAddedToGame] = useState<string[]>([]);
  const [currentGameId, setCurrentGameId] = useState<number>(0);

  const handlePlayerWonEvent = async (address: string, timestamp: number) => {
    console.log("PlayerWonEvent", address, new Date(timestamp).toISOString());
  };

  // useEffect(() => {
  //   if (account) {
  //     setCryptAccount(account);
  //   }
  // }, [account]);

  useEffect(() => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (!p2eGameContract) {
      return;
    }

    p2eGameContract.on("PlayerWon", (address: string) => {
      console.log("PlayerWon", address);
      handlePlayerWonEvent(address, Date.now());
    });

    p2eGameContract.on("AllPlayersLost", (gameId) => {
      console.log("AllPlayersLost", Number(gameId));
    });

    p2eGameContract.on("NewGame", (gameId) => {
      console.log("NewGame", Number(gameId));
      setCurrentGameId(Number(gameId));
      setPlayersAddedToGame([]);
      fetchGameSessionState();
    });

    p2eGameContract.on("GameStarted", (gameId) => {
      console.log("GameStarted", Number(gameId));
      fetchGameSessionState();
      fetchPlayerTokenBalance();
    });

    p2eGameContract.on("GameFinished", (gameId) => {
      console.log("GameFinished", Number(gameId));
      fetchGameSessionState();
      fetchPlayerTokenBalance();
    });

    p2eGameContract.on("GameSettled", (gameId) => {
      console.log("GameSettled", Number(gameId));
      fetchGameSessionState();
    });

    p2eGameContract.on(
      "PlayerJoinedGame",
      (address: string, clientId: string) => {
        console.log("PlayerJoinedGame", address, clientId);
        fetchPlayersAddedToGame();
      }
    );

    return () => {
      p2eGameContract.removeAllListeners("PlayerWon");
      p2eGameContract.removeAllListeners("NewGame");
      p2eGameContract.removeAllListeners("GameStarted");
      p2eGameContract.removeAllListeners("GameFinished");
      p2eGameContract.removeAllListeners("GameSettled");
      p2eGameContract.removeAllListeners("PlayerJoinedGame");
    };
  }, []);

  const fetchGameSessionState = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      const state: number = await p2eGameContract.gameSessionState();
      setGameSessionState(GameSessionStateEnum[state]);
    }
  };

  const fetchPlayerTokenBalance = async () => {
    const { ethereum } = window;
    const gameTokenContract = getGameTokenContract(ethereum);
    if (gameTokenContract && data) {
      const balance = await gameTokenContract.balanceOf(data.address);
      let res = Number(ethers.utils.formatUnits(balance, 18));
      res = Math.round(res * 1e4) / 1e4;
      setGameTokenBalance(res);
    }
  };

  const fetchPlayersAddedToGame = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      const gameId = await p2eGameContract.gameId();
      console.log({ gameId });
      setCurrentGameId(Number(gameId));
      const gameSession = await p2eGameContract.getGameSessions(Number(gameId));
      console.log(gameSession.players);
      setPlayersAddedToGame(gameSession.players);
    }
  };

  useEffect(() => {
    console.log("fetchGameSessionState");
    fetchGameSessionState();
    console.log("fetchPlayerTokenBalance");
    fetchPlayerTokenBalance();
    console.log("fetchPlayersAddedToGame");
    fetchPlayersAddedToGame();
  }, [data]);

  const handleCheckUpkeep = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      console.log("performUpkeep");
      const tx = await p2eGameContract.performUpkeep([]);
      console.log(tx);
      const receipt = await tx.wait();
      console.log(receipt);
      fetchGameSessionState();
    }
  };

  const handleAddPlayer = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      console.log("addPlayerToGameSession");
      try {
        const clientId = 1; // represents the socket.io client id
        const tx = await p2eGameContract.addPlayerToGameSession(clientId);
        console.log(tx);
        const receipt = await tx.wait();
        console.log(receipt);
        fetchGameSessionState();
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleMintNFT = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      console.log("mintOne");
      try {
        const tx = await p2eGameContract.mintOne({
          value: ethers.utils.parseEther("0.05"),
        });
        console.log(tx);
        const receipt = await tx.wait();
        console.log(receipt);
        fetchGameSessionState();
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleStakeFunds = async () => {
    const { ethereum } = window;
    const gameTokenContract = getGameTokenContract(ethereum);
    if (gameTokenContract) {
      console.log("approve");
      try {
        const tx = await gameTokenContract.approve(
          P2EGAME_CONTRACT_ADDRESS,
          ethers.utils.parseEther("10")
        );
        console.log(tx);
        const receipt = await tx.wait();
        console.log(receipt);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handlePlayerWon = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract && inputRef.current) {
      const playerAddress = inputRef.current.value.trim();
      if (playerAddress) {
        console.log("playerWon: ", playerAddress);
        try {
          const tx = await p2eGameContract.playerWon(playerAddress);
          console.log(tx);
          const receipt = await tx.wait();
          console.log(receipt);
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  return (
    <div className="">
      <Head>
        <title>Polly Jumper Testing</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center h-screen space-y-5">
        <ConnectButton />
        {/* {account && ( */}
        <div className="flex flex-col items-center justify-center space-y-5">
          <div>STATES: BEGIN : NEW : STARTED : FINISHED : NEW etc.</div>
          <div className="flex space-x-1">
            <div>Game ID:</div>
            <div>{currentGameId}</div>
          </div>
          <div className="flex space-x-1">
            <div>Token Balance:</div>
            <div>{gameTokenBalance}</div>
          </div>
          <div className="flex space-x-1">
            <div>Game Players:</div>
            <ul>
              {playersAddedToGame.map((player, index) => {
                return <li key={index}>{player}</li>;
              })}
            </ul>
          </div>
          <div className="text-xl font-bold">
            Game Session State: {gameSessionState}
          </div>
          <button
            className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
            onClick={handleMintNFT}
          >
            Mint NFT
          </button>
          <button
            className="px-4 py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-400"
            onClick={handleCheckUpkeep}
          >
            Check Upkeep
          </button>
          <button
            className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
            onClick={handleStakeFunds}
          >
            Stake Funds
          </button>
          <button
            className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
            onClick={handleAddPlayer}
          >
            Add Player
          </button>
          <div className="flex space-x-2">
            <div className="font-bold ">Winning Player Address:</div>
            <input className="border-2" ref={inputRef} type="text"></input>
          </div>
          <button
            className="px-4 py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-400"
            onClick={handlePlayerWon}
          >
            Player Won
          </button>
        </div>
        {/* )} */}
      </main>
    </div>
  );
}
