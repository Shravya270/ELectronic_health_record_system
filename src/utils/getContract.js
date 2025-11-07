/**
 * Centralized contract initialization
 * Always uses network 1337 from artifact
 * @param {object} artifact - Contract JSON from build/contracts/
 * @param {Web3} web3 - Web3 instance
 * @param {number} networkId - Current network ID (should be 1337)
 * @returns {Contract} Web3 contract instance
 * @throws {Error} If contract not deployed on network 1337
 */
export const getContract = (artifact, web3, networkId) => {
  if (!artifact) {
    throw new Error("Contract artifact is required");
  }

  if (!web3) {
    throw new Error("Web3 instance is required");
  }

  // Try both string and number keys (Truffle may store as either)
  const networkData = artifact.networks[networkId] 
    || artifact.networks[networkId.toString()] 
    || artifact.networks[String(networkId)];

  if (!networkData || !networkData.address) {
    const contractName = artifact.contractName || "Contract";
    throw new Error(
      `${contractName} not deployed on network ${networkId}. ` +
      `Re-run: cd src && truffle migrate --network development --reset`
    );
  }

  return new web3.eth.Contract(artifact.abi, networkData.address);
};

/**
 * Get contract address from artifact
 * @param {object} artifact - Contract JSON from build/contracts/
 * @param {number} networkId - Network ID (should be 1337)
 * @returns {string|null} Contract address or null if not deployed
 */
export const getContractAddress = (artifact, networkId) => {
  if (!artifact || !artifact.networks) {
    return null;
  }

  const networkData = artifact.networks[networkId] 
    || artifact.networks[networkId.toString()] 
    || artifact.networks[String(networkId)];

  return networkData?.address || null;
};

