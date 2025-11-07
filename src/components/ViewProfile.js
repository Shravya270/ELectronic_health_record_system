import React, { useState, useEffect } from "react";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useNavigate, useParams } from "react-router-dom";
import "../CSS/PatientWritePermission.css";
import "../big_css/CreateEHR.css";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";

const ViewProfile = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get Web3 and account using shared provider
        const { web3, account, networkId } = await getWeb3AndAccount();
        
        // Get contract using shared helper
        const contract = getContract(PatientRegistration, web3, networkId);

        // Call the getPatientDetails function of the smart contract
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


  const cancelOperation = async () => {
    try {
    navigate("/patient/"+hhNumber);
    } catch (error) {
      console.error("Error checking permission:", error);
    }
  };
  
  return (
    <div>
    <NavBar_Logout></NavBar_Logout>
    <ConnectionBanner />
    <div className="bg-gradient-to-b from-black to-gray-800 p-4 sm:p-10 font-mono text-white flex flex-col justify-center items-center">
        <div className="h-full max-w-8xl bg-gray-700 p-24 rounded-lg shadow-lg flex flex-col justify-center items-center">

        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          Profile
        </h1>
        {patientDetails && (
            <div>
              <center>
          <p className="text-xl sm:text-2xl mb-3">
            Name : {" "}
            <span className="font-bold text-yellow-500">{patientDetails.name}</span>
          </p>
          <p className="text-xl sm:text-2xl mb-3">
            DOB : {" "}
            <span className="font-bold text-yellow-500">{patientDetails.dateOfBirth}</span>
          </p>
          <p className="text-xl sm:text-2xl mb-3">
            Gender : {" "}
            <span className="font-bold text-yellow-500">{patientDetails.gender}</span>
          </p>    
          <p className="text-xl sm:text-2xl mb-6">
            Blood Group : {" "}
          <span className="font-bold text-yellow-500">{patientDetails.bloodGroup}</span>
          </p>
          <p className="text-xl sm:text-2xl mb-3">
            Address : {" "}
            <span className="font-bold text-yellow-500">{patientDetails.homeAddress}</span>
          </p>
          <p className="text-xl sm:text-2xl mb-3">
            Email-Id : {" "}
            <span className="font-bold text-yellow-500">{patientDetails.email}</span>
          </p>
          </center>
        </div>
        )}
          <div className="col-span-full">
            <button
              onClick={cancelOperation}
              className="px-5 py-2.5 bg-custom-teal text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 transition-transform transition-background-color duration-300 ease-in hover:bg-gray-400 transform hover:scale-105"
            >
              Close
            </button>     
            </div>
        </div>
      </div>
      </div>
  );
};

export default ViewProfile;
