import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import DiagnosticRegistration from "../build/contracts/DiagnosticRegistration.json";
import UploadEhr from "../build/contracts/UploadEhr.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";

const DiagnosticDashBoard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [diagnosticDetails, setDiagnosticDetails] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    inProgress: 0,
    completed: 0,
    approved: 0
  });
  const [account, setAccount] = useState(null);

  const diagnosticUpload = () => {
    navigate("/diagnostic/"+hhNumber+"/upload-report/new");
  };

  const viewDiagnosticProfile = () => {
    navigate("/diagnostic/"+hhNumber+"/viewdiagnosticprofile");
  };

  const viewRequests = () => {
    navigate("/diagnostic/"+hhNumber+"/requests");
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);

        // Get diagnostic details
        const diagnosticContract = getContract(DiagnosticRegistration, web3, networkId);
        const result = await diagnosticContract.methods.getDiagnosticDetails(hhNumber).call();
        setDiagnosticDetails({
          diagnosticName: result[1],
          hospitalName: result[2]
        });

        // Fetch statistics
        const uploadEhrContract = getContract(UploadEhr, web3, networkId);
        
        // Get pending requests count
        const pendingIds = await uploadEhrContract.methods.getPendingRequests().call();
        
        // Get my assigned requests
        const myRequestIds = await uploadEhrContract.methods.getDiagnosticRequests(currentAccount).call();
        
        // Count by status
        let inProgress = 0;
        let completed = 0;
        let approved = 0;

        for (const id of myRequestIds) {
          try {
            const request = await uploadEhrContract.methods.getTestRequest(id).call();
            if (request.status === "IN_PROGRESS") inProgress++;
            else if (request.status === "COMPLETED") completed++;
            else if (request.status === "APPROVED") approved++;
          } catch (err) {
            console.error(`Error fetching request ${id}:`, err);
          }
        }

        setStats({
          pendingRequests: pendingIds.length,
          inProgress,
          completed,
          approved
        });
      } catch (error) {
        console.error('Error initializing:', error);
        setError('Error initializing: ' + error.message);
      }
    };

    init();

    const cleanup = setupNetworkListeners(
      () => init(),
      () => window.location.reload()
    );

    return cleanup;
  }, [hhNumber]);

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />
      <div className="bg-gradient-to-b from-black to-gray-800 p-4 sm:p-10 font-mono text-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">Diagnostic Dashboard</h2>
          
          {diagnosticDetails && (
            <p className="text-xl sm:text-2xl mb-8 text-center">
              Welcome{" "}
              <span className="font-bold text-yellow-500">{diagnosticDetails.diagnosticName}!</span>
            </p>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-yellow-500 transition">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.pendingRequests}</div>
              <div className="text-gray-400">Pending Requests</div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.inProgress}</div>
              <div className="text-gray-400">Tests In Progress</div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition">
              <div className="text-3xl font-bold text-purple-400 mb-2">{stats.completed}</div>
              <div className="text-gray-400">Completed Reports</div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.approved}</div>
              <div className="text-gray-400">Approved Reports</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={viewDiagnosticProfile}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
            >
              View Profile
            </button>
            <button
              onClick={viewRequests}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-yellow-400 transition duration-300"
            >
              View Requests ({stats.pendingRequests})
            </button>
            <button
              onClick={diagnosticUpload}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
            >
              Upload Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticDashBoard;
