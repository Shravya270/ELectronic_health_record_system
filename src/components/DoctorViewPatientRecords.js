import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import "../CSS/DoctorViewPatientRecords.css";

const DoctorViewPatientRecords = () => {
  const { hhNumber, patientHHNumber } = useParams();
  const navigate = useNavigate();
  const [hasPermission, setHasPermission] = useState(false);
  const [account, setAccount] = useState(null);
  const [checking, setChecking] = useState(true);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setChecking(true);
        
        // Get Web3 and account using shared provider
        const { web3, account, networkId } = await getWeb3AndAccount();
        setAccount(account);
        
        // Get contract using shared helper
        const contract = getContract(PatientRegistration, web3, networkId);

        // Check permission first
        const permission = await contract.methods
          .isPermissionGranted(patientHHNumber, hhNumber)
          .call();
        
        setHasPermission(permission);
        
        if (!permission) {
          setError("Access Denied: Patient has not granted permission yet.");
          setChecking(false);
        } else {
          // If permission exists, fetch patient details and records
          await fetchPatientDetails(contract);
          await fetchPatientRecords(web3, networkId, account);
        }
      } catch (error) {
        console.error("Error initializing:", error);
        if (error.message.includes("not deployed")) {
          setError(`PatientRegistration ${error.message}`);
        } else if (error.message.includes("switch MetaMask")) {
          setError(error.message);
        } else {
          setError("Error connecting to blockchain: " + error.message);
        }
        setChecking(false);
      }
    };

    init();

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      () => {
        // Account changed - reinitialize
        init();
      },
      () => {
        // Chain changed - page will reload
      }
    );

    return cleanup;
  }, [hhNumber, patientHHNumber]);

  const fetchPatientDetails = async (contractInstance) => {
    try {
      const details = await contractInstance.methods
        .getPatientDetails(patientHHNumber)
        .call();
      
      setPatientDetails({
        name: details.name,
        dateOfBirth: details.dateOfBirth,
        gender: details.gender,
        bloodGroup: details.bloodGroup,
        homeAddress: details.homeAddress,
        email: details.email,
        walletAddress: details.walletAddress
      });
    } catch (error) {
      console.error("Error fetching patient details:", error);
      setError("Error fetching patient details.");
    } finally {
      setChecking(false);
    }
  };

  const fetchPatientRecords = async (web3, networkId, fromAccount) => {
    try {
      setLoadingRecords(true);
      
      // Get UploadEhr contract
      const uploadEhrContract = getContract(UploadEhr, web3, networkId);
      
      // Get patient's wallet address
      const patientContract = getContract(PatientRegistration, web3, networkId);
      const patientDetails = await patientContract.methods.getPatientDetails(patientHHNumber).call();
      const patientAddress = patientDetails.walletAddress;

      // Fetch records from UploadEhr contract
      const records = await uploadEhrContract.methods
        .getPatientRecords(patientAddress)
        .call({ from: fromAccount });
      
      setPatientRecords(records || []);
    } catch (error) {
      console.error("Error fetching patient records:", error);
      if (error.message.includes("Access denied") || error.message.includes("Permission not granted")) {
        setError("Access denied — patient has not shared their records with you.");
      } else {
        // Don't show error if it's just that no records exist
        if (!error.message.includes("Access denied")) {
          console.log("No records found or access not granted:", error.message);
        }
      }
    } finally {
      setLoadingRecords(false);
    }
  };

  const getIPFSGatewayURL = (ipfsHash) => {
    return `https://coffee-worthy-cobra-770.mypinata.cloud/ipfs/${ipfsHash}`;
  };
  



  const handleBack = () => {
    navigate(`/doctor/${hhNumber}/patientlist`);
  };

  if (checking) {
    return (
      <div>
        <NavBar_Logout />
        <ConnectionBanner />
        <div className="doctor-view-records-container">
          <div className="loading-message">Checking permissions...</div>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div>
        <NavBar_Logout />
        <ConnectionBanner />
        <div className="doctor-view-records-container">
          <div className="error-message">{error}</div>
          <button className="back-button" onClick={handleBack}>
            Back to Patient List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="doctor-view-records-container">
        <h1 className="records-heading">Patient Records</h1>
        
        {error && (
          <div className="error-message">{error}</div>
        )}

        {patientDetails && (
          <div className="patient-details-card">
            <h2 className="patient-name-header">{patientDetails.name}</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">{patientDetails.dateOfBirth}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">{patientDetails.gender}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Blood Group:</span>
                <span className="detail-value">{patientDetails.bloodGroup}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{patientDetails.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{patientDetails.homeAddress}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Wallet Address:</span>
                <span className="detail-value">{patientDetails.walletAddress}</span>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Reports Section */}
        <div className="records-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 className="records-section-heading">Diagnostic Reports</h2>
            <button
              onClick={() => navigate(`/doctor/${hhNumber}/view-patient-records/${patientHHNumber}/diagnostic-reports`)}
              className="back-button"
              style={{ backgroundColor: "#10b981" }}
            >
              View Diagnostic Reports
            </button>
          </div>
        </div>

        {/* Medical Records Section */}
        <div className="records-section">
          <h2 className="records-section-heading">Medical Records</h2>
          {loadingRecords ? (
            <div className="loading-message">Loading records...</div>
          ) : patientRecords.length === 0 ? (
            <div className="empty-records-message">
              No medical records found. Patient has not uploaded any records yet.
            </div>
          ) : (
            <div className="records-list">
              {patientRecords.map((record, index) => (
                <div key={index} className="record-item">
                  <div className="record-info">
                    <div className="record-timestamp">
                      Uploaded: {new Date(parseInt(record.timeStamp) * 1000).toLocaleString()}
                    </div>
                    <div className="record-hash">
                      IPFS CID: <code>{record.medicalRecordHash}</code>
                    </div>
                  </div>
                  <a
                    href={getIPFSGatewayURL(record.medicalRecordHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-record-link"
                  >
                    View Record
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="back-button-container">
          <button className="back-button" onClick={handleBack}>
            Back to Patient List
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorViewPatientRecords;

