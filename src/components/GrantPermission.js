import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import "../CSS/GrantPermission.css";

const GrantPermission = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [doctorHHNumber, setDoctorHHNumber] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientContract, setPatientContract] = useState(null);
  const [uploadEhrContract, setUploadEhrContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [patientName, setPatientName] = useState("");

  // Initialize Web3 and contracts
  useEffect(() => {
    const init = async () => {
      try {
        // Get Web3 and account using shared provider
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);

        // Get PatientRegistration contract
        const patientContractInstance = getContract(PatientRegistration, web3, networkId);
        setPatientContract(patientContractInstance);

        // Get UploadEhr contract
        const uploadEhrContractInstance = getContract(UploadEhr, web3, networkId);
        setUploadEhrContract(uploadEhrContractInstance);

        // Fetch patient name
        try {
          const patientDetails = await patientContractInstance.methods.getPatientDetails(hhNumber).call();
          setPatientName(patientDetails.name);
        } catch (error) {
          console.error("Error fetching patient details:", error);
        }

        setStatus(""); // Clear any errors
      } catch (error) {
        console.error("Error initializing:", error);
        setStatus(error.message);
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
          setStatus("Please connect your MetaMask account.");
        }
      },
      () => {
        // Chain changed - page will reload
      }
    );

    return cleanup;
  }, [hhNumber]);

  const handleGrantAccess = async () => {
    if (!doctorHHNumber.trim()) {
      setStatus("Please enter the Doctor HH Number.");
      return;
    }

    if (!patientContract || !uploadEhrContract || !account) {
      setStatus("Blockchain connection not ready. Please check MetaMask.");
      return;
    }

    setIsProcessing(true);
    setStatus("Processing transaction...");

    try {
      // Get Web3 and networkId for contract access
      const { web3, networkId } = await getWeb3AndAccount();
      
      // Get doctor's wallet address from DoctorRegistration contract
      const doctorContract = getContract(DoctorRegistration, web3, networkId);
      const doctorDetails = await doctorContract.methods.getDoctorDetails(doctorHHNumber.trim()).call();
      const doctorAddress = doctorDetails[0]; // First element is walletAddress

      if (!doctorAddress || doctorAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Doctor not found. Please verify the HH Number.");
      }

      // Step 1: Grant permission in PatientRegistration contract
      setStatus("Granting view permission...");
      await patientContract.methods
        .grantPermission(hhNumber, doctorHHNumber.trim(), patientName || "Patient")
        .send({
          from: account,
          gas: 300000,
        });

      // Step 2: Grant access in UploadEhr contract for IPFS records
      setStatus("Granting access to medical records...");
      await uploadEhrContract.methods
        .grantAccessToDoctor(doctorAddress)
        .send({
          from: account,
          gas: 300000,
        });

      setStatus(`✓ Access granted successfully to Doctor ${doctorHHNumber.trim()}! They can now view your profile and medical records.`);
      
      // Clear the input
      setDoctorHHNumber("");
      
      // Clear success message after 8 seconds
      setTimeout(() => {
        setStatus("");
      }, 8000);
    } catch (error) {
      console.error("Error granting permission:", error);
      if (error.message.includes("User denied")) {
        setStatus("Transaction was rejected. Please try again.");
      } else if (error.message.includes("already given") || error.message.includes("already registered")) {
        setStatus("View Access already given to this Doctor!");
      } else if (error.message.includes("not found")) {
        setStatus(error.message);
      } else {
        setStatus(`Error: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!doctorHHNumber.trim()) {
      setStatus("Please enter the Doctor HH Number to revoke access.");
      return;
    }
  
    if (!uploadEhrContract || !account) {
      setStatus("Blockchain connection not ready. Please check MetaMask.");
      return;
    }
  
    setIsProcessing(true);
    setStatus("Revoking access...");
  
    try {
      const { web3, networkId } = await getWeb3AndAccount();
      const doctorContract = getContract(DoctorRegistration, web3, networkId);
      const doctorDetails = await doctorContract.methods.getDoctorDetails(doctorHHNumber.trim()).call();
      const doctorAddress = doctorDetails[0];
  
      if (!doctorAddress || doctorAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Doctor not found. Please verify the HH Number.");
      }
  
      await uploadEhrContract.methods
        .revokeAccessFromDoctor(doctorAddress)
        .send({
          from: account,
          gas: 300000,
        });
  
      setStatus(`🚫 Access revoked for Doctor ${doctorHHNumber.trim()}.`);
      setDoctorHHNumber("");
      setTimeout(() => setStatus(""), 8000);
    } catch (error) {
      console.error("Error revoking permission:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  

  const handleCancel = () => {
    navigate("/patient/" + hhNumber);
  };

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="grant-permission-container">
        <h1 className="grant-heading">Grant View Permission to the Doctor</h1>
        <div className="grant-content">
          <div className="permission-form">
            <div className="form-group">
              <label className="form-label">Doctor HH Number</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter Doctor HH Number"
                value={doctorHHNumber}
                onChange={(e) => setDoctorHHNumber(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>

          {status && (
            <div className={`status-message ${status.includes("✓") ? "success" : status.includes("Error") ? "error" : "info"}`}>
              {status}
            </div>
          )}

          <div className="grant-actions">
            <button 
              className="action-button primary" 
              onClick={handleGrantAccess}
              disabled={isProcessing || !doctorHHNumber.trim()}
            >
              {isProcessing ? "Processing..." : "Give Access"}
            </button>
            <button 
              className="action-button secondary" 
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default GrantPermission;

