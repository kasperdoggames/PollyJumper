import { UAuthConnector } from "@uauth/web3-react";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import UAuth from "@uauth/js";

// Instanciate your other connectors.
export const injected = new InjectedConnector({ supportedChainIds: [80001] });

export const walletconnect = new WalletConnectConnector({
  rpc: {
    137: process.env.NEXT_PUBLIC_APP_ALCHEMY_ID_POLYGON as string,
    80001: process.env.NEXT_PUBLIC_APP_ALCHEMY_ID_MUMBAI as string,
  },
  qrcode: true,
});

export const uauthConnector = new UAuthConnector({
  clientID: process.env.NEXT_PUBLIC_APP_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_APP_REDIRECT_URI,
  postLogoutRedirectUri: process.env.NEXT_PUBLIC_APP_POST_LOGOUT_REDIRECT_URI,
  // Scope must include openid and wallet
  scope: "openid wallet",

  // Injected and walletconnect connectors are required.
  connectors: { injected, walletconnect },
});

export const uauth = new UAuth({
  clientID: process.env.NEXT_PUBLIC_APP_CLIENT_ID as string,
  redirectUri: process.env.NEXT_PUBLIC_APP_REDIRECT_URI as string,
  postLogoutRedirectUri: process.env
    .NEXT_PUBLIC_APP_POST_LOGOUT_REDIRECT_URI as string,
  scope: "openid wallet",
});

const connectors = {
  injected,
  walletconnect,
  uauthConnector,
  uauth,
};

export default connectors;
