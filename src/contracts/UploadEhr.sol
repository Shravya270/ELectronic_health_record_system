// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UploadEhr {
    struct PatientRecord {
        string timeStamp;
        string medicalRecordHash;
    }

    // Mapping from patient address to their records
    mapping(address => PatientRecord[]) private records;
    
    // Mapping from patient address to doctor address to permission
    mapping(address => mapping(address => bool)) public patientToDoctorPermission;

    // Upload a record (patient only)
    function uploadRecord(string memory ipfsHash) public {
        string memory timestamp = _getCurrentTimestamp();
        PatientRecord memory newRecord = PatientRecord(
            timestamp,
            ipfsHash
        );
        records[msg.sender].push(newRecord);
    }

    // Legacy function for backward compatibility
    function addRecord(string memory _timeStamp, string memory _medicalRecordHash) public {
        PatientRecord memory newRecord = PatientRecord(
            _timeStamp,
            _medicalRecordHash
        );
        records[msg.sender].push(newRecord);
    }

    // Get patient's own records
    function getMyRecords() public view returns (PatientRecord[] memory) {
        return records[msg.sender];
    }

    // Legacy function for backward compatibility
    function getRecords() public view returns (PatientRecord[] memory) {
        return records[msg.sender];
    }

    // Grant access to a doctor
    function grantAccessToDoctor(address doctor) public {
        patientToDoctorPermission[msg.sender][doctor] = true;
    }

    // Revoke access from a doctor
    function revokeAccessFromDoctor(address doctor) public {
        patientToDoctorPermission[msg.sender][doctor] = false;
    }

    // Doctor can get patient records if permission is granted
    function getPatientRecords(address patient) public view returns (PatientRecord[] memory) {
        require(
            patientToDoctorPermission[patient][msg.sender],
            "Access denied: Permission not granted by patient."
        );
        return records[patient];
    }

    // Helper function to get current timestamp
    function _getCurrentTimestamp() private view returns (string memory) {
        // Solidity doesn't have native timestamp to string conversion
        // We'll use block.timestamp and convert it
        uint256 timestamp = block.timestamp;
        return _uintToString(timestamp);
    }

    // Helper function to convert uint to string
    function _uintToString(uint256 v) private pure returns (string memory) {
        if (v == 0) {
            return "0";
        }
        uint256 j = v;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (v != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(v - v / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            v /= 10;
        }
        return string(bstr);
    }
}

