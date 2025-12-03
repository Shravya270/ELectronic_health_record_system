// Production-ready MetaMask connector (Web3.js)
// - Detects MetaMask
// - Requests accounts on demand
// - Validates/switches network (Ganache defaults)
// - Exposes helpers for account/network state and listeners

import Web3 from "web3";

const REQUIRED_NETWORK_ID = 1337; // Ganache default (adjust if needed)
const REQUIRED_NETWORK_NAME = "Ganache";
const REQUIRED_RPC_URL = "http://127.0.0.1:7545";

let web3 = null;
let currentAccount = null;
let currentNetworkId = null;

const toHexChainId = (chainIdNum) => `0x${Number(chainIdNum).toString(16)}`;

export const isMetaMaskInstalled = () =>
  typeof window !== "undefined" && !!window.ethereum;

export const getWeb3Instance = () => {
  if (!web3) {
    if (!isMetaMaskInstalled()) throw new Error("MetaMask not detected.");
    web3 = new Web3(window.ethereum);
  }
  return web3;
};

export const ensureCorrectNetwork = async () => {
  const provider = window.ethereum;
  if (!provider) throw new Error("MetaMask not detected. Please install MetaMask.");

  const hexChainId = await provider.request({ method: "eth_chainId" });
  const detected = parseInt(hexChainId, 16);

  if (detected === REQUIRED_NETWORK_ID) return detected;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(REQUIRED_NETWORK_ID) }],
    });
    return REQUIRED_NETWORK_ID;
  } catch (switchErr) {
    if (switchErr?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: toHexChainId(REQUIRED_NETWORK_ID),
            chainName: REQUIRED_NETWORK_NAME,
            rpcUrls: [REQUIRED_RPC_URL],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: [],
          },
        ],
      });
      return REQUIRED_NETWORK_ID;
    }
    if (switchErr?.code === 4001) {
      throw new Error("Please approve the network switch in MetaMask.");
    }
    console.error("wallet_switchEthereumChain error:", switchErr);
    throw new Error(
      `Please switch MetaMask to ${REQUIRED_NETWORK_NAME} manually (Chain ID ${REQUIRED_NETWORK_ID}).`
    );
  }
};

export const getConnectedAccounts = async () => {
  if (!isMetaMaskInstalled()) return [];
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts || [];
  } catch (err) {
    console.error("eth_accounts error:", err);
    return [];
  }
};

export const requestAccounts = async () => {
  if (!isMetaMaskInstalled()) throw new Error("MetaMask not detected.");
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) throw new Error("No accounts returned from MetaMask.");
    return accounts;
  } catch (err) {
    if (err?.code === 4001)
      throw new Error("Please connect your MetaMask account to continue.");
    console.error("eth_requestAccounts error:", err);
    throw err;
  }
};

export const initWallet = async ({ eager = true } = {}) => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask not detected. Please install MetaMask extension from metamask.io.");
  }
  const w3 = getWeb3Instance();
  currentNetworkId = await ensureCorrectNetwork();

  let accounts = [];
  if (eager) {
    accounts = await getConnectedAccounts();
    if (!accounts.length) accounts = await requestAccounts();
  } else {
    accounts = await getConnectedAccounts();
  }

  currentAccount = accounts[0] || null;

  console.log("[wallet] connected account:", currentAccount);
  console.log("[wallet] network:", currentNetworkId);

  return { web3: w3, account: currentAccount, networkId: currentNetworkId };
};

export const connectWalletOnClick = async () => {
  const w3 = getWeb3Instance();
  currentNetworkId = await ensureCorrectNetwork();
  const accounts = await requestAccounts();
  currentAccount = accounts[0] || null;
  return { web3: w3, account: currentAccount, networkId: currentNetworkId };
};

export const setupWalletListeners = (onAccountsChanged, onChainChanged) => {
  if (!isMetaMaskInstalled()) return () => {};
  const provider = window.ethereum;

  const accHandler = (accs) => {
    currentAccount = accs?.[0] || null;
    console.log("[wallet] accountsChanged:", currentAccount);
    if (typeof onAccountsChanged === "function") onAccountsChanged(currentAccount);
  };

  const chainHandler = async (hexChainId) => {
    const id = parseInt(hexChainId, 16);
    currentNetworkId = id;
    console.log("[wallet] chainChanged:", id);
    if (typeof onChainChanged === "function") onChainChanged(id);
  };

  provider.on("accountsChanged", accHandler);
  provider.on("chainChanged", chainHandler);

  return () => {
    provider.removeListener("accountsChanged", accHandler);
    provider.removeListener("chainChanged", chainHandler);
  };
};


