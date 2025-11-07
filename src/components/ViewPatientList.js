import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import "../CSS/ViewPatientList.css";

function ViewPatientList() {
  const { hhNumber } = useParams(); // Doctor's HH number
  const navigate = useNavigate();
  const [patientList, setPatientList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Get Web3 and account using shared provider
        const { web3, account, networkId } = await getWeb3AndAccount();
        
        // Get contract using shared helper
        const contractInstance = getContract(PatientRegistration, web3, networkId);
        setContract(contractInstance);

        // Fetch patient list for this doctor
        await fetchPatientList(contractInstance);
        setError("");
      } catch (error) {
        console.error("Error initializing:", error);
        if (error.message.includes("not deployed")) {
          setError(`PatientRegistration ${error.message}`);
        } else if (error.message.includes("switch MetaMask")) {
          setError(error.message);
        } else {
          setError("Error connecting: " + error.message);
        }
        setLoading(false);
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

  const fetchPatientList = async (contractInstance) => {
    try {
      setLoading(true);
      const list = await contractInstance.methods.getPatientList(hhNumber).call();
      setPatientList(list);
    } catch (error) {
      console.error("Error fetching patient list:", error);
      setError("Error fetching patient list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = async (patientHHNumber) => {
    if (!contract) {
      alert("Blockchain connection not ready. Please check MetaMask.");
      return;
    }

    try {
      // Check permission before allowing access
      const hasPermission = await contract.methods
        .isPermissionGranted(patientHHNumber, hhNumber)
        .call();

      if (hasPermission) {
        // Navigate to view patient records
        // You may need to create a doctor-specific view records page
        // For now, we'll use the same route but with doctor context
        navigate(`/doctor/${hhNumber}/view-patient-records/${patientHHNumber}`);
      } else {
        alert("Access Denied: Patient has not granted permission yet.");
      }
    } catch (error) {
      console.error("Error checking permission:", error);
      alert("Error checking permission. Please try again.");
    }
  };

  const handleBack = () => {
    navigate(`/doctor/${hhNumber}`);
  };

  if (loading) {
    return (
      <div>
        <NavBar_Logout />
        <div className="view-patient-list-container">
          <div className="loading-message">Loading patient list...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="view-patient-list-container">
        <h1 className="list-heading">Patient List</h1>
        
        {error && (
          <div className="error-message">{error}</div>
        )}

        {patientList.length === 0 && !error ? (
          <div className="empty-message">
            No patients have granted you access yet.
          </div>
        ) : (
          <div className="patient-list">
            {patientList.map((patient, index) => (
              <div key={index} className="patient-item">
                <div className="patient-info">
                  <div className="patient-name">{patient.patient_name}</div>
                  <div className="patient-number">HH Number: {patient.patient_number}</div>
                </div>
                <button
                  className="view-record-button"
                  onClick={() => handleViewRecord(patient.patient_number)}
                >
                  View Record
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="back-button-container">
          <button className="back-button" onClick={handleBack}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewPatientList;
