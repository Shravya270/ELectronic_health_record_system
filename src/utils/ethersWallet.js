// Ethers.js MetaMask connector
import { ethers } from "ethers";

export const REQUIRED_CHAIN_ID = 1337; // Ganache default
export const REQUIRED_RPC_URL = "http://127.0.0.1:7545";
export const REQUIRED_NETWORK_NAME = "Ganache";

let provider = null;
let signer = null;

export const isMetaMaskInstalled = () =>
  typeof window !== "undefined" && !!window.ethereum;

const toHexChainId = (n) => `0x${Number(n).toString(16)}`;

export const getProvider = () => {
  if (!isMetaMaskInstalled()) throw new Error("MetaMask not detected.");
  if (!provider) {
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
};

export const ensureCorrectNetwork = async () => {
  const prov = getProvider();
  const network = await prov.getNetwork();
  if (Number(network.chainId) === REQUIRED_CHAIN_ID) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(REQUIRED_CHAIN_ID) }],
    });
  } catch (err) {
    if (err?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: toHexChainId(REQUIRED_CHAIN_ID),
            chainName: REQUIRED_NETWORK_NAME,
            rpcUrls: [REQUIRED_RPC_URL],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: [],
          },
        ],
      });
    } else if (err?.code === 4001) {
      throw new Error("Please approve the network switch in MetaMask.");
    } else {
      throw new Error(`Please switch to ${REQUIRED_NETWORK_NAME} in MetaMask.`);
    }
  }
};

export const connectWallet = async () => {
  const prov = getProvider();
  await ensureCorrectNetwork();
  await prov.send("eth_requestAccounts", []);
  signer = await prov.getSigner();
  const address = await signer.getAddress();
  const network = await prov.getNetwork();
  console.log("[ethers] connected:", address, "chain:", Number(network.chainId));
  return { provider: prov, signer, address, networkId: Number(network.chainId) };
};

export const onWalletEvents = (onAccounts, onChain) => {
  if (!isMetaMaskInstalled()) return () => {};
  const acc = async (accs) => {
    onAccounts?.(accs?.[0] || null);
  };
  const ch = async (hexId) => {
    onChain?.(parseInt(hexId, 16));
  };
  window.ethereum.on("accountsChanged", acc);
  window.ethereum.on("chainChanged", ch);
  return () => {
    window.ethereum.removeListener("accountsChanged", acc);
    window.ethereum.removeListener("chainChanged", ch);
  };
};




