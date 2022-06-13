import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import Navbar from "../../components/Navbar";

const TestPlay: NextPage = () => {
  // Dynamic Loader to wait before loaing up the phaser game
  const DynamicLoader = dynamic(
    () => import("../../components/gameComponents/testGameManager"),
    {
      loading: () => <p></p>,
      ssr: false,
    }
  );

  return (
    <div className="bg-gray-900">
      {/* https://stackoverflow.com/questions/51217147/how-to-use-a-local-font-in-phaser-3 */}
      <div
        style={{
          fontFamily: "Splatch",
          position: "absolute",
          left: "-1000px",
          visibility: "hidden",
        }}
      >
        .
      </div>
      <div className="container h-full mx-auto max-w-7xl">
        <div>
          <Head>
            <title>Polly Jumper</title>
            <link
              rel="preload"
              as="font"
              href="/fonts/Splatch.ttf"
              type="font/ttf"
            />
          </Head>
          <Navbar currentPageHref="game" />
          <div className="flex flex-col items-center h-screen bg-gray-700">
            <div id="game"></div>
            <DynamicLoader />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPlay;
