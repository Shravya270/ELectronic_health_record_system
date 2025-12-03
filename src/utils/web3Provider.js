/**
 * Centralized Web3 provider and account management
 * Always uses Ganache network (Chain ID 1337)
 * Automatically switches to Ganache network if needed
 */

import Web3 from "web3";
import { validateNetwork, REQUIRED_NETWORK_ID, REQUIRED_NETWORK_NAME, REQUIRED_RPC_URL } from "./ensureNetwork";

let web3Instance = null;
let currentAccount = null;
let networkListeners = [];

/**
 * Switch to Ganache network automatically
 * @returns {Promise<boolean>} True if switched successfully, false otherwise
 */
const switchToGanacheNetwork = async () => {
  try {
    // Try to switch to Ganache network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${REQUIRED_NETWORK_ID.toString(16)}` }], // Convert to hex
    });
    console.log(`✓ Switched to ${REQUIRED_NETWORK_NAME} network`);
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add Ganache network to MetaMask
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${REQUIRED_NETWORK_ID.toString(16)}`,
              chainName: REQUIRED_NETWORK_NAME,
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [REQUIRED_RPC_URL],
              blockExplorerUrls: null,
            },
          ],
        });
        console.log(`✓ Added and switched to ${REQUIRED_NETWORK_NAME} network`);
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw new Error(
          `Failed to add ${REQUIRED_NETWORK_NAME} network to MetaMask. ` +
          `Please add it manually: RPC URL: ${REQUIRED_RPC_URL}, Chain ID: ${REQUIRED_NETWORK_ID}`
        );
      }
    } else if (switchError.code === 4001) {
      // User rejected the request
      throw new Error("Please approve the network switch in MetaMask to continue.");
    } else {
      console.error('Error switching network:', switchError);
      throw new Error(
        `Failed to switch to ${REQUIRED_NETWORK_NAME} network. ` +
        `Please switch manually in MetaMask to: ${REQUIRED_RPC_URL} (Chain ID: ${REQUIRED_NETWORK_ID})`
      );
    }
  }
};

/**
 * Initialize Web3 and get account
 * Automatically switches to Ganache network if needed
 * @returns {Promise<{web3: Web3, account: string, networkId: number}>}
 * @throws {Error} If MetaMask not available, user rejects, or connection fails
 */
export const getWeb3AndAccount = async () => {
  // Check if MetaMask is available
  if (!window.ethereum) {
    const errorMsg = "MetaMask not detected. Please install MetaMask extension from https://metamask.io/";
    console.error("❌", errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log("🔄 Requesting MetaMask account access...");
    
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      const errorMsg = "No accounts found. Please unlock MetaMask and try again.";
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`✓ MetaMask account accessed: ${accounts[0]}`);

    // Create Web3 instance
    if (!web3Instance) {
      web3Instance = new Web3(window.ethereum);
      console.log("✓ Web3 instance created");
    }

    // Get current account
    currentAccount = accounts[0];

    // Get network ID
    const networkId = await web3Instance.eth.net.getId();
    console.log(`📡 Current network ID: ${networkId}`);

    // Check if we're on the correct network
    if (networkId !== REQUIRED_NETWORK_ID) {
      console.warn(`⚠️  Wrong network detected (${networkId}). Switching to Ganache (${REQUIRED_NETWORK_ID})...`);
      
      // Try to switch to Ganache network
      await switchToGanacheNetwork();
      
      // Wait a bit for the switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get network ID again after switch
      const newNetworkId = await web3Instance.eth.net.getId();
      console.log(`📡 New network ID: ${newNetworkId}`);
      
      // Validate network again
      if (newNetworkId !== REQUIRED_NETWORK_ID) {
        const errorMsg = `Failed to switch to ${REQUIRED_NETWORK_NAME} network. Please switch manually in MetaMask.`;
        console.error("❌", errorMsg);
        throw new Error(errorMsg);
      }
      
      // Update networkId to the new one
      const finalNetworkId = newNetworkId;
      console.log(`✓ Connected to network ${finalNetworkId} (${REQUIRED_NETWORK_NAME})`);
      console.log(`✓ Account: ${currentAccount}`);

      return {
        web3: web3Instance,
        account: currentAccount,
        networkId: finalNetworkId,
      };
    }

    console.log(`✓ Connected to network ${networkId} (${REQUIRED_NETWORK_NAME})`);
    console.log(`✓ Account: ${currentAccount}`);

    return {
      web3: web3Instance,
      account: currentAccount,
      networkId: networkId,
    };
  } catch (error) {
    console.error("❌ Error in getWeb3AndAccount:", error);
    
    if (error.code === 4001) {
      throw new Error("Please connect your MetaMask account to continue.");
    }
    
    // Re-throw with the error message
    throw error;
  }
};

/**
 * Setup event listeners for account and network changes
 * @param {Function} onAccountsChanged - Callback when accounts change
 * @param {Function} onChainChanged - Callback when chain changes
 * @returns {Function} Cleanup function to remove listeners
 */
export const setupNetworkListeners = (onAccountsChanged, onChainChanged) => {
  if (!window.ethereum) {
    return () => {}; // No-op cleanup
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      currentAccount = null;
      onAccountsChanged(null);
    } else {
      currentAccount = accounts[0];
      onAccountsChanged(currentAccount);
    }
  };

  const handleChainChanged = (chainId) => {
    console.log("🔄 Chain changed detected:", chainId);
    // Convert hex chainId to number
    const chainIdNum = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
    
    if (chainIdNum !== REQUIRED_NETWORK_ID) {
      console.warn(`⚠️  Switched to wrong network (${chainIdNum}). Expected ${REQUIRED_NETWORK_ID}.`);
    }
    
    // Reload page on network change to reinitialize
    window.location.reload();
  };

  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', handleChainChanged);

  // Store for cleanup
  const cleanup = () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  };

  networkListeners.push(cleanup);
  return cleanup;
};

/**
 * Get cached Web3 instance (if available)
 * @returns {Web3|null}
 */
export const getCachedWeb3 = () => {
  return web3Instance;
};

/**
 * Get cached account (if available)
 * @returns {string|null}
 */
export const getCachedAccount = () => {
  return currentAccount;
};

/**
 * Clear cached instances (useful for testing or logout)
 */
export const clearCache = () => {
  web3Instance = null;
  currentAccount = null;
  networkListeners.forEach(cleanup => cleanup());
  networkListeners = [];
};

