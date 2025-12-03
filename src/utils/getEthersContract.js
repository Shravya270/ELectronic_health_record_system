import { ethers } from "ethers";
import { connectWallet, getProvider } from "./ethersWallet";

export const getEthersContract = async (artifact) => {
  const { provider } = await connectWallet();
  const network = await provider.getNetwork();
  const networkId = Number(network.chainId);
  const netData =
    artifact.networks?.[networkId] ||
    artifact.networks?.[String(networkId)] ||
    artifact.networks?.[Number(networkId)];
  if (!netData?.address) {
    throw new Error(
      `${artifact.contractName || "Contract"} not deployed on network ${networkId}.`
    );
  }
  return new ethers.Contract(netData.address, artifact.abi, provider);
};

export const getEthersSigner = async () => {
  const { signer } = await connectWallet();
  return signer;
};




