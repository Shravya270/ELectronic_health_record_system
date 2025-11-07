/**
 * Infura IPFS Client Utility
 * Handles IPFS connection using Infura API with authentication
 */

import { create } from 'ipfs-http-client';

/**
 * Helper function to encode string to Base64 (browser-compatible)
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 */
const encodeBase64 = (str) => {
  try {
    // Use btoa for browser compatibility
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    // Fallback for Node.js environment
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8').toString('base64');
    }
    throw new Error('Base64 encoding not available');
  }
};

/**
 * Initialize IPFS client with Infura authentication
 * Uses environment variables: REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_API_SECRET
 * @returns {Promise<IPFSClient>} IPFS client instance
 * @throws {Error} If credentials are missing or connection fails
 */
export const initInfuraIPFS = async () => {
  const projectId = process.env.REACT_APP_PINATA_API_KEY;
  const projectSecret = process.env.REACT_APP_PINATA_API_SECRET;

  // Debug: Log if env vars are detected (without exposing secrets)
  console.log('🔍 Checking Infura credentials...');
  console.log('Project ID present:', !!projectId);
  console.log('Project Secret present:', !!projectSecret);

  // Check if credentials are available
  if (!projectId || !projectSecret) {
    const missingVars = [];
    if (!projectId) missingVars.push('REACT_APP_PINATA_API_KEY');
    if (!projectSecret) missingVars.push('REACT_APP_PINATA_API_SECRET');
    
    console.error('❌ Missing Infura credentials:', missingVars);
    throw new Error(
      `Missing Infura credentials — please check your .env configuration. Missing: ${missingVars.join(', ')}`
    );
  }

  // Create authorization header using Base64 encoding
  const authString = `${projectId}:${projectSecret}`;
  const auth = 'Basic ' + encodeBase64(authString);

  console.log('🔐 Creating IPFS client with Infura authentication...');
  console.log('Endpoint: https://ipfs.infura.io:5001/api/v0');

  // Create IPFS client with Infura endpoint and authentication
  // Using standard format: host, port, protocol, apiPath, headers
  const ipfsClient = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    apiPath: '/api/v0',
    headers: {
      authorization: auth,
    },
  });

  // Test connection with detailed error logging
  try {
    console.log('🔄 Testing IPFS connection...');
    const id = await ipfsClient.id();
    console.log('✅ IPFS connection successful!', { id: id.id });
    return ipfsClient;
  } catch (error) {
    console.error('❌ IPFS connection test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response,
    });

    // Provide more specific error messages
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      throw new Error(
        'Infura authentication failed. Please verify your Project ID and Secret in .env file.'
      );
    }
    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      throw new Error(
        'Network error connecting to Infura IPFS. Please check your internet connection.'
      );
    }
    
    throw new Error(
      `Failed to connect to Infura IPFS: ${error.message || 'Unknown error'}. Please check your Infura credentials or internet connection.`
    );
  }
};

/**
 * Check IPFS connection status
 * @param {IPFSClient} ipfsClient - IPFS client instance
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export const checkIPFSConnection = async (ipfsClient) => {
  try {
    if (!ipfsClient) {
      return false;
    }
    await ipfsClient.id();
    return true;
  } catch (error) {
    console.error('IPFS connection check failed:', error);
    return false;
  }
};

