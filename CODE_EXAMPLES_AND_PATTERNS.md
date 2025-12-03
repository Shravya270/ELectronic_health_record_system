# 💻 Code Examples & Implementation Patterns

## 📚 Table of Contents
1. [Smart Contract Code Examples](#smart-contract-code-examples)
2. [Frontend Integration Patterns](#frontend-integration-patterns)
3. [IPFS Upload Implementation](#ipfs-upload-implementation)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Common Code Snippets](#common-code-snippets)

---

## 📜 Smart Contract Code Examples

### 1. Patient Registration Contract (Simplified)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PatientRegistration {
    struct Patient {
        address walletAddress;
        string name;
        string dateOfBirth;
        string hhNumber;  // Health History Number (unique ID)
    }

    // Key Mappings
    mapping(string => bool) public isPatientRegistered;
    mapping(string => Patient) public patients;
    mapping(string => mapping(string => bool)) public doctorPermissions;

    // Events
    event PatientRegistered(string hhNumber, string name, address walletAddress);
    event PermissionGranted(string indexed patientHH, string indexed doctorHH);

    // Register a new patient
    function registerPatient(
        address _walletAddress,
        string memory _name,
        string memory _dateOfBirth,
        string memory _hhNumber
    ) external {
        require(!isPatientRegistered[_hhNumber], "Patient already registered");
        
        Patient memory newPatient = Patient({
            walletAddress: _walletAddress,
            name: _name,
            dateOfBirth: _dateOfBirth,
            hhNumber: _hhNumber
        });

        patients[_hhNumber] = newPatient;
        isPatientRegistered[_hhNumber] = true;
        
        emit PatientRegistered(_hhNumber, _name, _walletAddress);
    }

    // Grant permission to doctor
    function grantPermission(
        string memory _patientNumber,
        string memory _doctorNumber,
        string memory _patientName
    ) external {
        require(isPatientRegistered[_patientNumber], "Patient not registered");
        require(!doctorPermissions[_patientNumber][_doctorNumber], "Permission already granted");
        
        doctorPermissions[_patientNumber][_doctorNumber] = true;
        
        emit PermissionGranted(_patientNumber, _doctorNumber);
    }

    // Check permission status
    function isPermissionGranted(
        string memory _patientNumber,
        string memory _doctorNumber
    ) external view returns (bool) {
        return doctorPermissions[_patientNumber][_doctorNumber];
    }
}
```

### 2. UploadEhr Contract (Core Record Storage)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UploadEhr {
    struct PatientRecord {
        uint256 timeStamp;        // Using uint256 instead of string (gas optimization)
        string medicalRecordHash; // IPFS CID
    }

    // Storage
    mapping(address => PatientRecord[]) private records;
    mapping(address => mapping(address => bool)) public patientToDoctorPermission;

    // Events
    event RecordUploaded(address indexed patient, string ipfsHash, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);

    // Upload record (patient only)
    function uploadRecord(string memory ipfsHash) public {
        PatientRecord memory newRecord = PatientRecord({
            timeStamp: block.timestamp,  // Auto-generate timestamp
            medicalRecordHash: ipfsHash
        });
        
        records[msg.sender].push(newRecord);
        
        emit RecordUploaded(msg.sender, ipfsHash, block.timestamp);
    }

    // Get patient's own records
    function getMyRecords() public view returns (PatientRecord[] memory) {
        return records[msg.sender];
    }

    // Grant access to doctor
    function grantAccessToDoctor(address doctor) public {
        require(doctor != address(0), "Invalid doctor address");
        require(!patientToDoctorPermission[msg.sender][doctor], "Access already granted");
        
        patientToDoctorPermission[msg.sender][doctor] = true;
        
        emit AccessGranted(msg.sender, doctor);
    }

    // Revoke access from doctor
    function revokeAccessFromDoctor(address doctor) public {
        patientToDoctorPermission[msg.sender][doctor] = false;
        
        emit AccessRevoked(msg.sender, doctor);
    }

    // Doctor gets patient records (with permission check)
    function getPatientRecords(address patient) 
        public 
        view 
        returns (PatientRecord[] memory) 
    {
        require(
            patientToDoctorPermission[patient][msg.sender],
            "Access denied: Permission not granted by patient"
        );
        
        return records[patient];
    }

    // Get record count for a patient
    function getRecordCount(address patient) public view returns (uint256) {
        return records[patient].length;
    }
}
```

### 3. Improved Version with Gas Optimization

```solidity
// Optimized version with better gas usage
contract UploadEhrOptimized {
    struct PatientRecord {
        uint256 timeStamp;        // uint256 instead of string
        bytes32 ipfsHash;         // bytes32 for fixed-size hash (if CID fits)
        // OR keep as string if CID is variable length
    }

    // Use events for historical data (cheaper than storage)
    event RecordUploaded(
        address indexed patient,
        string ipfsHash,
        uint256 indexed timestamp
    );

    // Batch upload for multiple records
    function uploadRecordsBatch(string[] memory ipfsHashes) public {
        require(ipfsHashes.length > 0, "Empty array");
        require(ipfsHashes.length <= 10, "Too many records"); // Prevent gas limit
        
        for (uint i = 0; i < ipfsHashes.length; i++) {
            records[msg.sender].push(PatientRecord({
                timeStamp: block.timestamp,
                medicalRecordHash: ipfsHashes[i]
            }));
            
            emit RecordUploaded(msg.sender, ipfsHashes[i], block.timestamp);
        }
    }
}
```

---

## 🎨 Frontend Integration Patterns

### 1. Standard Contract Initialization Pattern

```javascript
import { useState, useEffect } from 'react';
import { getWeb3AndAccount, setupNetworkListeners } from '../utils/web3Provider';
import { getContract } from '../utils/getContract';
import PatientRegistration from '../build/contracts/PatientRegistration.json';

const MyComponent = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Get Web3 instance and account
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);

        // Get contract instance
        const contractInstance = getContract(PatientRegistration, web3, networkId);
        setContract(contractInstance);

        setError(null);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      (newAccount) => {
        setAccount(newAccount);
        init(); // Reinitialize on account change
      },
      () => {
        window.location.reload(); // Reload on chain change
      }
    );

    return cleanup;
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!contract) return <div>Contract not available</div>;

  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

### 2. Read Operation (View Function)

```javascript
const fetchPatientDetails = async (hhNumber) => {
  try {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    // Call view function (no gas cost)
    const result = await contract.methods
      .getPatientDetails(hhNumber)
      .call();

    // Result is an array: [walletAddress, name, dateOfBirth, ...]
    return {
      walletAddress: result[0],
      name: result[1],
      dateOfBirth: result[2],
      // ... other fields
    };
  } catch (error) {
    console.error('Error fetching patient details:', error);
    throw error;
  }
};
```

### 3. Write Operation (Transaction)

```javascript
const grantPermission = async (patientHH, doctorHH, patientName) => {
  try {
    if (!contract || !account) {
      throw new Error('Contract or account not available');
    }

    // Estimate gas first
    const gasEstimate = await contract.methods
      .grantPermission(patientHH, doctorHH, patientName)
      .estimateGas({ from: account });

    // Send transaction
    const tx = await contract.methods
      .grantPermission(patientHH, doctorHH, patientName)
      .send({
        from: account,
        gas: gasEstimate + 50000, // Add buffer
      });

    console.log('Transaction hash:', tx.transactionHash);
    
    // Wait for confirmation
    const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
    console.log('Transaction confirmed:', receipt);

    return tx;
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    throw error;
  }
};
```

### 4. Event Listening Pattern

```javascript
const listenToEvents = () => {
  if (!contract) return;

  // Listen for PatientRegistered events
  contract.events.PatientRegistered({
    fromBlock: 'latest'
  })
    .on('data', (event) => {
      console.log('New patient registered:', {
        hhNumber: event.returnValues.hhNumber,
        name: event.returnValues.name,
        walletAddress: event.returnValues.walletAddress
      });
    })
    .on('error', (error) => {
      console.error('Event error:', error);
    });
};
```

---

## 📦 IPFS Upload Implementation

### 1. Pinata Upload Function

```javascript
import { uploadFileToPinata } from '../utils/pinataClient';

const uploadMedicalRecord = async (file) => {
  try {
    // Validate file
    if (!file || !file.name) {
      throw new Error('Invalid file');
    }

    // Check file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Upload to Pinata
    console.log('Uploading file to IPFS...');
    const ipfsHash = await uploadFileToPinata(file);
    
    console.log('File uploaded. IPFS Hash:', ipfsHash);
    return ipfsHash;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
};
```

### 2. Complete Upload Flow with Blockchain

```javascript
const uploadRecordToBlockchain = async (file) => {
  try {
    // Step 1: Upload to IPFS
    setStatus('Uploading file to IPFS...');
    const ipfsHash = await uploadFileToPinata(file);
    
    // Step 2: Store hash on blockchain
    setStatus('Recording hash on blockchain...');
    const tx = await contract.methods
      .uploadRecord(ipfsHash)
      .send({
        from: account,
        gas: 300000
      });

    // Step 3: Wait for confirmation
    setStatus('Waiting for confirmation...');
    const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
    
    if (receipt.status) {
      setStatus('Upload successful!');
      return { ipfsHash, txHash: tx.transactionHash };
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

### 3. Retrieve File from IPFS

```javascript
const getIPFSGatewayURL = (ipfsHash) => {
  // Pinata Gateway
  return `https://coffee-worthy-cobra-770.mypinata.cloud/ipfs/${ipfsHash}`;
  
  // Alternative: Public IPFS Gateway
  // return `https://ipfs.io/ipfs/${ipfsHash}`;
};

// Usage in component
const viewRecord = (ipfsHash) => {
  const url = getIPFSGatewayURL(ipfsHash);
  window.open(url, '_blank');
};
```

---

## ⚠️ Error Handling Patterns

### 1. Comprehensive Error Handler

```javascript
const handleBlockchainError = (error) => {
  // User rejected transaction
  if (error.code === 4001) {
    return {
      type: 'user_rejected',
      message: 'Transaction rejected by user',
      userFriendly: 'You cancelled the transaction. Please try again if you want to proceed.'
    };
  }

  // Network error
  if (error.message?.includes('network') || error.message?.includes('Network')) {
    return {
      type: 'network_error',
      message: 'Network connection error',
      userFriendly: 'Unable to connect to blockchain. Please check your network connection and MetaMask.'
    };
  }

  // Contract not deployed
  if (error.message?.includes('not deployed')) {
    return {
      type: 'contract_not_deployed',
      message: 'Contract not deployed',
      userFriendly: 'Smart contract not found. Please ensure contracts are deployed.'
    };
  }

  // Revert with reason
  if (error.message?.includes('revert')) {
    const reason = extractRevertReason(error);
    return {
      type: 'contract_revert',
      message: reason || 'Transaction reverted',
      userFriendly: reason || 'Transaction failed. Please check the requirements and try again.'
    };
  }

  // Gas estimation failed
  if (error.message?.includes('gas')) {
    return {
      type: 'gas_error',
      message: 'Gas estimation failed',
      userFriendly: 'Unable to estimate gas. Please check your account balance and try again.'
    };
  }

  // Generic error
  return {
    type: 'unknown_error',
    message: error.message || 'Unknown error',
    userFriendly: 'An unexpected error occurred. Please try again.'
  };
};

// Helper to extract revert reason
const extractRevertReason = (error) => {
  const message = error.message || '';
  
  // Try to extract reason from error message
  const revertMatch = message.match(/revert\s+(.+)/i);
  if (revertMatch) {
    return revertMatch[1];
  }
  
  // Try to extract from data field
  if (error.data) {
    try {
      const decoded = web3.eth.abi.decodeParameter('string', error.data);
      return decoded;
    } catch (e) {
      // Not a string parameter
    }
  }
  
  return null;
};
```

### 2. Error Handling in Components

```javascript
const MyComponent = () => {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Perform action
      await someBlockchainOperation();

    } catch (err) {
      const errorInfo = handleBlockchainError(err);
      setError(errorInfo);
      
      // Log for debugging
      console.error('Operation failed:', {
        type: errorInfo.type,
        message: errorInfo.message,
        originalError: err
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {error && (
        <div className={`error-message error-${error.type}`}>
          {error.userFriendly}
        </div>
      )}
      <button onClick={handleAction} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Submit'}
      </button>
    </div>
  );
};
```

---

## 🔧 Common Code Snippets

### 1. Custom Hook for Contract

```javascript
// usePatientContract.js
import { useState, useEffect } from 'react';
import { getWeb3AndAccount } from '../utils/web3Provider';
import { getContract } from '../utils/getContract';
import PatientRegistration from '../build/contracts/PatientRegistration.json';

export const usePatientContract = () => {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { web3, account: currentAccount, networkId } = await getWeb3AndAccount();
        setAccount(currentAccount);
        
        const contractInstance = getContract(PatientRegistration, web3, networkId);
        setContract(contractInstance);
        
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return { contract, account, loading, error };
};

// Usage in component
const MyComponent = () => {
  const { contract, account, loading, error } = usePatientContract();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Use contract...
};
```

### 2. Transaction Status Component

```javascript
const TransactionStatus = ({ txHash, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'confirmed': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return 'Transaction pending...';
      case 'confirmed': return 'Transaction confirmed!';
      case 'failed': return 'Transaction failed';
      default: return 'Unknown status';
    }
  };

  return (
    <div className={`transaction-status status-${status}`}>
      <p>{getStatusText()}</p>
      {txHash && (
        <a 
          href={`https://etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Etherscan: {txHash.substring(0, 10)}...
        </a>
      )}
    </div>
  );
};
```

### 3. Permission Check Utility

```javascript
const checkPermission = async (patientHH, doctorHH, patientContract) => {
  try {
    const hasPermission = await patientContract.methods
      .isPermissionGranted(patientHH, doctorHH)
      .call();
    
    return hasPermission;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};
```

### 4. Batch Operations

```javascript
const grantMultiplePermissions = async (patientHH, doctorHHs, patientName) => {
  const results = [];
  
  for (const doctorHH of doctorHHs) {
    try {
      const tx = await contract.methods
        .grantPermission(patientHH, doctorHH, patientName)
        .send({ from: account, gas: 300000 });
      
      results.push({ doctorHH, success: true, txHash: tx.transactionHash });
    } catch (error) {
      results.push({ doctorHH, success: false, error: error.message });
    }
  }
  
  return results;
};
```

### 5. Form Validation

```javascript
const validatePatientForm = (formData) => {
  const errors = {};

  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (!formData.hhNumber || formData.hhNumber.trim().length === 0) {
    errors.hhNumber = 'HH Number is required';
  }

  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Valid email is required';
  }

  if (!formData.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
    errors.walletAddress = 'Valid Ethereum address is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## 🎯 Best Practices Demonstrated

1. **Always check contract/account availability** before operations
2. **Handle all error cases** with user-friendly messages
3. **Estimate gas** before sending transactions
4. **Use events** for off-chain indexing and notifications
5. **Validate inputs** on both frontend and smart contract
6. **Provide loading states** for async operations
7. **Clean up listeners** in useEffect cleanup
8. **Use view functions** for read operations (no gas cost)

---

These code examples demonstrate the patterns and best practices used throughout the EHR system. Use them as reference when explaining implementation details during interviews or when extending the system.

