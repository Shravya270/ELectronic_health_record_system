/**
 * Quick setup verification script
 * Checks if Ganache is running and contracts are deployed
 * 
 * Usage: node verify-setup.js
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

const GANACHE_RPC = 'http://127.0.0.1:7545';
const EXPECTED_NETWORK_ID = 1337;
const CONTRACTS_DIR = path.join(__dirname, 'src', 'build', 'contracts');

// Contract files to check
const CONTRACT_FILES = [
  'PatientRegistration.json',
  'DoctorRegistration.json',
  'DiagnosticRegistration.json',
  'UploadEhr.json'
];

async function checkGanacheConnection() {
  console.log('🔍 Checking Ganache connection...');
  
  try {
    const web3 = new Web3(GANACHE_RPC);
    const networkId = await web3.eth.net.getId();
    const isConnected = await web3.eth.net.isListening();
    
    if (!isConnected) {
      console.error('❌ Cannot connect to Ganache. Is it running?');
      return false;
    }
    
    if (networkId !== EXPECTED_NETWORK_ID) {
      console.warn(`⚠️  Network ID mismatch. Expected ${EXPECTED_NETWORK_ID}, got ${networkId}`);
      return false;
    }
    
    const accounts = await web3.eth.getAccounts();
    const balance = await web3.eth.getBalance(accounts[0]);
    const balanceEth = web3.utils.fromWei(balance, 'ether');
    
    console.log(`✅ Ganache is running on ${GANACHE_RPC}`);
    console.log(`   Network ID: ${networkId}`);
    console.log(`   Accounts: ${accounts.length}`);
    console.log(`   First account balance: ${balanceEth} ETH`);
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to Ganache:', error.message);
    console.error('   Make sure Ganache is running on port 7545');
    return false;
  }
}

function checkContractDeployments() {
  console.log('\n🔍 Checking contract deployments...');
  
  let allDeployed = true;
  
  CONTRACT_FILES.forEach(contractFile => {
    const contractPath = path.join(CONTRACTS_DIR, contractFile);
    
    if (!fs.existsSync(contractPath)) {
      console.error(`❌ Contract file not found: ${contractFile}`);
      allDeployed = false;
      return;
    }
    
    try {
      const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      const networkData = contractData.networks[EXPECTED_NETWORK_ID] 
        || contractData.networks[EXPECTED_NETWORK_ID.toString()];
      
      if (!networkData || !networkData.address) {
        console.error(`❌ ${contractFile.replace('.json', '')} not deployed on network ${EXPECTED_NETWORK_ID}`);
        allDeployed = false;
      } else {
        console.log(`✅ ${contractFile.replace('.json', '')} deployed at: ${networkData.address}`);
      }
    } catch (error) {
      console.error(`❌ Error reading ${contractFile}:`, error.message);
      allDeployed = false;
    }
  });
  
  return allDeployed;
}

function checkMetaMaskInstructions() {
  console.log('\n📝 MetaMask Setup Checklist:');
  console.log('   [ ] MetaMask extension installed');
  console.log('   [ ] Ganache network added (RPC: http://127.0.0.1:7545, Chain ID: 1337)');
  console.log('   [ ] At least one Ganache account imported to MetaMask');
  console.log('   [ ] MetaMask connected to Ganache network');
  console.log('   [ ] MetaMask unlocked');
}

async function main() {
  console.log('🚀 EHR Project Setup Verification\n');
  console.log('='.repeat(50));
  
  const ganacheOk = await checkGanacheConnection();
  const contractsOk = checkContractDeployments();
  checkMetaMaskInstructions();
  
  console.log('\n' + '='.repeat(50));
  
  if (ganacheOk && contractsOk) {
    console.log('\n✅ Setup looks good! You can start the React app with: npm start');
  } else {
    console.log('\n❌ Setup incomplete. Please fix the issues above.');
    
    if (!ganacheOk) {
      console.log('\n💡 To fix Ganache connection:');
      console.log('   1. Open Ganache GUI');
      console.log('   2. Create/Open a workspace');
      console.log('   3. Make sure it\'s running on port 7545');
    }
    
    if (!contractsOk) {
      console.log('\n💡 To deploy contracts:');
      console.log('   1. cd src');
      console.log('   2. truffle compile');
      console.log('   3. truffle migrate --network ganache --reset');
    }
  }
  
  console.log('\n📖 For detailed setup instructions, see: GANACHE_METAMASK_SETUP.md\n');
}

main().catch(console.error);


