import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../CSS/PatientDashBoard.css";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";

const PatientDashBoard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  
  const viewRecord = () => {
    navigate("/patient/" + hhNumber + "/viewrecords");
  };

  const viewprofile = () => {
    navigate("/patient/" + hhNumber + "/viewprofile");
  };

  const uploadPastRecords = () => {
    navigate("/patient/" + hhNumber + "/upload-past-records");
  };

  const grantPermission = () => {
    navigate("/patient/" + hhNumber + "/grant-permission");
  };

  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get Web3 and account using shared provider
        const { web3, account, networkId } = await getWeb3AndAccount();
        
        // Get contract using shared helper
        const contract = getContract(PatientRegistration, web3, networkId);
        
        // Fetch patient details
        const result = await contract.methods.getPatientDetails(hhNumber).call();
        setPatientDetails(result);
        setError(null);
      } catch (error) {
        console.error('Error retrieving patient details:', error);
        if (error.message.includes("not deployed")) {
          setError(`PatientRegistration ${error.message}`);
        } else if (error.message.includes("switch MetaMask")) {
          setError(error.message);
        } else {
          setError('Error retrieving patient details: ' + error.message);
        }
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
  }, [hhNumber]);

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="patient-dashboard-container">
        <h2 className="dashboard-heading">Patient Dashboard</h2>
        {error && (
          <div className="error-message" style={{ 
            padding: "15px", 
            marginBottom: "20px", 
            backgroundColor: "rgba(255, 0, 0, 0.2)", 
            border: "2px solid #ff4444", 
            borderRadius: "8px",
            color: "#ff6666",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
        {patientDetails && (
          <p className="welcome-message">
            Welcome{" "}
            <span className="patient-name">{patientDetails.name}!</span>
          </p>
        )}
        <div className="dashboard-buttons-grid">
          <button
            onClick={viewprofile}
            className="dashboard-button"
          >
            View Profile
          </button>
          <button
            onClick={viewRecord}
            className="dashboard-button"
          >
            View Record
          </button>
          <button
            onClick={uploadPastRecords}
            className="dashboard-button"
          >
            Upload Past Records
          </button>
          <button
            onClick={grantPermission}
            className="dashboard-button"
          >
            Grant Permission
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashBoard;
