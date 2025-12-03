import React, { useCallback, useEffect, useState } from "react";
import BrowseRouter from "./BrowseRouter";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faInstagram, faFacebookF, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { initWallet, connectWalletOnClick, setupWalletListeners, isMetaMaskInstalled } from "./utils/connectWallet";

library.add(faInstagram, faFacebookF, faLinkedinIn);

function App() {
  const [walletStatus, setWalletStatus] = useState({
    isInstalled: true,
    isConnecting: false,
    account: null,
    networkId: null,
    error: null,
  });

  const refreshState = useCallback(async () => {
    try {
      setWalletStatus((s) => ({ ...s, isConnecting: true, error: null }));
      const { account, networkId } = await initWallet({ eager: true });
      setWalletStatus({ isInstalled: true, isConnecting: false, account, networkId, error: null });
    } catch (err) {
      setWalletStatus({
        isInstalled: isMetaMaskInstalled(),
        isConnecting: false,
        account: null,
        networkId: null,
        error: err.message || String(err),
      });
    }
  }, []);

  useEffect(() => {
    refreshState();
    const cleanup = setupWalletListeners(
      () => refreshState(),
      () => refreshState()
    );
    return cleanup;
  }, [refreshState]);

  const handleConnect = async () => {
    try {
      setWalletStatus((s) => ({ ...s, isConnecting: true, error: null }));
      const { account, networkId } = await connectWalletOnClick();
      setWalletStatus({ isInstalled: true, isConnecting: false, account, networkId, error: null });
    } catch (err) {
      setWalletStatus((s) => ({ ...s, isConnecting: false, error: err.message || String(err) }));
    }
  };

  const { isInstalled, isConnecting, account, networkId, error } = walletStatus;

  return (
    <div>
      {/* Simple wallet status strip */}
      <div style={{ padding: 12, borderBottom: "1px solid #222", display: "flex", gap: 12, alignItems: "center" }}>
        {!isInstalled && <span style={{ color: "#b00020" }}>MetaMask not detected. Please install it.</span>}
        {isInstalled && !account && (
          <button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        )}
        {account && (
          <span>
            Account: {account.substring(0, 6)}...{account.substring(account.length - 4)} | Net: {networkId}
          </span>
        )}
        {error && <span style={{ color: "#b00020" }}>{error}</span>}
      </div>

      <BrowseRouter></BrowseRouter>
    </div>
  );
}

export default App;
