// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UploadEhr {
    struct PatientRecord {
        string timeStamp;
        string medicalRecordHash;
    }

    struct DiagnosticReport {
        uint256 timestamp;
        string testType;
        string diagnosticCenter;
        string medicalReportHash; // IPFS CID
        string description;
        bool isApproved;
        address diagnosticAddress;
        address doctorAddress; // Doctor who requested the test
    }

    struct TestRequest {
        uint256 requestId;
        address patient;
        address doctor;
        address diagnostic;
        string testType;
        string description;
        string status; // "REQUESTED", "IN_PROGRESS", "COMPLETED", "APPROVED"
        uint256 timestamp;
        bool exists;
    }

    // Mapping from patient address to their records
    mapping(address => PatientRecord[]) private records;
    
    // Mapping from patient address to doctor address to permission
    mapping(address => mapping(address => bool)) public patientToDoctorPermission;

    // Mapping from patient address to diagnostic reports
    mapping(address => DiagnosticReport[]) public diagnosticReports;

    // Mapping from diagnostic center address to patient address to permission
    mapping(address => mapping(address => bool)) public diagnosticToPatientPermission;

    // Test requests mapping
    mapping(uint256 => TestRequest) public testRequests;
    mapping(address => uint256[]) public diagnosticRequests; // diagnostic address => request IDs
    mapping(address => uint256[]) public doctorTestRequests; // doctor address => request IDs
    mapping(address => uint256[]) public patientTestRequests; // patient address => request IDs

    uint256 private requestCounter = 0;

    // Events
    event TestRequested(uint256 indexed requestId, address indexed patient, address indexed doctor, string testType);
    event TestAssigned(uint256 indexed requestId, address indexed diagnostic);
    event TestStatusUpdated(uint256 indexed requestId, string status);
    event DiagnosticReportUploaded(address indexed patient, uint256 indexed reportIndex, string testType, string ipfsHash);
    event DiagnosticReportApproved(address indexed patient, uint256 indexed reportIndex);

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

    // ==================== DIAGNOSTIC MODULE FUNCTIONS ====================

    /**
     * @notice Doctor requests a test for a patient
     * @param patient Address of the patient
     * @param testType Type of test (e.g., "Blood", "MRI", "CT", "X-Ray", "Urine")
     * @param description Description of the test request
     * @return requestId The ID of the created test request
     */
    function requestTest(
        address patient,
        string calldata testType,
        string calldata description
    ) external returns (uint256) {
        require(patient != address(0), "Invalid patient address");
        require(bytes(testType).length > 0, "Test type cannot be empty");
        
        // Note: In production, add check to verify msg.sender is a registered doctor
        // For now, we'll allow any address to request (can be restricted later)

        requestCounter++;
        uint256 requestId = requestCounter;

        TestRequest memory newRequest = TestRequest({
            requestId: requestId,
            patient: patient,
            doctor: msg.sender,
            diagnostic: address(0), // Not assigned yet
            testType: testType,
            description: description,
            status: "REQUESTED",
            timestamp: block.timestamp,
            exists: true
        });

        testRequests[requestId] = newRequest;
        doctorTestRequests[msg.sender].push(requestId);
        patientTestRequests[patient].push(requestId);

        emit TestRequested(requestId, patient, msg.sender, testType);
        return requestId;
    }

    /**
     * @notice Diagnostic center assigns a test request to themselves
     * @param requestId ID of the test request
     */
    function assignTest(uint256 requestId) external {
        require(testRequests[requestId].exists, "Test request does not exist");
        require(
            keccak256(abi.encodePacked(testRequests[requestId].status)) == keccak256(abi.encodePacked("REQUESTED")),
            "Test request is not in REQUESTED status"
        );

        testRequests[requestId].diagnostic = msg.sender;
        testRequests[requestId].status = "IN_PROGRESS";
        
        diagnosticRequests[msg.sender].push(requestId);

        emit TestAssigned(requestId, msg.sender);
        emit TestStatusUpdated(requestId, "IN_PROGRESS");
    }

    /**
     * @notice Diagnostic center uploads a diagnostic report
     * @param patient Address of the patient
     * @param testType Type of test performed
     * @param ipfsHash IPFS CID of the uploaded report file
     * @param diagnosticCenter Name of the diagnostic center
     * @param description Description of the report
     * @return reportIndex Index of the uploaded report
     */
    function uploadDiagnosticReport(
        address patient,
        string calldata testType,
        string calldata ipfsHash,
        string calldata diagnosticCenter,
        string calldata description
    ) external returns (uint256) {
        require(patient != address(0), "Invalid patient address");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(testType).length > 0, "Test type cannot be empty");
        require(bytes(diagnosticCenter).length > 0, "Diagnostic center name cannot be empty");

        // Note: In production, add check to verify msg.sender is a registered diagnostic center
        // For now, we'll allow any address to upload (can be restricted later)

        DiagnosticReport memory newReport = DiagnosticReport({
            timestamp: block.timestamp,
            testType: testType,
            diagnosticCenter: diagnosticCenter,
            medicalReportHash: ipfsHash,
            description: description,
            isApproved: false,
            diagnosticAddress: msg.sender,
            doctorAddress: address(0) // Will be set if linked to a request
        });

        diagnosticReports[patient].push(newReport);
        uint256 reportIndex = diagnosticReports[patient].length - 1;

        emit DiagnosticReportUploaded(patient, reportIndex, testType, ipfsHash);
        return reportIndex;
    }

    /**
     * @notice Link a diagnostic report to a test request and mark as completed
     * @param requestId ID of the test request
     * @param reportIndex Index of the diagnostic report
     */
    function linkReportToRequest(uint256 requestId, uint256 reportIndex) external {
        require(testRequests[requestId].exists, "Test request does not exist");
        require(
            testRequests[requestId].diagnostic == msg.sender,
            "Only assigned diagnostic can link report"
        );

        address patient = testRequests[requestId].patient;
        require(
            reportIndex < diagnosticReports[patient].length,
            "Invalid report index"
        );
        require(
            diagnosticReports[patient][reportIndex].diagnosticAddress == msg.sender,
            "Report does not belong to this diagnostic"
        );

        diagnosticReports[patient][reportIndex].doctorAddress = testRequests[requestId].doctor;
        testRequests[requestId].status = "COMPLETED";
        
        emit TestStatusUpdated(requestId, "COMPLETED");
    }

    /**
     * @notice Diagnostic center approves a diagnostic report
     * @param patient Address of the patient
     * @param reportIndex Index of the report to approve
     */
    function approveDiagnosticReport(address patient, uint256 reportIndex) external {
        require(
            reportIndex < diagnosticReports[patient].length,
            "Invalid report index"
        );
        require(
            diagnosticReports[patient][reportIndex].diagnosticAddress == msg.sender,
            "Only the diagnostic center that created the report can approve it"
        );
        require(
            !diagnosticReports[patient][reportIndex].isApproved,
            "Report is already approved"
        );

        diagnosticReports[patient][reportIndex].isApproved = true;
        
        emit DiagnosticReportApproved(patient, reportIndex);
    }

    /**
     * @notice Get all diagnostic reports for a patient
     * @param patient Address of the patient
     * @return reports Array of DiagnosticReport structs
     */
    function getDiagnosticReports(address patient) public view returns (DiagnosticReport[] memory) {
        return diagnosticReports[patient];
    }

    /**
     * @notice Get diagnostic reports for a patient (for doctors with permission)
     * @param patient Address of the patient
     * @return reports Array of DiagnosticReport structs
     */
    function getDiagnosticReportsForDoctor(address patient) public view returns (DiagnosticReport[] memory) {
        require(
            patientToDoctorPermission[patient][msg.sender],
            "Access denied: Permission not granted by patient."
        );
        return diagnosticReports[patient];
    }

    /**
     * @notice Get test requests for a diagnostic center
     * @param diagnostic Address of the diagnostic center
     * @return requestIds Array of request IDs
     */
    function getDiagnosticRequests(address diagnostic) public view returns (uint256[] memory) {
        return diagnosticRequests[diagnostic];
    }

    /**
     * @notice Get test requests for a doctor
     * @param doctor Address of the doctor
     * @return requestIds Array of request IDs
     */
    function getDoctorTestRequests(address doctor) public view returns (uint256[] memory) {
        return doctorTestRequests[doctor];
    }

    /**
     * @notice Get test requests for a patient
     * @param patient Address of the patient
     * @return requestIds Array of request IDs
     */
    function getPatientTestRequests(address patient) public view returns (uint256[] memory) {
        return patientTestRequests[patient];
    }

    /**
     * @notice Get details of a test request
     * @param requestId ID of the test request
     * @return Test request details
     */
    function getTestRequest(uint256 requestId) public view returns (TestRequest memory) {
        require(testRequests[requestId].exists, "Test request does not exist");
        return testRequests[requestId];
    }

    /**
     * @notice Update test request status (for internal use)
     * @param requestId ID of the test request
     * @param newStatus New status
     */
    function updateTestStatus(uint256 requestId, string calldata newStatus) external {
        require(testRequests[requestId].exists, "Test request does not exist");
        require(
            testRequests[requestId].diagnostic == msg.sender,
            "Only assigned diagnostic can update status"
        );

        testRequests[requestId].status = newStatus;
        emit TestStatusUpdated(requestId, newStatus);
    }

    /**
     * @notice Get all pending requests (not assigned to any diagnostic)
     * @return requestIds Array of request IDs that are REQUESTED status
     */
    function getPendingRequests() public view returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](requestCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= requestCounter; i++) {
            if (
                testRequests[i].exists &&
                keccak256(abi.encodePacked(testRequests[i].status)) == keccak256(abi.encodePacked("REQUESTED")) &&
                testRequests[i].diagnostic == address(0)
            ) {
                pending[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }
}

