import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import UploadEhr from "../build/contracts/UploadEhr.json";
import DiagnosticRegistration from "../build/contracts/DiagnosticRegistration.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import { uploadFileToPinata } from "../utils/pinataClient";
import { toastSuccess, toastError } from "../utils/toast";

const DiagnosticUploadReport = () => {
  const { hhNumber, requestId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const patientAddress = searchParams.get("patient") || "";
  const [selectedFile, setSelectedFile] = useState(null);
  const [testType, setTestType] = useState("");
  const [description, setDescription] = useState("");
  const [diagnosticDetails, setDiagnosticDetails] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
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

        // Fetch diagnostic details
        const diagnosticContract = getContract(DiagnosticRegistration, web3, networkId);
        const details = await diagnosticContract.methods.getDiagnosticDetails(hhNumber).call();
        setDiagnosticDetails({
          diagnosticName: details[1],
          hospitalName: details[2]
        });

        // If requestId exists, fetch request details to pre-fill
        if (requestId) {
          const uploadEhrContract = getContract(UploadEhr, web3, networkId);
          try {
            const request = await uploadEhrContract.methods.getTestRequest(requestId).call();
            if (request.exists) {
              setTestType(request.testType);
              setDescription(request.description || "");
            }
          } catch (err) {
            console.log("Could not fetch request details:", err);
          }
        }
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
  }, [hhNumber, requestId]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        toastError("Please select a PDF or image file (JPEG, PNG)");
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toastError("File size should be less than 10MB");
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toastError("Please select a file to upload");
      return;
    }

    if (!testType) {
      toastError("Please select a test type");
      return;
    }

    if (!patientAddress) {
      toastError("Patient address is required");
      return;
    }

    if (!diagnosticDetails) {
      toastError("Diagnostic details not loaded");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Step 1: Upload to IPFS
      toastSuccess("Uploading file to IPFS...");
      const ipfsHash = await uploadFileToPinata(selectedFile);
      console.log("File uploaded to IPFS:", ipfsHash);

      // Step 2: Upload to blockchain
      toastSuccess("Storing report on blockchain...");
      const { web3, networkId } = await getWeb3AndAccount();
      const uploadEhrContract = getContract(UploadEhr, web3, networkId);

      const result = await uploadEhrContract.methods
        .uploadDiagnosticReport(
          patientAddress,
          testType,
          ipfsHash,
          diagnosticDetails.diagnosticName,
          description || "No description provided"
        )
        .send({ from: account });

      console.log("Report uploaded to blockchain:", result);

      // Step 3: If requestId exists, link the report to the request
      if (requestId) {
        try {
          const reportIndex = result.events?.DiagnosticReportUploaded?.returnValues?.reportIndex;
          if (reportIndex !== undefined) {
            await uploadEhrContract.methods
              .linkReportToRequest(requestId, reportIndex)
              .send({ from: account });

            // Approve the report
            await uploadEhrContract.methods
              .approveDiagnosticReport(patientAddress, reportIndex)
              .send({ from: account });
          }
        } catch (linkError) {
          console.error("Error linking report to request:", linkError);
          // Don't fail the whole operation if linking fails
        }
      }

      toastSuccess("Diagnostic Report Uploaded Successfully!");
      
      // Wait a bit then navigate back
      setTimeout(() => {
        navigate(`/diagnostic/${hhNumber}/requests`);
      }, 2000);
    } catch (error) {
      console.error("Error uploading report:", error);
      const errorMsg = error.message || "File Upload Failed";
      toastError(errorMsg);
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    navigate(`/diagnostic/${hhNumber}/requests`);
  };

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-teal-400">Upload Diagnostic Report</h1>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {diagnosticDetails && (
            <div className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-teal-400">Diagnostic Center</h2>
              <p className="text-gray-300">
                <span className="font-bold">Name:</span> {diagnosticDetails.diagnosticName}
              </p>
              {diagnosticDetails.hospitalName && (
                <p className="text-gray-300 mt-2">
                  <span className="font-bold">Hospital:</span> {diagnosticDetails.hospitalName}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleUpload} className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="mb-6">
              <label htmlFor="patientAddress" className="block text-sm font-semibold mb-2 text-teal-400">
                Patient Address
              </label>
              <input
                id="patientAddress"
                type="text"
                value={patientAddress}
                readOnly
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
              />
            </div>

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
                Description / Notes
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter report description or additional notes..."
              />
            </div>

            <div className="mb-6">
              <label htmlFor="file" className="block text-sm font-semibold mb-2 text-teal-400">
                Report File (PDF or Image) *
              </label>
              <input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-400">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: PDF, JPEG, PNG. Maximum file size: 10MB
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="flex-1 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Uploading..." : "Upload Report"}
              </button>
              <button
                type="button"
                onClick={handleBack}
                disabled={isUploading}
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

export default DiagnosticUploadReport;

