import React, { useState, useEffect } from "react";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getNetworkStatus } from "../utils/ensureNetwork";
import "../CSS/ConnectionBanner.css";

const ConnectionBanner = () => {
  const [status, setStatus] = useState({
    message: "Connecting wallet...",
    isConnected: false,
    isCorrectNetwork: false,
    account: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const init = async () => {
    try {
      setIsConnecting(true);
      const { account, networkId } = await getWeb3AndAccount();
      const networkStatus = getNetworkStatus(networkId, account);
      setStatus(networkStatus);
    } catch (error) {
      console.error("Connection error:", error);
      setStatus({
        message: error.message,
        isConnected: false,
        isCorrectNetwork: false,
        account: null,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    init();

    // Setup listeners
    const cleanup = setupNetworkListeners(
      (account) => {
        // Account changed
        if (account) {
          init();
        } else {
          setStatus({
            message: "Please connect your MetaMask account.",
            isConnected: false,
            isCorrectNetwork: false,
            account: null,
          });
        }
      },
      () => {
        // Chain changed - page will reload
      }
    );

    return cleanup;
  }, []);

  const handleConnect = async () => {
    await init();
  };

  if (status.isConnected && status.isCorrectNetwork) {
    return (
      <div className="connection-banner connected">
        <div className="banner-content">
          <span className="banner-icon">✓</span>
          <span className="banner-text">{status.message}</span>
          {status.account && (
            <span className="banner-account">
              Account: {status.account.substring(0, 6)}...{status.account.substring(38)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`connection-banner ${status.isCorrectNetwork ? "warning" : "error"}`}>
      <div className="banner-content">
        <span className="banner-icon">{status.isCorrectNetwork ? "⚠" : "✗"}</span>
        <span className="banner-text">{status.message}</span>
        {!status.isConnected && (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="banner-connect-button"
            title="Click to connect MetaMask"
          >
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        )}
        {status.isConnected && !status.isCorrectNetwork && (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="banner-connect-button"
            title="Click to switch to Ganache network"
          >
            {isConnecting ? "Switching..." : "Switch Network"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionBanner;

