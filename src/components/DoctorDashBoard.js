import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";

const DoctorDashBoardPage = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [error, setError] = useState(null);

  const viewPatientList = () => {
    navigate("/doctor/"+hhNumber+"/patientlist");
  };

  const viewDoctorProfile = () => {
    navigate("/doctor/"+hhNumber+"/viewdoctorprofile");
  };

  const videoConsultation = () => {
    navigate("/doctor/"+hhNumber+"/video-consultation");
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Get Web3 and account using shared provider
        const { web3, account, networkId } = await getWeb3AndAccount();
        
        // Get contract using shared helper
        const contract = getContract(DoctorRegistration, web3, networkId);

        // Call the getDoctorDetails function of the smart contract
        const result = await contract.methods.getDoctorDetails(hhNumber).call();
        setDoctorDetails(result);
        setError(null);
      } catch (error) {
        console.error('Error initializing Web3 or fetching doctor details:', error);
        if (error.message.includes("not deployed")) {
          setError(`DoctorRegistration ${error.message}`);
        } else if (error.message.includes("switch MetaMask")) {
          setError(error.message);
        } else {
          setError('Error initializing Web3 or fetching doctor details: ' + error.message);
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
    <NavBar_Logout></NavBar_Logout>
    <ConnectionBanner />
    <div className="bg-gradient-to-b from-black to-gray-800 p-4 sm:p-10 font-mono text-white h-screen flex flex-col justify-center items-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">Doctor Dashboard</h2>
        {error && (
          <div style={{ 
            padding: "15px", 
            marginBottom: "20px", 
            backgroundColor: "rgba(255, 0, 0, 0.2)", 
            border: "2px solid #ff4444", 
            borderRadius: "8px",
            color: "#ff6666",
            textAlign: "center",
            maxWidth: "600px"
          }}>
            {error}
          </div>
        )}
        {doctorDetails && (
          <p className="text-xl sm:text-2xl mb-24">
            Welcome{" "}
            <span className="font-bold text-yellow-500">{doctorDetails[1]}!</span>
          </p>
        )}
      <div className="space-y-4 space-x-4">
        <button
          onClick={viewDoctorProfile}
          className="px-6 py-3 bg-teal-500 hover-bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
        >
          View Profile
        </button>
        
        <button
        onClick={viewPatientList}
        className="px-6 py-3 bg-teal-500 hover-bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
      >
        View Patient List
        </button>

        <button
        onClick={videoConsultation}
        className="px-6 py-3 bg-teal-500 hover:bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
      >
        Video Consultation
        </button>
      
      </div>
      </div>
      </div>
  );
};

export default DoctorDashBoardPage;
