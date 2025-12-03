import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import { toastSuccess, toastError } from "../utils/toast";

const DoctorRequestTest = () => {
  const { hhNumber, patientHH } = useParams();
  const navigate = useNavigate();
  const [patientDetails, setPatientDetails] = useState(null);
  const [testType, setTestType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const testTypes = [
    "Blood Test",
    "X-Ray",
    "MRI",
    "CT Scan",
    "Urine Test",
    "ECG",
    "Ultrasound",
    "Endoscopy",
    "Colonoscopy",
    "Biopsy",
    "Other"
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);

        const patientContract = getContract(PatientRegistration, web3, networkId);
        const uploadEhrContract = getContract(UploadEhr, web3, networkId);
        setContract(uploadEhrContract);

        // Fetch patient details
        const details = await patientContract.methods.getPatientDetails(patientHH).call();
        setPatientDetails({
          name: details.name,
          walletAddress: details.walletAddress
        });
      } catch (error) {
        console.error("Error initializing:", error);
        setError("Error connecting to blockchain: " + error.message);
      }
    };

    init();

    const cleanup = setupNetworkListeners(
      () => init(),
      () => window.location.reload()
    );

    return cleanup;
  }, [hhNumber, patientHH]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!testType) {
      toastError("Please select a test type");
      return;
    }

    if (!description.trim()) {
      toastError("Please enter a description");
      return;
    }

    if (!contract || !patientDetails) {
      toastError("Please wait for connection to initialize");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Request test on blockchain
      const result = await contract.methods
        .requestTest(patientDetails.walletAddress, testType, description)
        .send({ from: account });

      toastSuccess("Test Request Sent Successfully!");
      
      // Wait a bit then navigate back
      setTimeout(() => {
        navigate(`/doctor/${hhNumber}/patientlist`);
      }, 2000);
    } catch (error) {
      console.error("Error requesting test:", error);
      const errorMsg = error.message || "Blockchain Transaction Failed";
      toastError(errorMsg);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/doctor/${hhNumber}/patientlist`);
  };

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-teal-400">Request Diagnostic Test</h1>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {patientDetails && (
            <div className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-teal-400">Patient Information</h2>
              <p className="text-gray-300">
                <span className="font-bold">Name:</span> {patientDetails.name}
              </p>
              <p className="text-gray-300 mt-2">
                <span className="font-bold">HH Number:</span> {patientHH}
              </p>
              <p className="text-gray-300 mt-2 break-all">
                <span className="font-bold">Address:</span> {patientDetails.walletAddress}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="mb-6">
              <label htmlFor="testType" className="block text-sm font-semibold mb-2 text-teal-400">
                Test Type *
              </label>
              <select
                id="testType"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Select a test type</option>
                {testTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-semibold mb-2 text-teal-400">
                Description / Notes *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="5"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter test description, reason, or any additional notes..."
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Request Test"}
              </button>
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorRequestTest;

