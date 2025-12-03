# 🔗 Connecting Project to Ganache and MetaMask

This guide will walk you through setting up Ganache and MetaMask to work with your EHR project.

## 📋 Prerequisites

1. **Node.js** installed (v14 or higher)
2. **Ganache** installed ([Download here](https://www.trufflesuite.com/ganache))
3. **MetaMask** browser extension installed ([Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/))
4. **Truffle** installed globally: `npm install -g truffle`

## 🚀 Step-by-Step Setup

### Step 1: Start Ganache

1. **Open Ganache GUI**
   - Launch Ganache from your applications
   - Click **"New Workspace"** (or **"Quickstart"** for default settings)

2. **Configure Workspace** (if using New Workspace):
   - Click **"Add Project"**
   - Navigate to your project directory and select `truffle-config.js`
   - Or manually configure:
     - **Server Settings:**
       - Hostname: `127.0.0.1`
       - Port: `7545`
     - **Network Settings:**
       - Network ID: `1337` (Chain ID)
   - Click **"Save Workspace"**

3. **Verify Ganache is Running**
   - You should see a list of accounts with 100 ETH each
   - Note the **RPC Server** address: `http://127.0.0.1:7545`
   - Note the **Network ID**: `1337`

### Step 2: Configure MetaMask

1. **Add Ganache Network to MetaMask**
   - Open MetaMask extension in your browser
   - Click the network dropdown (usually shows "Ethereum Mainnet")
   - Click **"Add Network"** → **"Add a network manually"**
   - Enter the following details:
     - **Network Name:** `Ganache`
     - **RPC URL:** `http://127.0.0.1:7545`
     - **Chain ID:** `1337`
     - **Currency Symbol:** `ETH`
     - **Block Explorer URL:** (leave empty)
   - Click **"Save"**

2. **Import Ganache Account to MetaMask**
   - In Ganache, click on the key icon (🔑) next to the first account to reveal the private key
   - Copy the private key (it will look like: `0x...`)
   - In MetaMask:
     - Click the account icon (circle) in the top right
     - Click **"Import Account"**
     - Select **"Private Key"**
     - Paste the private key from Ganache
     - Click **"Import"**
   - Repeat for additional accounts if needed (you can import multiple accounts)

3. **Verify MetaMask Connection**
   - Make sure MetaMask is connected to the **Ganache** network (check the network dropdown)
   - Verify your account shows ETH balance (should be 100 ETH)
   - Unlock MetaMask if it's locked

### Step 3: Deploy Smart Contracts

1. **Navigate to Project Directory**
   ```bash
   cd ProjectEHR
   ```

2. **Install Dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Compile Contracts**
   ```bash
   cd src
   truffle compile
   ```

4. **Deploy Contracts to Ganache**
   ```bash
   truffle migrate --network ganache --reset
   ```
   
   **OR** if using the development network:
   ```bash
   truffle migrate --network development --reset
   ```

5. **Verify Deployment**
   - After migration, check that contract addresses were created
   - Verify in `src/build/contracts/*.json` files that they contain:
     ```json
     "networks": {
       "1337": {
         "address": "0x...",
         "transactionHash": "0x..."
       }
     }
     ```

### Step 4: Start the React Application

1. **Start the Development Server**
   ```bash
   npm start
   ```

2. **Connect MetaMask When Prompted**
   - The app will automatically detect MetaMask
   - When you interact with the app, MetaMask will prompt you to connect
   - Click **"Connect"** to allow the app to access your MetaMask account
   - Approve any transaction requests

### Step 5: Verify Connection

1. **Check Connection Status**
   - The app should show a connection banner at the top
   - It should display: "Connected to Ganache (1337)"
   - Your MetaMask account address should be visible

2. **Test a Transaction**
   - Try registering as a patient, doctor, or diagnostic center
   - MetaMask should prompt you to confirm the transaction
   - After confirmation, check Ganache to see the transaction

## 🔧 Configuration Details

### Network Configuration

The project is configured to use:
- **RPC URL:** `http://127.0.0.1:7545`
- **Network ID/Chain ID:** `1337`
- **Port:** `7545`

This is defined in:
- `truffle-config.js` - For contract deployment
- `src/utils/ensureNetwork.js` - For frontend validation
- `src/utils/web3Provider.js` - For Web3 connection

### Important Files

- **`truffle-config.js`** - Truffle network configuration
- **`src/utils/web3Provider.js`** - Web3 initialization and MetaMask connection
- **`src/utils/ensureNetwork.js`** - Network validation
- **`src/utils/getContract.js`** - Contract instance creation

## 🐛 Troubleshooting

### Problem: MetaMask shows "Wrong Network"

**Solution:**
- Verify MetaMask is connected to the "Ganache" network
- Check that Chain ID is `1337` in MetaMask network settings
- Reload the page after switching networks

### Problem: "Contract not deployed on network 1337"

**Solution:**
- Make sure Ganache is running
- Verify contracts were deployed: `truffle migrate --network ganache --reset`
- Check `src/build/contracts/*.json` files contain network `1337` data
- Clear browser cache and restart the React app

### Problem: "MetaMask not detected"

**Solution:**
- Install MetaMask browser extension
- Refresh the page
- Make sure MetaMask is unlocked
- Try a different browser if the issue persists

### Problem: Transaction Fails in MetaMask

**Solution:**
- Check you have enough ETH in your MetaMask account (should have 100 ETH from Ganache)
- Verify Ganache is still running
- Check the gas limit is sufficient
- Look at Ganache logs for error details

### Problem: Can't Import Account to MetaMask

**Solution:**
- Make sure you're copying the full private key from Ganache (starts with `0x`)
- Don't include any spaces
- Try importing a different account from Ganache
- Make sure MetaMask extension is up to date

### Problem: Ganache Connection Refused

**Solution:**
- Verify Ganache is running
- Check the port is `7545` (default)
- Try restarting Ganache
- Check firewall isn't blocking the connection
- Verify `truffle-config.js` has the correct host and port

## 📝 Quick Reference Commands

```bash
# Start Ganache (GUI - just open the application)

# Compile contracts
cd ProjectEHR/src
truffle compile

# Deploy contracts
truffle migrate --network ganache --reset

# Start React app
cd ProjectEHR
npm start

# Check network ID
truffle console --network ganache
> web3.eth.net.getId()
```

## ✅ Verification Checklist

- [ ] Ganache is running on port 7545
- [ ] Ganache network ID is 1337
- [ ] MetaMask has Ganache network added (Chain ID: 1337)
- [ ] At least one Ganache account is imported to MetaMask
- [ ] Contracts are compiled (`truffle compile`)
- [ ] Contracts are deployed (`truffle migrate --network ganache --reset`)
- [ ] React app is running (`npm start`)
- [ ] MetaMask is connected to Ganache network
- [ ] App shows "Connected to Ganache (1337)" status
- [ ] Test transaction works (e.g., register a patient)

## 🎯 Next Steps

Once everything is connected:

1. **Test Registration:** Register as a patient, doctor, or diagnostic center
2. **Test Transactions:** Create EHR records, grant permissions, etc.
3. **View Transactions:** Check Ganache transactions tab to see all blockchain activity
4. **Monitor Gas:** Watch gas usage in Ganache for optimization

## 📚 Additional Resources

- [Ganache Documentation](https://trufflesuite.com/docs/ganache/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Truffle Documentation](https://trufflesuite.com/docs/truffle/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)

---

**Note:** This project is configured to work exclusively with Ganache (Network ID 1337). If you need to connect to other networks (like testnets or mainnet), you'll need to modify the network configuration files.


