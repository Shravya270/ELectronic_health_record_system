import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import { toastSuccess, toastError } from "../utils/toast";

const DiagnosticRequests = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);

        const uploadEhrContract = getContract(UploadEhr, web3, networkId);

        // Fetch all pending requests (not yet assigned)
        const pendingIds = await uploadEhrContract.methods.getPendingRequests().call();
        
        // Fetch my assigned requests
        const myRequestIds = await uploadEhrContract.methods.getDiagnosticRequests(currentAccount).call();

        // Fetch all request details
        const pendingPromises = pendingIds.map(id => fetchRequestDetails(uploadEhrContract, id));
        const myPromises = myRequestIds.map(id => fetchRequestDetails(uploadEhrContract, id));

        const pendingData = await Promise.all(pendingPromises);
        const myData = await Promise.all(myPromises);

        setPendingRequests(pendingData.filter(r => r !== null));
        setMyRequests(myData.filter(r => r !== null));
        setError("");
      } catch (error) {
        console.error("Error fetching requests:", error);
        setError("Error fetching requests: " + error.message);
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

  const fetchRequestDetails = async (uploadEhrContract, requestId) => {
    try {
      const request = await uploadEhrContract.methods.getTestRequest(requestId).call();
      
      if (!request.exists) return null;

      // Get patient details - try to find by checking if address matches
      let patientName = "Unknown Patient";
      try {
        // Try to get patient name by checking common patterns
        // This is a simplified approach - in production you'd have a reverse mapping
        patientName = `${request.patient.substring(0, 6)}...${request.patient.substring(38)}`;
      } catch (e) {
        // Keep default
      }

      let doctorName = "Unknown Doctor";
      try {
        doctorName = `${request.doctor.substring(0, 6)}...${request.doctor.substring(38)}`;
      } catch (e) {
        // Keep default
      }

      return {
        requestId: request.requestId.toString(),
        patient: {
          name: patientName,
          address: request.patient
        },
        doctor: {
          name: doctorName,
          address: request.doctor
        },
        testType: request.testType,
        description: request.description,
        status: request.status,
        timestamp: new Date(parseInt(request.timestamp) * 1000).toLocaleString(),
        diagnostic: request.diagnostic
      };
    } catch (error) {
      console.error(`Error fetching request ${requestId}:`, error);
      return null;
    }
  };


  const handleAssignTest = async (requestId) => {
    if (!account) {
      toastError("Please connect your wallet");
      return;
    }

    try {
      const { web3, networkId } = await getWeb3AndAccount();
      const uploadEhrContract = getContract(UploadEhr, web3, networkId);

      await uploadEhrContract.methods
        .assignTest(requestId)
        .send({ from: account });

      toastSuccess("Test assigned successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error assigning test:", error);
      toastError("Failed to assign test: " + (error.message || "Unknown error"));
    }
  };

  const handleUploadReport = (requestId, patientAddress) => {
    // Navigate to upload page with request info
    navigate(`/diagnostic/${hhNumber}/upload-report/${requestId}?patient=${patientAddress}`);
  };

  const handleBack = () => {
    navigate(`/diagnostic/${hhNumber}`);
  };

  if (loading) {
    return (
      <div>
        <NavBar_Logout />
        <ConnectionBanner />
        <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-teal-400">Diagnostic Test Requests</h1>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Pending Requests (Not Assigned) */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Pending Requests</h2>
            {pendingRequests.length === 0 ? (
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 text-gray-400">
                No pending requests available.
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((req) => (
                  <div key={req.requestId} className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-yellow-500 transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-teal-400">{req.testType}</h3>
                        <p className="text-gray-400 mt-2">{req.description}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-sm">
                        {req.status}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-400">Patient:</span>{" "}
                        <span className="text-white">{req.patient.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Requested By:</span>{" "}
                        <span className="text-white">{req.doctor.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Request ID:</span>{" "}
                        <span className="text-white">{req.requestId}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Requested On:</span>{" "}
                        <span className="text-white">{req.timestamp}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignTest(req.requestId)}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition"
                    >
                      Assign to Me
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Assigned Requests */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-teal-400">My Assigned Requests</h2>
            {myRequests.length === 0 ? (
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 text-gray-400">
                No assigned requests yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-gray-900 rounded-lg border border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-4 text-left text-teal-400">Patient</th>
                      <th className="p-4 text-left text-teal-400">Test Type</th>
                      <th className="p-4 text-left text-teal-400">Requested By</th>
                      <th className="p-4 text-left text-teal-400">Status</th>
                      <th className="p-4 text-left text-teal-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req) => (
                      <tr key={req.requestId} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="p-4">{req.patient.name}</td>
                        <td className="p-4">{req.testType}</td>
                        <td className="p-4">{req.doctor.name}</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              req.status === "COMPLETED"
                                ? "bg-green-900 text-green-300"
                                : req.status === "IN_PROGRESS"
                                ? "bg-blue-900 text-blue-300"
                                : "bg-yellow-900 text-yellow-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleUploadReport(req.requestId, req.patient.address)}
                            disabled={req.status === "REQUESTED"}
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {req.status === "COMPLETED" ? "View Report" : "Upload Report"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6">
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

export default DiagnosticRequests;

