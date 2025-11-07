# 🚀 Quick Deployment Guide - UploadEhr Contract

## Prerequisites Checklist
- ✅ Ganache running on `http://127.0.0.1:7545`
- ✅ Chain ID set to `1337` in Ganache
- ✅ MetaMask connected to Ganache network (127.0.0.1:7545, Chain ID 1337)
- ✅ At least one account imported to MetaMask from Ganache

## Deployment Steps

### Option 1: Using Scripts (Easiest)

**Windows:**
```bash
cd Electronic-Health-Record/src
deploy-contracts.bat
```

**Mac/Linux:**
```bash
cd Electronic-Health-Record/src
chmod +x deploy-contracts.sh
./deploy-contracts.sh
```

### Option 2: Manual Commands

Open a terminal in the `Electronic-Health-Record/src` directory and run:

```bash
# Step 1: Compile contracts
truffle compile

# Step 2: Deploy to Ganache (network 1337)
truffle migrate --network development --reset
```

## Verify Deployment

After deployment, check `src/build/contracts/UploadEhr.json`:

```json
"networks": {
  "1337": {
    "address": "0x...",
    "transactionHash": "0x..."
  }
}
```

If you see a `"1337"` entry with an address, deployment was successful! ✅

## Test the DApp

1. Start your React app: `npm start` (from project root)
2. Navigate to Upload Past Records page
3. The error should be gone and you should be able to upload files!

## Troubleshooting

### "Network is not defined" error
- Make sure you're running commands from the `src` directory where `truffle-config.js` is located

### "Error: Could not connect to your Ethereum client"
- Verify Ganache is running
- Check Ganache is on port 7545
- Try restarting Ganache

### Contract still not found after deployment
- Clear browser cache and reload
- Check MetaMask is on network 1337
- Verify the JSON file has the "1337" entry
- Try clicking "Reconnect" button in the DApp

### Migration fails with "insufficient funds"
- Make sure Ganache has accounts with ETH
- Check the deploying account has enough balance

## What Happens After Deployment

1. ✅ Contract deployed to network 1337
2. ✅ Address saved in `UploadEhr.json`
3. ✅ Frontend automatically detects the contract
4. ✅ Error message disappears
5. ✅ Ready to upload files to IPFS and blockchain!

---

**Need Help?** Check the browser console for detailed error messages.

