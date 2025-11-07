import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import { uploadFileToPinata, checkPinataCredentials } from "../utils/pinataClient";
import "../CSS/UploadPastRecords.css";

const UploadPastRecords = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting wallet...");
  const [pinataReady, setPinataReady] = useState(false);
  const [uploadedHash, setUploadedHash] = useState(null);

  // Initialize Web3, Contract, and verify Pinata credentials
  useEffect(() => {
    const init = async () => {
      try {
        setConnectionStatus("Connecting wallet...");
        
        // Get Web3 and account using shared provider
        const { web3: web3Instance, account: currentAccount, networkId } = await getWeb3AndAccount();
        
        setWeb3(web3Instance);
        setAccount(currentAccount);
        setConnectionStatus(`Connected to Ganache (${networkId})`);

        // Get contract using shared helper
        const contractInstance = getContract(UploadEhr, web3Instance, networkId);
        setContract(contractInstance);
        setUploadStatus(""); // Clear any errors

        // Verify Pinata credentials are configured
       // ✅ Verify Pinata JWT is configured correctly
const hasCredentials = checkPinataCredentials();
if (hasCredentials) {
  setPinataReady(true);
  console.log("✅ Pinata JWT detected — ready to upload files");
} else {
  setPinataReady(false);
  setUploadStatus("Missing Pinata JWT. Please check your .env configuration.");
  console.error("❌ Pinata JWT not found in environment variables");
}

      } catch (error) {
        console.error("Error initializing:", error);
        setConnectionStatus(error.message);
        setUploadStatus(error.message);
      }
    };

    init();

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      (newAccount) => {
        if (newAccount) {
          setAccount(newAccount);
          init(); // Reinitialize on account change
        } else {
          setAccount(null);
          setConnectionStatus("Please connect your MetaMask account.");
        }
      },
      () => {
        // Chain changed - page will reload automatically
      }
    );

    return cleanup;
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setUploadStatus("");
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    // Validate file selection
    if (!selectedFile) {
      setUploadStatus("Please select a file before uploading.");
      return;
    }

    // Validate file object
    if (!selectedFile.name || selectedFile.size === 0) {
      setUploadStatus("Invalid file. Please select a valid file to upload.");
      return;
    }

    // Check Pinata credentials
    if (!pinataReady) {
      setUploadStatus("Pinata credentials not configured. Please add both REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_API_SECRET to your .env file.");
      return;
    }

    // Check blockchain connection
    if (!contract || !account) {
      setUploadStatus("Blockchain connection not ready. Please check MetaMask.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Connecting to Pinata...");

    try {
      // Step 1: Upload to Pinata IPFS
      setUploadStatus("Uploading file to IPFS...");
      
      let ipfsHash;
      try {
        ipfsHash = await uploadFileToPinata(selectedFile);
        console.log("✅ File uploaded to Pinata. IPFS Hash:", ipfsHash);
        console.log("Pinata Response:", ipfsHash);
      } catch (pinataError) {
        console.error("Pinata upload error:", pinataError);
        if (pinataError.message.includes("authentication failed")) {
          throw new Error("Pinata authentication failed. Please check your API credentials in the .env file.");
        }
        if (pinataError.message.includes("timeout")) {
          throw new Error("File upload timeout. Please try again.");
        }
        if (pinataError.message.includes("Failed to connect") || pinataError.message.includes("Network error")) {
          throw new Error("Failed to connect to Pinata. Check your internet connection.");
        }
        if (pinataError.message.includes("Failed to upload file to IPFS")) {
          throw new Error("Failed to upload file to IPFS. Please retry.");
        }
        throw pinataError;
      }

      if (!ipfsHash) {
        throw new Error("Failed to retrieve IPFS hash from Pinata.");
      }

      // Step 2: Record hash on blockchain
      setUploadStatus("Recording IPFS hash on blockchain...");

      let txReceipt;
      try {
        txReceipt = await contract.methods
          .uploadRecord(ipfsHash)
          .send({
            from: account,
            gas: 300000,
          });
        console.log("✅ Hash recorded on blockchain. Transaction:", txReceipt.transactionHash);
      } catch (blockchainError) {
        console.error("Blockchain transaction error:", blockchainError);
        if (blockchainError.message.includes("User denied") || blockchainError.code === 4001) {
          throw new Error("Transaction was rejected. Please try again.");
        }
        if (blockchainError.message.includes("network") || blockchainError.message.includes("Network")) {
          throw new Error("Failed to record hash on blockchain. Check MetaMask connection.");
        }
        throw new Error("Failed to record hash on blockchain. Check MetaMask connection.");
      }

      // Success!
      setUploadStatus("Upload complete!");
      setUploadedHash(ipfsHash);
      setSelectedFile(null);
      setFileName("No file chosen");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Display IPFS hash in console for testing
      console.log("📋 Upload successful! IPFS Hash (CID):", ipfsHash);

      // Clear success message and hash after 10 seconds
      setTimeout(() => {
        setUploadStatus("");
        setUploadedHash(null);
      }, 10000);
    } catch (error) {
      console.error("Error uploading file:", error);
      // Show specific error messages based on error type
      if (error.message.includes("Pinata authentication failed")) {
        setUploadStatus("Pinata authentication failed. Please check your API credentials in the .env file.");
      } else if (error.message.includes("timeout")) {
        setUploadStatus("File upload timeout. Please try again.");
      } else if (error.message.includes("Failed to connect to Pinata") || error.message.includes("Check your internet connection")) {
        setUploadStatus("Failed to connect to Pinata. Check your internet connection.");
      } else if (error.message.includes("Failed to upload file to IPFS")) {
        setUploadStatus("Failed to upload file to IPFS. Please retry.");
      } else if (error.message.includes("Transaction was rejected")) {
        setUploadStatus("Transaction was rejected. Please try again.");
      } else if (error.message.includes("Failed to record hash on blockchain")) {
        setUploadStatus("Failed to record hash on blockchain. Check MetaMask connection.");
      } else {
        setUploadStatus(`Error: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    navigate("/patient/" + hhNumber);
  };

  const handleReconnect = async () => {
    setUploadStatus("Connecting to MetaMask...");
    try {
      const { web3: web3Instance, account: currentAccount, networkId } = await getWeb3AndAccount();
      setWeb3(web3Instance);
      setAccount(currentAccount);
      setConnectionStatus(`Connected to Ganache (${networkId})`);

      const contractInstance = getContract(UploadEhr, web3Instance, networkId);
      setContract(contractInstance);
      window.contract = contractInstance;
window.UploadEhr = UploadEhr;

      
      // Verify Pinata credentials
      const hasCredentials = checkPinataCredentials();
      if (hasCredentials) {
        setPinataReady(true);
        console.log("✅ Pinata credentials verified");
      } else {
        setPinataReady(false);
        setUploadStatus("Missing Pinata credentials — please add both REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_API_SECRET to your .env file.");
      }
      
      setUploadStatus("✓ Connected successfully! Ready to upload files.");
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (error) {
      console.error("Error reconnecting:", error);
      setConnectionStatus(error.message);
      setUploadStatus(error.message);
    }
  };

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="upload-past-records-container">
        <h1 className="upload-heading">Upload Past Records</h1>
        <div className="upload-content">
          <p className="upload-description">
            Upload your past medical records to add them to your secure health record system.
            Files will be stored on IPFS via Pinata and the hash will be recorded on the blockchain.
          </p>
          
          {pinataReady && (
            <div className="ipfs-status-message" style={{
              padding: "8px 15px",
              marginBottom: "15px",
              backgroundColor: "rgba(0, 191, 166, 0.15)",
              border: "1px solid #00bfa6",
              borderRadius: "6px",
              color: "#00e6c3",
              fontSize: "0.9rem",
              textAlign: "center",
              fontFamily: "'Courier New', monospace"
            }}>
              Connected to IPFS via Pinata.
            </div>
          )}
          
          <div className="upload-placeholder">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            />
            <button 
              className="upload-button"
              onClick={handleChooseFile}
              disabled={isUploading}
            >
              Choose File
            </button>
            <p className="upload-hint">{fileName}</p>
            {selectedFile && (
              <p className="file-size">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {uploadedHash && (
            <div style={{
              padding: "15px 20px",
              marginBottom: "15px",
              backgroundColor: "rgba(0, 191, 166, 0.2)",
              border: "2px solid #00bfa6",
              borderRadius: "8px",
              color: "#00e6c3",
              fontSize: "0.95rem",
              textAlign: "center",
              fontFamily: "'Courier New', monospace",
              wordBreak: "break-all"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#00bfa6" }}>
                File uploaded successfully — IPFS Hash:
              </div>
              <code style={{ 
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                padding: "8px 12px",
                borderRadius: "4px",
                display: "block",
                fontSize: "0.9rem"
              }}>
                {uploadedHash}
              </code>
            </div>
          )}

          {uploadStatus && (
            <div className={`status-message ${uploadStatus.includes("✓") ? "success" : uploadStatus.includes("Error") || uploadStatus.includes("not deployed") || uploadStatus.includes("not ready") || uploadStatus.includes("not found") ? "error" : uploadStatus.includes("Uploading") || uploadStatus.includes("Recording") || uploadStatus.includes("Connecting") ? "info" : "info"}`}>
              {uploadStatus}
              {(uploadStatus.includes("not ready") || uploadStatus.includes("not deployed") || uploadStatus.includes("not found") || uploadStatus.includes("MetaMask") || uploadStatus.includes("Please")) && !uploadStatus.includes("✓") && !uploadStatus.includes("Uploading") && !uploadStatus.includes("Recording") ? (
                <button 
                  className="reconnect-button" 
                  onClick={handleReconnect}
                  style={{ marginTop: "10px", display: "block", margin: "10px auto 0" }}
                >
                  Reconnect
                </button>
              ) : null}
            </div>
          )}

          <div className="upload-actions">
            <button 
              className="action-button primary" 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
            <button 
              className="action-button secondary" 
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPastRecords;

