import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import NavBar_Logout from "./NavBar_Logout";
import ConnectionBanner from "./ConnectionBanner";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import { getWeb3AndAccount, setupNetworkListeners } from "../utils/web3Provider";
import { getContract } from "../utils/getContract";
import { getStreamToken, generateCallId } from "../utils/videoHelper";
import { getSocket } from "../utils/socket";
import "../CSS/VideoConsultation.css";

const VideoConsultation = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [userType, setUserType] = useState(null); // 'patient' or 'doctor'
  const [otherPartyHH, setOtherPartyHH] = useState("");
  const [account, setAccount] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [doctorContract, setDoctorContract] = useState(null);
  const [status, setStatus] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Please verify permission first.");
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [callId, setCallId] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [currentUserDetails, setCurrentUserDetails] = useState(null);
  const [otherPartyDetails, setOtherPartyDetails] = useState(null);
  const [incomingInvite, setIncomingInvite] = useState(null); // { callType, callId, fromUserId }
  const [roomId, setRoomId] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Initialize Web3 and detect user type
  useEffect(() => {
    const init = async () => {
      try {
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);

        // Get contracts
        const patientContractInstance = getContract(PatientRegistration, web3, networkId);
        const doctorContractInstance = getContract(DoctorRegistration, web3, networkId);
        setPatientContract(patientContractInstance);
        setDoctorContract(doctorContractInstance);

        // Detect if current user is patient or doctor
        try {
          const patientDetails = await patientContractInstance.methods.getPatientDetails(hhNumber).call();
          if (patientDetails && patientDetails[0] && patientDetails[0].toLowerCase() === currentAccount.toLowerCase()) {
            setUserType("patient");
            setCurrentUserDetails({
              hhNumber: hhNumber,
              name: patientDetails[1] || "Patient",
              walletAddress: patientDetails[0],
            });
          }
        } catch (error) {
          // Not a patient, check if doctor
          try {
            const doctorDetails = await doctorContractInstance.methods.getDoctorDetails(hhNumber).call();
            if (doctorDetails && doctorDetails[0] && doctorDetails[0].toLowerCase() === currentAccount.toLowerCase()) {
              setUserType("doctor");
              setCurrentUserDetails({
                hhNumber: hhNumber,
                name: doctorDetails[1] || "Doctor",
                walletAddress: doctorDetails[0],
              });
            }
          } catch (error) {
            setStatus("Error: Could not verify user identity. Please ensure you're logged in with the correct account.");
          }
        }
      } catch (error) {
        console.error("Error initializing:", error);
        setStatus(`Error: ${error.message}`);
        setStatusMessage(`Error: ${error.message}`);
      }
    };

    init();

    // Setup Socket.io (after MetaMask account is known)
    try {
      const s = getSocket(hhNumber, account || "");
      s.on("incoming_call", (payload) => {
        setIncomingInvite({
          callType: "default",
          callId: payload.roomId,
          fromUserId: payload.fromHH,
        });
        setStatus("Incoming call...");
      });
      s.on("call_cancelled", () => {
        setIncomingInvite(null);
        setStatus("Caller cancelled the request.");
      });
      s.on("recipient_offline", () => {
        setStatus("Recipient is offline.");
        setIsRequesting(false);
      });
      s.on("call_timed_out", () => {
        setStatus("Call request timed out.");
        setIsRequesting(false);
      });
      s.on("call_rejected", () => {
        setStatus("Call was rejected.");
        setIsRequesting(false);
      });
      s.on("call_error", ({ message }) => {
        setStatus(message || "Call error.");
        setIsRequesting(false);
      });
      s.on("call_started", async ({ roomId, caller, callee }) => {
        try {
          setRoomId(roomId);
          const apiKey = process.env.REACT_APP_STREAM_API_KEY;
          if (!apiKey) throw new Error("Stream API key not configured.");

          const myId = account?.toLowerCase();
          const myToken =
            myId === caller.userId ? caller.token : myId === callee.userId ? callee.token : caller.token;
          const myName = currentUserDetails?.name || "User";

          const client = new StreamVideoClient({
            apiKey,
            user: { id: myId, name: myName },
            token: myToken,
          });
          setStreamClient(client);

          const instance = client.call("default", roomId);
          await instance.getOrCreate({ ring: false });
          await instance.join({ create: false });
          setCall(instance);
          setIsInCall(true);
          setStatus("✓ Video call connected.");
          setIsRequesting(false);
        } catch (err) {
          console.error("call_started handler error:", err);
          setStatus(`Error connecting to call: ${err.message}`);
        }
      });
    } catch {}

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      (newAccount) => {
        if (newAccount) {
          setAccount(newAccount);
          init();
        } else {
          setAccount(null);
          setStatus("Please connect your MetaMask account.");
        }
      },
      () => {
        window.location.reload();
      }
    );

    return cleanup;
  }, [hhNumber]);

  // Register for incoming call invites when Stream client is ready
  useEffect(() => {
    if (!streamClient) return;

    const unsub = streamClient.on("call.invited", (event) => {
      try {
        const callType = event.call?.type || "default";
        const id = event.call?.id;
        const fromUserId = event.user?.id;
        if (id) {
          setIncomingInvite({
            callType,
            callId: id,
            fromUserId,
          });
        }
      } catch (e) {
        console.warn("call.invited handler error:", e);
      }
    });

    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, [streamClient]);

  // Restore persisted permission (simple persistence)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ehr_permission_verified");
      const storedHH = localStorage.getItem("ehr_other_party_hh");
      if (stored === "true" && storedHH) {
        setPermissionGranted(true);
        setHasPermission(true);
        setOtherPartyHH(storedHH);
        setStatusMessage("✓ Permission verified! You can now start a video call.");
      }
    } catch {}
  }, []);

  // Check blockchain permission
  const checkPermission = async () => {
    if (!otherPartyHH.trim()) {
      setStatus("Please enter the other party's HH Number.");
      setStatusMessage("Please enter the other party's HH Number.");
      return;
    }

    if (!patientContract || !account) {
      setStatus("Blockchain connection not ready. Please check MetaMask.");
      setStatusMessage("Blockchain connection not ready. Please check MetaMask.");
      return;
    }

    setIsChecking(true);
    setLoading(true);
    setStatus("Checking blockchain permission...");
    setStatusMessage("Checking blockchain permission...");

    try {
      const { web3, networkId } = await getWeb3AndAccount();
      let patientHH, doctorHH;
      let otherPartyAddress;

      let resolvedUserType = userType;

      // If userType wasn't resolved at init, try to infer it now
      if (!resolvedUserType) {
        try {
          const maybePatient = await patientContract.methods.getPatientDetails(hhNumber).call();
          if (maybePatient && maybePatient[0] && maybePatient[0].toLowerCase() === account.toLowerCase()) {
            resolvedUserType = "patient";
            setUserType("patient");
          }
        } catch {}
        if (!resolvedUserType) {
          try {
            const maybeDoctor = await doctorContract.methods.getDoctorDetails(hhNumber).call();
            if (maybeDoctor && maybeDoctor[0] && maybeDoctor[0].toLowerCase() === account.toLowerCase()) {
              resolvedUserType = "doctor";
              setUserType("doctor");
            }
          } catch {}
        }
        if (!resolvedUserType) {
          setStatus("Error: Could not determine your role from the provided HH Number. Please ensure your MetaMask account matches your registration.");
          setStatusMessage("Error: Could not determine your role. Ensure your MetaMask account matches your registration.");
          setIsChecking(false);
          setLoading(false);
          return;
        }
      }

      if (resolvedUserType === "patient") {
        patientHH = hhNumber;
        doctorHH = otherPartyHH.trim();
        
        // Get doctor's wallet address
        const doctorDetails = await doctorContract.methods.getDoctorDetails(doctorHH).call();
        otherPartyAddress = doctorDetails[0];
        setOtherPartyDetails({
          hhNumber: doctorHH,
          name: doctorDetails[1] || "Doctor",
          walletAddress: otherPartyAddress,
        });
      } else {
        patientHH = otherPartyHH.trim();
        doctorHH = hhNumber;
        
        // Get patient's wallet address
        const patientDetails = await patientContract.methods.getPatientDetails(patientHH).call();
        otherPartyAddress = patientDetails[0];
        setOtherPartyDetails({
          hhNumber: patientHH,
          name: patientDetails[1] || "Patient",
          walletAddress: otherPartyAddress,
        });
      }

      // Check permission on blockchain
      const permission = await patientContract.methods
        .isPermissionGranted(patientHH, doctorHH)
        .call();

      if (!permission) {
        setHasPermission(false);
        setPermissionGranted(false);
        setStatus("Access Denied: Patient has not granted permission to this doctor.");
        setStatusMessage("Access denied. Patient has not granted permission.");
        try {
          localStorage.removeItem("ehr_permission_verified");
          localStorage.removeItem("ehr_other_party_hh");
        } catch {}
      } else {
        setHasPermission(true);
        setPermissionGranted(true);
        setStatus("✓ Permission verified! You can now start a video call.");
        setStatusMessage("✓ Permission verified! You can now start a video call.");
        try {
          localStorage.setItem("ehr_permission_verified", "true");
          localStorage.setItem("ehr_other_party_hh", resolvedUserType === "patient" ? doctorHH : patientHH);
        } catch {}
        
        // Generate call ID
        const newCallId = generateCallId();
        setCallId(newCallId);
      }
    } catch (error) {
      console.error("Error checking permission:", error);
      setHasPermission(false);
      setPermissionGranted(false);
      if (error.message.includes("not found")) {
        setStatus(`Error: ${error.message}`);
        setStatusMessage(`Error: ${error.message}`);
      } else {
        setStatus(`Error checking permission: ${error.message}`);
        setStatusMessage(`Error checking permission: ${error.message}`);
      }
    } finally {
      setIsChecking(false);
      setLoading(false);
    }
  };

  // Start video call
  const startVideoCall = async () => {
    if (!(hasPermission || permissionGranted) || !account || !currentUserDetails) {
      setStatus("Please verify permission first.");
      setStatusMessage("Please verify permission first.");
      return;
    }

    setStatus("Sending call request...");
    setStatusMessage("🔗 Sending call request...");

    try {
      const s = getSocket(hhNumber, account || "");
      const payload = {
        fromHH: hhNumber,
        toHH: otherPartyHH.trim(),
        fromWallet: account,
        toWallet: otherPartyDetails?.walletAddress || null,
        role: userType,
      };
      setIsRequesting(true);
      s.emit("call_request", payload);
      setStatus("Call request sent. Waiting for recipient...");
      setStatusMessage("Call request sent. Waiting for recipient...");
    } catch (error) {
      console.error("Error starting video call:", error);
      setStatus(`Error starting video call: ${error.message}`);
      setStatusMessage("Error starting video call. Please try again.");
    }
  };

  // Leave call
  const leaveCall = async () => {
    try {
      if (call) {
        await call.leave();
        setCall(null);
      }
      if (streamClient) {
        // Clean up Stream client
        await streamClient.disconnectUser();
        setStreamClient(null);
      }
    } catch (error) {
      console.error("Error leaving call:", error);
    } finally {
      setIsInCall(false);
      setCallId(null);
      setStatus("");
      setHasPermission(false);
      setPermissionGranted(false);
      setOtherPartyHH("");
      try {
        localStorage.removeItem("ehr_permission_verified");
        localStorage.removeItem("ehr_other_party_hh");
      } catch {}
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    if (isInCall) {
      leaveCall();
    }
    if (userType === "patient") {
      navigate("/patient/" + hhNumber);
    } else {
      navigate("/doctor/" + hhNumber);
    }
  };

  return (
    <div>
      <NavBar_Logout />
      <ConnectionBanner />

      {/* Incoming Call Modal */}
      {incomingInvite && !isInCall && (
        <div className="video-call-invite-backdrop">
          <div className="video-call-invite-modal">
            <h3>Incoming Call</h3>
            <p>
              You have an incoming call from {incomingInvite.fromUserId?.slice(0, 6)}...
              {incomingInvite.fromUserId?.slice(-4)}
            </p>
            <div className="invite-actions">
              <button
                className="action-button start-call"
                onClick={async () => {
                  try {
                    const s = getSocket(hhNumber, account || "");
                    s.emit("call_accept", { roomId: incomingInvite.callId });
                    setStatus("Accepting call...");
                    setIncomingInvite(null);
                  } catch (err) {
                    console.error("Accept invite error:", err);
                    setStatus(`Error accepting call: ${err.message}`);
                  }
                }}
              >
                Accept
              </button>
              <button
                className="action-button secondary"
                onClick={async () => {
                  try {
                    const s = getSocket(hhNumber, account || "");
                    if (incomingInvite?.callId) {
                      s.emit("call_reject", { roomId: incomingInvite.callId, reason: "declined" });
                    }
                    setIncomingInvite(null);
                    setStatus("Declined call.");
                  } catch {}
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="video-consultation-container">
        <h1 className="video-heading">Secure Video Consultation</h1>
        <p className="video-subheading">
          Connect with your {userType === "patient" ? "doctor" : "patient"} securely via blockchain-verified access.
        </p>

        {!isInCall ? (
          <div className="video-consultation-form">
            <div className="form-group">
              <label className="form-label">
                {userType === "patient" ? "Doctor" : "Patient"} HH Number
              </label>
              <input
                type="text"
                className="form-input ehr-input"
                placeholder={`Enter ${userType === "patient" ? "Doctor" : "Patient"} HH Number`}
                value={otherPartyHH}
                onChange={(e) => setOtherPartyHH(e.target.value)}
                required
              />
            </div>

            {(status || statusMessage) && (
              <div className={`status-message ${
                (statusMessage || status).includes("✓") ? "success" : 
                (statusMessage || status).includes("Error") || (statusMessage || status).includes("Denied") ? "error" : 
                "info"
              }`}>
                {statusMessage || status}
              </div>
            )}

            <div className="video-actions">
              <button
                className="action-button primary"
                onClick={checkPermission}
                disabled={loading || isChecking || !otherPartyHH.trim()}
              >
                {loading || isChecking ? "Verifying..." : "Verify Permission"}
              </button>

              { (hasPermission || permissionGranted) && (
                <button
                  className="action-button start-call"
                  onClick={startVideoCall}
                >
                  {isRequesting ? "Requesting..." : "Request Video Call"}
                </button>
              )}

              <button
                className="action-button secondary"
                onClick={handleCancel}
                disabled={isChecking}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="video-call-container">
            {streamClient && call ? (
              <StreamVideo client={streamClient}>
                <StreamCall call={call}>
                  <CallContent 
                    callId={callId}
                    otherPartyDetails={otherPartyDetails}
                    onLeave={leaveCall}
                  />
                </StreamCall>
              </StreamVideo>
            ) : (
              <div className="video-loading">
                <p>Initializing video call...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// CallContent component for rendering video UI
const CallContent = ({ callId, otherPartyDetails, onLeave }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  // Auto-cleanup if user has left the call
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeave();
    }
  }, [callingState, onLeave]);

  return (
    <div className="video-call-interface">
      <div className="call-info">
        <h2 className="call-title">Live Consultation</h2>
        {otherPartyDetails && (
          <p className="call-participant">
            Connected with: {otherPartyDetails.name} ({otherPartyDetails.hhNumber})
          </p>
        )}
        {callId && (
          <p className="call-id-text">Call ID: {callId}</p>
        )}
      </div>

      <div className="call-ui">
        <StreamTheme>
          <div className="participants-container">
            <SpeakerLayout />
          </div>
          <div className="call-controls-container">
            <CallControls />
          </div>
        </StreamTheme>
      </div>
    </div>
  );
};

export default VideoConsultation;

