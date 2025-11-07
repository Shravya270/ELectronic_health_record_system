/**
 * Centralized Web3 provider and account management
 * Always uses Ganache network (Chain ID 1337)
 * No network switching - only validates and reports errors
 */

import Web3 from "web3";
import { validateNetwork, REQUIRED_NETWORK_ID } from "./ensureNetwork";

let web3Instance = null;
let currentAccount = null;
let networkListeners = [];

/**
 * Initialize Web3 and get account
 * Validates network is 1337 but does NOT switch networks
 * @returns {Promise<{web3: Web3, account: string, networkId: number}>}
 * @throws {Error} If MetaMask not available, user rejects, or wrong network
 */
export const getWeb3AndAccount = async () => {
  // Check if MetaMask is available
  if (!window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask extension.");
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock MetaMask and try again.");
    }

    // Create Web3 instance
    if (!web3Instance) {
      web3Instance = new Web3(window.ethereum);
    }

    // Get current account
    currentAccount = accounts[0];

    // Get network ID
    const networkId = await web3Instance.eth.net.getId();

    // Validate network (throws if not 1337)
    validateNetwork(networkId);

    console.log(`✓ Connected to network ${networkId} (Ganache)`);
    console.log(`✓ Account: ${currentAccount}`);

    return {
      web3: web3Instance,
      account: currentAccount,
      networkId: networkId,
    };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error("Please connect your MetaMask account to continue.");
    }
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

