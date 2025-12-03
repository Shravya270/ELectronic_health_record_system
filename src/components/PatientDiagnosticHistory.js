import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";

const PatientDiagnosticHistory = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [account, setAccount] = useState(null);

  const getIPFSGatewayURL = (ipfsHash) => {
    return `https://coffee-worthy-cobra-770.mypinata.cloud/ipfs/${ipfsHash}`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);

        const uploadEhrContract = getContract(UploadEhr, web3, networkId);

        // Fetch diagnostic reports for the current account (patient)
        const diagnosticReports = await uploadEhrContract.methods
          .getDiagnosticReports(currentAccount)
          .call();

        // Format reports
        const formattedReports = diagnosticReports.map((report, index) => ({
          index,
          timestamp: new Date(parseInt(report.timestamp) * 1000).toLocaleString(),
          testType: report.testType,
          diagnosticCenter: report.diagnosticCenter,
          ipfsHash: report.medicalReportHash,
          description: report.description,
          isApproved: report.isApproved,
          diagnosticAddress: report.diagnosticAddress,
          doctorAddress: report.doctorAddress
        }));

        // Sort by timestamp (newest first)
        formattedReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setReports(formattedReports);
        setError("");
      } catch (error) {
        console.error("Error fetching diagnostic reports:", error);
        setError("Error fetching diagnostic reports: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    init();

    const cleanup = setupNetworkListeners(
      () => init(),
      () => window.location.reload()
    );

    return cleanup;
  }, [hhNumber]);

  const handleBack = () => {
    navigate(`/patient/${hhNumber}`);
  };

  if (loading) {
    return (
      <div>
        <NavBar_Logout />
        <ConnectionBanner />
        <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading diagnostic reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-teal-400">Diagnostic Reports History</h1>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 text-center">
              <p className="text-gray-400 text-lg">No diagnostic reports found.</p>
              <p className="text-gray-500 text-sm mt-2">
                Diagnostic reports will appear here once they are uploaded by diagnostic centers.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div
                  key={report.index}
                  className="bg-gray-900 p-6 rounded-xl shadow-md border border-gray-700 hover:border-teal-500 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-teal-400">{report.testType}</h3>
                    {report.isApproved && (
                      <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-xs">
                        Approved
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Diagnostic Center:</span>{" "}
                      <span className="text-white">{report.diagnosticCenter}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span>{" "}
                      <span className="text-white">{report.timestamp}</span>
                    </div>
                    {report.description && (
                      <div>
                        <span className="text-gray-400">Description:</span>{" "}
                        <span className="text-white">{report.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={getIPFSGatewayURL(report.ipfsHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-center transition"
                    >
                      View Report
                    </a>
                    <button
                      onClick={() => {
                        const url = getIPFSGatewayURL(report.ipfsHash);
                        window.open(url, "_blank");
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                      title="Download Report"
                    >
                      ⬇
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-gray-500 break-all">
                    IPFS: {report.ipfsHash.substring(0, 20)}...
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDiagnosticHistory;

