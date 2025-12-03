# Video Consultation Integration Setup Guide

This guide explains how to set up the integrated video calling functionality between ProjectEHR and Streamify.

## Prerequisites

1. **Stream API Account**: Sign up at [https://getstream.io/](https://getstream.io/) and get your API key and secret.
2. **Streamify Backend Running**: Ensure the Streamify backend is running on port 5001 (or update the base URL accordingly).
3. **Node.js and npm**: Make sure you have Node.js installed.

## Step 1: Install Dependencies

Navigate to the ProjectEHR directory and install the required dependencies:

```bash
cd ProjectEHR
npm install
```

This will install the Stream Video SDK and other dependencies listed in `package.json`.

## Step 2: Configure Environment Variables

Create a `.env` file in the root of the `ProjectEHR` directory with the following content:

```env
# Stream API Configuration
# Get your Stream API key from https://getstream.io/
REACT_APP_STREAM_API_KEY=your_stream_api_key_here

# Streamify Backend API Base URL
# Default: http://localhost:5001/api
# Update this if your Streamify backend runs on a different port
REACT_APP_STREAM_API_BASE_URL=http://localhost:5001/api
```

**Important**: 
- Replace `your_stream_api_key_here` with your actual Stream API key from getstream.io
- The API key is public and safe to expose in the frontend (it's used for client-side initialization)
- The API secret should be kept in the Streamify backend's `.env` file only

## Step 3: Configure Streamify Backend

Ensure your Streamify backend has the following environment variables in its `.env` file:

```env
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here
PORT=5001
```

The backend should be running and accessible at `http://localhost:5001`.

## Step 4: Start the Applications

### Start Streamify Backend

```bash
cd video_call-ehr/Streamify/backend
npm install  # If not already installed
npm start
# Or for development: npm run dev
```

### Start ProjectEHR Frontend

```bash
cd ProjectEHR
npm start
```

The ProjectEHR app should start on `http://localhost:3000` (default for Create React App).

## Step 5: Testing the Integration

1. **Login as Patient or Doctor**: Use your existing login system to access the dashboard.

2. **Navigate to Video Consultation**: 
   - Click the "Video Consultation" button on your dashboard (Patient or Doctor).

3. **Verify Permission**:
   - Enter the other party's HH Number (Doctor HH if you're a patient, Patient HH if you're a doctor).
   - Click "Verify Permission" to check blockchain permissions.

4. **Start Video Call**:
   - If permission is granted, click "Start Video Call".
   - The system will generate a Stream token and create a video call session.
   - Share the Call ID with the other party to join the call.

5. **Join Call**:
   - The other party can join using the same Call ID from their dashboard.

## Architecture Overview

### Flow Diagram

```
Patient/Doctor Dashboard
    ↓
Video Consultation Page
    ↓
Blockchain Permission Check (PatientRegistration contract)
    ↓
Streamify Backend (/api/ehr/auth/token)
    ↓
Stream Video SDK Initialization
    ↓
Video Call Session
```

### Key Components

1. **VideoConsultation.js**: Main component handling permission checks and video call setup.
2. **videoHelper.js**: Utility functions for Stream API communication.
3. **ehr.route.js**: Backend route for generating Stream tokens for EHR users.
4. **PatientRegistration.sol**: Smart contract managing doctor-patient permissions.

## Troubleshooting

### Issue: "Stream API key not configured"

**Solution**: Make sure you've created the `.env` file in the ProjectEHR root directory with `REACT_APP_STREAM_API_KEY` set.

### Issue: "Failed to get Stream token"

**Solution**: 
- Verify the Streamify backend is running on port 5001.
- Check that `REACT_APP_STREAM_API_BASE_URL` in `.env` matches your backend URL.
- Ensure CORS is properly configured in the Streamify backend (should allow `http://localhost:3000`).

### Issue: "Access Denied: Patient has not granted permission"

**Solution**: 
- The patient must grant permission to the doctor first using the "Grant Permission" feature.
- Verify the HH numbers are correct.
- Check that the permission transaction was successful on the blockchain.

### Issue: Video call doesn't start

**Solution**:
- Check browser console for errors.
- Verify Stream API credentials are correct.
- Ensure MetaMask is connected and on the correct network (Ganache - Chain ID 1337).
- Check that the Stream Video SDK is properly installed: `npm list @stream-io/video-react-sdk`

## Security Considerations

1. **Blockchain Permissions**: Video calls are only allowed when on-chain permissions are verified.
2. **Token Generation**: Stream tokens are generated server-side to prevent API secret exposure.
3. **Wallet Verification**: Users must connect their MetaMask wallet that matches their registered address.
4. **CORS**: The Streamify backend only accepts requests from whitelisted origins.

## Next Steps (Optional Enhancements)

1. **Full Video UI**: Integrate Stream Video UI components (ParticipantView, CallControls, etc.) for a complete video calling experience.
2. **Call Notifications**: Add real-time notifications when a call is initiated.
3. **Call History**: Store call records in MongoDB or IPFS for audit purposes.
4. **Auto-join**: Automatically load doctor/patient mappings from blockchain to simplify the process.

## Support

For issues or questions:
1. Check the browser console for error messages.
2. Verify all environment variables are set correctly.
3. Ensure both frontend and backend are running.
4. Check that smart contracts are deployed on the correct network.

## Notes

- The current implementation provides the foundation for video calling with blockchain permission verification.
- The video UI is a placeholder - you can enhance it by importing Stream Video UI components.
- Call IDs are generated client-side - consider generating them server-side for better security.
- The integration maintains separation between ProjectEHR and Streamify while providing seamless functionality.

