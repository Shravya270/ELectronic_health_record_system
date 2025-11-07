# UploadEhr Contract Deployment Instructions

## Prerequisites
1. Ganache running on `http://127.0.0.1:7545`
2. MetaMask connected to Ganache network (Network ID: 1337)
3. Truffle installed globally: `npm install -g truffle`

## Deployment Steps

### 1. Ensure Ganache is Running
- Start Ganache GUI or CLI
- Note the RPC Server address (usually `http://127.0.0.1:7545`)
- Note the Network ID (usually `1337`)

### 2. Configure MetaMask
- Open MetaMask
- Click network dropdown → Add Network
- Or use existing Ganache network:
  - Network Name: Ganache
  - RPC URL: `http://127.0.0.1:7545`
  - Chain ID: `1337`
  - Currency Symbol: ETH

### 3. Import Account to MetaMask
- Copy a private key from Ganache
- In MetaMask: Account menu → Import Account
- Paste the private key

### 4. Deploy Contracts

Navigate to the project root directory and run:

```bash
# Compile contracts
truffle compile

# Deploy to Ganache network (with reset to redeploy)
truffle migrate --network ganache --reset

# Or if using development network
truffle migrate --network development --reset
```

### 5. Verify Deployment

After migration, check that `src/build/contracts/UploadEhr.json` contains:
```json
"networks": {
  "1337": {
    "address": "0x...",
    "transactionHash": "0x..."
  }
}
```

### 6. Test the Frontend

1. Start the React app: `npm start`
2. Navigate to Upload Past Records page
3. The contract should be automatically detected
4. If you see "contract not deployed" error, click "Reconnect" button

## Troubleshooting

### Contract Not Found on Network 1337
- Ensure Ganache is running
- Check MetaMask is connected to the correct network
- Run `truffle migrate --network ganache --reset` again
- Verify the network ID in Ganache matches MetaMask

### Migration Fails
- Check Ganache is running and accessible
- Ensure you have enough ETH in the deploying account
- Check truffle-config.js has correct network settings

### Frontend Can't Connect
- Clear browser cache
- Restart React development server
- Check browser console for errors
- Verify MetaMask is unlocked and connected

## Network Configuration

The `truffle-config.js` now includes:
- `development`: Port 7545, any network ID
- `ganache`: Port 7545, Network ID 1337

Use the appropriate network flag when deploying:
- `--network ganache` for Ganache (Network ID 1337)
- `--network development` for default development

