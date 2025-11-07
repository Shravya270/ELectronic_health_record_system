/**
 * Centralized network validation and error messages
 * Ensures the app always uses Ganache network (Chain ID 1337)
 */

export const REQUIRED_NETWORK_ID = 1337;
export const REQUIRED_NETWORK_NAME = "Ganache";
export const REQUIRED_RPC_URL = "http://127.0.0.1:7545";

/**
 * Get friendly error message when network is incorrect
 * @param {number} currentNetworkId - The current network ID
 * @returns {string} Error message
 */
export const getNetworkError = (currentNetworkId) => {
  return `Please switch MetaMask to ${REQUIRED_NETWORK_NAME} (${REQUIRED_RPC_URL}, Chain ID ${REQUIRED_NETWORK_ID}). Currently connected to network ${currentNetworkId}.`;
};

/**
 * Validate that the current network is the required Ganache network
 * @param {number} networkId - The network ID to validate
 * @throws {Error} If network ID is not 1337
 */
export const validateNetwork = (networkId) => {
  if (networkId !== REQUIRED_NETWORK_ID) {
    throw new Error(getNetworkError(networkId));
  }
};

/**
 * Get network status message
 * @param {number} networkId - Current network ID
 * @param {string} account - Current account address
 * @returns {object} Status object with message and isConnected flag
 */
export const getNetworkStatus = (networkId, account) => {
  if (!window.ethereum) {
    return {
      message: "MetaMask not detected. Please install MetaMask extension.",
      isConnected: false,
      isCorrectNetwork: false,
    };
  }

  if (!account) {
    return {
      message: "Connecting wallet...",
      isConnected: false,
      isCorrectNetwork: false,
    };
  }

  if (networkId !== REQUIRED_NETWORK_ID) {
    return {
      message: getNetworkError(networkId),
      isConnected: true,
      isCorrectNetwork: false,
    };
  }

  return {
    message: `Connected to ${REQUIRED_RPC_URL} (${REQUIRED_NETWORK_ID})`,
    account: account,
    isConnected: true,
    isCorrectNetwork: true,
  };
};

