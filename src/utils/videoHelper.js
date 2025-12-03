/**
 * Video Helper Utility for Stream API Communication
 * Handles Stream token generation and video session setup
 */

/**
 * Get Stream authentication token from backend
 * @param {string} walletAddress - User's Ethereum wallet address
 * @returns {Promise<{token: string, userId: string}>}
 */
export async function getStreamToken(walletAddress) {
  try {
    // Prefer explicit base URL; fallback to proxy path if CRA proxy is set
    const explicitBase = process.env.REACT_APP_STREAM_API_BASE_URL;
    const url = explicitBase
      ? `${explicitBase.replace(/\/$/, "")}/auth/token`
      : "/api/stream/token";

    const body = explicitBase
      ? JSON.stringify({ walletAddress })
      : JSON.stringify({ userId: walletAddress.toLowerCase() });

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Support both /api/ehr/auth/token and /api/stream/token responses
    if (data.token) {
      return {
        token: data.token,
        userId: data.userId || walletAddress.toLowerCase(),
      };
    }

    throw new Error("Invalid token response from server");
  } catch (error) {
    console.error("Error fetching Stream token:", error);
    throw new Error(`Failed to get Stream token: ${error.message}`);
  }
}

/**
 * Get user details from wallet address (for Stream user creation)
 * @param {string} walletAddress - User's Ethereum wallet address
 * @returns {Promise<{id: string, name?: string}>}
 */
export async function getStreamUserDetails(walletAddress) {
  // Use wallet address as Stream user ID
  return {
    id: walletAddress.toLowerCase(),
    name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
  };
}

/**
 * Generate a unique call ID for video session
 * Format: ehr-{timestamp}-{random}
 * @returns {string}
 */
export function generateCallId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `ehr-${timestamp}-${random}`;
}

