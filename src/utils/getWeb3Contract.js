import { initWallet } from "./connectWallet";

// artifact is the JSON from build/contracts/*.json
export const getContractInstance = async (artifact) => {
  const { web3, networkId } = await initWallet({ eager: true });
  const netData =
    artifact.networks?.[networkId] ||
    artifact.networks?.[String(networkId)] ||
    artifact.networks?.[Number(networkId)];

  if (!netData?.address) {
    throw new Error(
      `${artifact.contractName || "Contract"} not deployed on network ${networkId}. ` +
        `Re-run migrations for this network.`
    );
  }

  return new web3.eth.Contract(artifact.abi, netData.address);
};


