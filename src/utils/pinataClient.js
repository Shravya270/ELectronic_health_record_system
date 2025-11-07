/**
 * Pinata IPFS Client Utility (JWT Authentication)
 * Handles file uploads to IPFS using Pinata v3 REST API
 * Uses JWT authentication via REACT_APP_PINATA_JWT
 */

/**
 * Get authentication headers for Pinata API
 * Uses JWT-based authentication
 * @returns {Object} Headers object with Authorization header
 * @throws {Error} If JWT is missing
 */
const getPinataAuthHeaders = () => {
    const jwt = process.env.REACT_APP_PINATA_JWT;
  
    // Check if JWT exists
    if (jwt && jwt.trim() !== '') {
      console.log('🔐 Using JWT authentication');
      return {
        Authorization: `Bearer ${jwt}`,
      };
    }
  
    // No JWT found
    throw new Error(
      'Missing Pinata JWT. Please add REACT_APP_PINATA_JWT to your .env file.'
    );
  };
  
  /**
   * Upload a file to Pinata IPFS (v3 API)
   * @param {File} file - The file to upload
   * @returns {Promise<string>} IPFS hash (CID)
   * @throws {Error} If credentials are missing or upload fails
   */
  export const uploadFileToPinata = async (file) => {
    console.log('🔍 Checking Pinata JWT...');
  
    const jwt = process.env.REACT_APP_PINATA_JWT;
    console.log('JWT present:', !!jwt);
  
    // Get authentication headers
    let authHeaders;
    try {
      authHeaders = getPinataAuthHeaders();
    } catch (error) {
      console.error('❌ Missing Pinata JWT');
      throw error;
    }
  
    // Validate file
    if (!file || !file.name) {
      throw new Error('Invalid file. Please select a valid file to upload.');
    }
  
    console.log('📤 Uploading file to Pinata (v3 API)...');
    console.log('File name:', file.name);
    console.log('File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
  
    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedBy: 'Secure Electronic Health Records',
        uploadDate: new Date().toISOString(),
      },
    });
    formData.append('metadata', metadata);
  
    // Optional upload options
    const options = JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false,
    });
    formData.append('pinataOptions', options);
  
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 sec timeout
  
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Pinata upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
  
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Pinata authentication failed. Please verify your JWT token in .env file.'
          );
        }
  
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and retry.');
        }
  
        throw new Error(
          `Failed to upload file to Pinata: ${
            errorData.error?.details || response.statusText || 'Unknown error'
          }`
        );
      }
  
      const data = await response.json();
      console.log('✅ File uploaded successfully to Pinata:', data);
  
      const ipfsHash = data.cid || data.IpfsHash;
      if (!ipfsHash) {
        throw new Error('Failed to retrieve IPFS hash from Pinata response.');
      }
  
      console.log('📋 IPFS Hash (CID):', ipfsHash);
      return ipfsHash;
    } catch (error) {
      console.error('❌ Error uploading to Pinata:', error);
  
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error('File upload timeout. Please try again.');
      }
  
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Failed to connect to Pinata. Check your internet connection.');
      }
  
      if (error.message.includes('authentication failed')) {
        throw error;
      }
  
      throw new Error(
        `Failed to upload file to IPFS. Please retry. ${
          error.message ? `(${error.message})` : ''
        }`
      );
    }
  };
  
  /**
   * Verify JWT configuration
   * @returns {boolean} True if JWT is present
   */
  export const checkPinataCredentials = () => {
    const jwt = process.env.REACT_APP_PINATA_JWT;
    return !!(jwt && jwt.trim() !== '');
  };
  