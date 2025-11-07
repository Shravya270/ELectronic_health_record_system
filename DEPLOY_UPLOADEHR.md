# 🚀 Deploy Updated UploadEhr Contract

## Overview
The `UploadEhr.sol` contract has been updated to support doctor access to patient records. You need to recompile and redeploy it.

## Changes Made

### New Features
1. **Doctor Access Control**: Added `patientToDoctorPermission` mapping
2. **New Functions**:
   - `grantAccessToDoctor(address doctor)` - Patient grants access
   - `revokeAccessFromDoctor(address doctor)` - Patient revokes access
   - `getPatientRecords(address patient)` - Doctor fetches patient records (with permission check)
   - `uploadRecord(string ipfsHash)` - Simplified upload (auto-timestamp)
   - `getMyRecords()` - Patient gets their own records

### Backward Compatibility
- `addRecord()` and `getRecords()` functions still work for existing code

## Deployment Steps

### 1. Navigate to src directory
```bash
cd Electronic-Health-Record/src
```

### 2. Compile contracts
```bash
truffle compile
```

### 3. Deploy to Ganache
```bash
truffle migrate --network development --reset
```

**Note**: The `--reset` flag will redeploy ALL contracts. If you only want to redeploy UploadEhr, you may need to comment out other migrations temporarily.

### 4. Verify Deployment

After deployment, check `src/build/contracts/UploadEhr.json`:

```json
"networks": {
  "1337": {
    "address": "0x...",
    "transactionHash": "0x..."
  }
}
```

## Testing

1. **Patient Upload**: Upload a file via Upload Past Records page
2. **Grant Permission**: Grant access to a doctor via Grant Permission page
3. **Doctor View**: Doctor should be able to see patient records in View Patient Records page

## Troubleshooting

### "Contract not deployed" error
- Make sure you ran `truffle migrate --network development --reset`
- Check that Ganache is running on port 7545
- Verify network ID is 1337 in MetaMask

### "Access denied" error
- Make sure patient granted permission in both:
  1. PatientRegistration contract (via Grant Permission page)
  2. UploadEhr contract (automatically done when granting permission)

### Migration fails
- Check Ganache has enough accounts with ETH
- Verify truffle-config.js has correct network settings
- Try restarting Ganache

---

**After deployment, the frontend will automatically use the new contract functions!**

