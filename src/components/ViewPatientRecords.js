import React, { useState, useEffect } from "react";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";

function ViewPatientRecords() {
  const [records, setRecords] = useState([]);
  const [diagnosticReports, setDiagnosticReports] = useState([]);
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [contract, setContract] = useState(null);

  // Initialize Web3 and contract
  useEffect(() => {
    const init = async () => {
      try {
        console.log("🧠 Initializing ViewPatientRecords...");
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        console.log("📡 Connected Network ID:", networkId);
        console.log("👤 Current Account:", currentAccount);

        setAccount(currentAccount);
        const contractInstance = getContract(UploadEhr, web3, networkId);
        console.log("📜 UploadEhr Contract Address:", contractInstance._address);
        setContract(contractInstance);

        // Fetch patient’s own records
        console.log("🔍 Fetching records for account:", currentAccount);
        const myRecords = await contractInstance.methods.getMyRecords().call({ from: currentAccount });
        console.log("✅ Raw Records from Blockchain:", myRecords);

        if (!myRecords || myRecords.length === 0) {
          setRecords([]);
          setStatus("No records found for your account.");
          return;
        }

        // Reverse for newest first
        // Convert array of arrays → array of objects
const formattedRecords = myRecords.map((r) => ({
  timeStamp: r[0],
  medicalRecordHash: r[1],
  type: "patient" // Mark as patient-uploaded record
}));

// Reverse for newest first
setRecords(formattedRecords.reverse());
console.log("✅ Formatted Records:", formattedRecords);

        // Fetch diagnostic reports
        try {
          const diagnosticReports = await contractInstance.methods
            .getDiagnosticReports(currentAccount)
            .call();
          
          const formattedDiagnosticReports = diagnosticReports.map((report, index) => ({
            timeStamp: report.timestamp.toString(),
            medicalRecordHash: report.medicalReportHash,
            testType: report.testType,
            diagnosticCenter: report.diagnosticCenter,
            description: report.description,
            isApproved: report.isApproved,
            type: "diagnostic", // Mark as diagnostic report
            index
          }));

          setDiagnosticReports(formattedDiagnosticReports.reverse());
          console.log("✅ Diagnostic Reports:", formattedDiagnosticReports);
        } catch (diagError) {
          console.error("Error fetching diagnostic reports:", diagError);
          // Don't fail the whole page if diagnostic reports fail
        }

        setStatus("✅ Records loaded successfully.");
      } catch (error) {
        console.error("❌ Error fetching records:", error);
        setStatus("Failed to load records. Please check MetaMask or network connection.");
      }
    };

    init();

    const cleanup = setupNetworkListeners(
      (newAccount) => {
        if (newAccount) window.location.reload();
      },
      () => {
        window.location.reload();
      }
    );

    return cleanup;
  }, []);

  // Pinata Gateway
  const getIPFSGatewayURL = (ipfsHash) => {
    return `https://coffee-worthy-cobra-770.mypinata.cloud/ipfs/${ipfsHash}`;
  };

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
        <h1 className="text-center text-3xl mb-8 font-semibold text-teal-400">
          My Medical Records
        </h1>

        {status && (
          <div className="text-center mb-6 text-teal-400 font-semibold">{status}</div>
        )}

        {/* Patient Uploaded Records */}
        {records.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-teal-400">My Uploaded Records</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {records.map((record, index) => {
                const ts = record.timeStamp;
                const parsedTime =
                  /^\d+$/.test(ts) ? new Date(parseInt(ts) * 1000).toLocaleString() : ts;

                return (
                  <div
                    key={`patient-${index}`}
                    className="bg-gray-900 p-5 rounded-xl shadow-md border border-gray-700 hover:border-teal-500 hover:shadow-lg transition"
                  >
                    <p className="text-sm text-gray-400">
                      Uploaded on: <span className="text-gray-200">{parsedTime}</span>
                    </p>

                    <a
                      href={getIPFSGatewayURL(record.medicalRecordHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-3 text-teal-400 hover:text-teal-300 break-all font-semibold"
                    >
                      View Record (IPFS Hash)
                    </a>

                    <p className="mt-2 text-xs text-gray-500 break-all">
                      {record.medicalRecordHash}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Diagnostic Reports */}
        {diagnosticReports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Diagnostic Reports</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diagnosticReports.map((report, index) => {
                const ts = report.timeStamp;
                const parsedTime =
                  /^\d+$/.test(ts) ? new Date(parseInt(ts) * 1000).toLocaleString() : ts;

                return (
                  <div
                    key={`diagnostic-${index}`}
                    className="bg-gray-900 p-5 rounded-xl shadow-md border border-yellow-700 hover:border-yellow-500 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-yellow-400">{report.testType}</h3>
                      {report.isApproved && (
                        <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">
                          Approved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      Diagnostic Center: <span className="text-gray-200">{report.diagnosticCenter}</span>
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      Date: <span className="text-gray-200">{parsedTime}</span>
                    </p>
                    {report.description && (
                      <p className="text-sm text-gray-400 mb-3">
                        {report.description}
                      </p>
                    )}

                    <a
                      href={getIPFSGatewayURL(report.medicalRecordHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-3 text-yellow-400 hover:text-yellow-300 break-all font-semibold"
                    >
                      View Report
                    </a>

                    <p className="mt-2 text-xs text-gray-500 break-all">
                      {report.medicalRecordHash}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {records.length === 0 && diagnosticReports.length === 0 && (
          <p className="text-center text-gray-400 text-lg">No records found.</p>
        )}
      </div>
    </div>
  );
}

export default ViewPatientRecords;
