// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Academic consortium prototype. Physical test truth and organizational identity
/// must be established outside this contract in a production deployment.
contract AutomotiveCompliance is AccessControl {
    bytes32 public constant SUPPLIER_ROLE = keccak256("SUPPLIER_ROLE");
    bytes32 public constant LAB_ROLE = keccak256("LAB_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    uint256 public constant MAX_TESTS_PER_BATCH = 100;

    enum Result { NONE, PASS, FAIL }
    enum Decision { NONE, APPROVED, REJECTED }
    enum Status { REGISTERED, TESTING_IN_PROGRESS, COMPLIANT_PENDING_APPROVAL, APPROVED, REJECTED, NON_COMPLIANT, REASSESSMENT_REQUIRED }

    struct ComponentBatch {
        bytes32 batchId;
        string batchCode;
        address supplier;
        string componentName;
        string componentType;
        uint256 quantity;
        uint64 manufacturingDate;
        string specificationsRef;
        uint64 registrationTimestamp;
        Decision decision;
        string decisionReason;
        uint64 decisionTimestamp;
        bool exists;
    }
    struct TestRecord {
        bytes32 testId;
        string testCode;
        bytes32 batchId;
        address testingLab;
        string testType;
        Result result;
        bytes32 reportHash; // SHA-256 digest represented as bytes32
        string documentRef; // backend-controlled reference; never a client filesystem path
        uint64 submittedAt;
        uint64 expiresAt; // 0 means no expiry
        bool revoked;
        string revocationReason;
        bool exists;
    }
    struct TestInput {
        bytes32 testId;
        string testCode;
        string testType;
        Result result;
        bytes32 reportHash;
        string documentRef;
        uint64 expiresAt;
    }

    mapping(bytes32 => ComponentBatch) private batches;
    mapping(bytes32 => TestRecord) private tests;
    mapping(bytes32 => bytes32[]) private batchTests;
    mapping(bytes32 => mapping(bytes32 => bool)) private hasTestType;
    mapping(bytes32 => string[]) private requiredTypes;
    mapping(bytes32 => bool) private requirementsConfigured;
    mapping(bytes32 => bool) private batchHadRevocation;

    event BatchRegistered(bytes32 indexed batchId, string batchCode, address indexed supplier, string componentType, uint256 quantity, uint256 timestamp);
    event TestSubmitted(bytes32 indexed batchId, bytes32 indexed testId, address indexed testingLab, string testType, uint8 result, bytes32 reportHash, uint256 timestamp);
    event TestRevoked(bytes32 indexed batchId, bytes32 indexed testId, address indexed actor, string reason, uint256 timestamp);
    event BatchApproved(bytes32 indexed batchId, address indexed manufacturer, string reason, uint256 timestamp);
    event BatchRejected(bytes32 indexed batchId, address indexed manufacturer, string reason, uint256 timestamp);
    event RequirementsConfigured(bytes32 indexed componentTypeHash, string componentType, uint256 count);

    error InvalidInput(); error BatchAlreadyExists(); error BatchNotFound(); error TestAlreadyExists(); error TestNotFound();
    error TooManyTests(); error DuplicateTestType(); error RequirementsNotConfigured(); error MissingRequiredTest(string testType);
    error RequiredTestFailed(string testType); error RequiredTestInvalid(string testType); error DecisionAlreadyFinal();

    constructor(address admin, address[] memory suppliers, address[] memory labs, address[] memory manufacturers, address[] memory auditors) {
        if (admin == address(0)) revert InvalidInput();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        for (uint256 i; i < suppliers.length; ++i) _grantRole(SUPPLIER_ROLE, suppliers[i]);
        for (uint256 i; i < labs.length; ++i) _grantRole(LAB_ROLE, labs[i]);
        for (uint256 i; i < manufacturers.length; ++i) _grantRole(MANUFACTURER_ROLE, manufacturers[i]);
        for (uint256 i; i < auditors.length; ++i) _grantRole(AUDITOR_ROLE, auditors[i]);
    }

    function configureRequiredTests(string calldata componentType, string[] calldata testTypes) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(componentType).length == 0 || testTypes.length == 0 || testTypes.length > 20) revert InvalidInput();
        bytes32 key = keccak256(bytes(componentType));
        delete requiredTypes[key];
        for (uint256 i; i < testTypes.length; ++i) {
            if (bytes(testTypes[i]).length == 0) revert InvalidInput();
            for (uint256 j; j < i; ++j) if (keccak256(bytes(testTypes[j])) == keccak256(bytes(testTypes[i]))) revert DuplicateTestType();
            requiredTypes[key].push(testTypes[i]);
        }
        requirementsConfigured[key] = true;
        emit RequirementsConfigured(key, componentType, testTypes.length);
    }

    function getRequiredTestTypes(string calldata componentType) external view returns (string[] memory) {
        return requiredTypes[keccak256(bytes(componentType))];
    }

    function registerBatch(bytes32 batchId, string calldata batchCode, string calldata componentName, string calldata componentType, uint256 quantity, uint64 manufacturingDate, string calldata specificationsRef) external onlyRole(SUPPLIER_ROLE) {
        if (batchId == bytes32(0) || batchId != keccak256(bytes(batchCode)) || bytes(batchCode).length < 3 || bytes(batchCode).length > 64 || bytes(componentName).length == 0 || bytes(componentType).length == 0 || quantity == 0 || bytes(componentName).length > 100 || bytes(componentType).length > 80 || bytes(specificationsRef).length > 500) revert InvalidInput();
        if (batches[batchId].exists) revert BatchAlreadyExists();
        batches[batchId] = ComponentBatch(batchId, batchCode, msg.sender, componentName, componentType, quantity, manufacturingDate, specificationsRef, uint64(block.timestamp), Decision.NONE, "", 0, true);
        emit BatchRegistered(batchId, batchCode, msg.sender, componentType, quantity, block.timestamp);
    }

    function submitTest(bytes32 batchId, TestInput calldata input) external onlyRole(LAB_ROLE) {
        ComponentBatch storage b = batches[batchId];
        if (!b.exists) revert BatchNotFound();
        if (input.testId == bytes32(0) || bytes(input.testCode).length < 3 || bytes(input.testCode).length > 64 || input.testId != keccak256(bytes(input.testCode)) || bytes(input.testType).length == 0 || input.result == Result.NONE || bytes(input.documentRef).length > 200) revert InvalidInput();
        if (tests[input.testId].exists) revert TestAlreadyExists();
        if (batchTests[batchId].length >= MAX_TESTS_PER_BATCH) revert TooManyTests();
        if (hasTestType[batchId][keccak256(bytes(input.testType))]) revert DuplicateTestType();
        tests[input.testId] = TestRecord(input.testId, input.testCode, batchId, msg.sender, input.testType, input.result, input.reportHash, input.documentRef, uint64(block.timestamp), input.expiresAt, false, "", true);
        batchTests[batchId].push(input.testId);
        hasTestType[batchId][keccak256(bytes(input.testType))] = true;
        emit TestSubmitted(batchId, input.testId, msg.sender, input.testType, uint8(input.result), input.reportHash, block.timestamp);
    }

    function revokeTest(bytes32 testId, string calldata reason) external onlyRole(LAB_ROLE) {
        TestRecord storage t = tests[testId];
        if (!t.exists) revert TestNotFound();
        if (t.testingLab != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert InvalidInput();
        if (t.revoked || bytes(reason).length == 0 || bytes(reason).length > 500) revert InvalidInput();
        t.revoked = true; t.revocationReason = reason; batchHadRevocation[t.batchId] = true;
        emit TestRevoked(t.batchId, testId, msg.sender, reason, block.timestamp);
    }

    function approveBatch(bytes32 batchId, string calldata reason) external onlyRole(MANUFACTURER_ROLE) {
        ComponentBatch storage b = batches[batchId]; if (!b.exists) revert BatchNotFound();
        if (b.decision != Decision.NONE) revert DecisionAlreadyFinal();
        _assertEligible(batchId, b.componentType);
        b.decision = Decision.APPROVED; b.decisionReason = reason; b.decisionTimestamp = uint64(block.timestamp);
        emit BatchApproved(batchId, msg.sender, reason, block.timestamp);
    }

    function rejectBatch(bytes32 batchId, string calldata reason) external onlyRole(MANUFACTURER_ROLE) {
        ComponentBatch storage b = batches[batchId]; if (!b.exists) revert BatchNotFound();
        if (b.decision != Decision.NONE) revert DecisionAlreadyFinal();
        if (bytes(reason).length == 0 || bytes(reason).length > 500) revert InvalidInput();
        b.decision = Decision.REJECTED; b.decisionReason = reason; b.decisionTimestamp = uint64(block.timestamp);
        emit BatchRejected(batchId, msg.sender, reason, block.timestamp);
    }

    function _assertEligible(bytes32 batchId, string memory componentType) internal view {
        bytes32 key = keccak256(bytes(componentType)); if (!requirementsConfigured[key]) revert RequirementsNotConfigured();
        string[] storage req = requiredTypes[key];
        for (uint256 i; i < req.length; ++i) {
            bytes32 wanted = keccak256(bytes(req[i])); bool found;
            bytes32[] storage ids = batchTests[batchId];
            for (uint256 j; j < ids.length; ++j) {
                TestRecord storage t = tests[ids[j]];
                if (keccak256(bytes(t.testType)) == wanted) {
                    found = true;
                    if (t.result != Result.PASS) revert RequiredTestFailed(req[i]);
                    if (t.revoked || (t.expiresAt != 0 && t.expiresAt < block.timestamp)) revert RequiredTestInvalid(req[i]);
                    break;
                }
            }
            if (!found) revert MissingRequiredTest(req[i]);
        }
    }

    function getBatch(bytes32 batchId) external view returns (ComponentBatch memory) { if (!batches[batchId].exists) revert BatchNotFound(); return batches[batchId]; }
    function getTest(bytes32 testId) external view returns (TestRecord memory) { if (!tests[testId].exists) revert TestNotFound(); return tests[testId]; }
    function getTestIdsForBatch(bytes32 batchId) external view returns (bytes32[] memory) { if (!batches[batchId].exists) revert BatchNotFound(); return batchTests[batchId]; }
    function getBatchStatus(bytes32 batchId) public view returns (Status) {
        ComponentBatch storage b = batches[batchId]; if (!b.exists) revert BatchNotFound();
        if (batchHadRevocation[batchId]) {
            bytes32[] storage ids = batchTests[batchId];
            for (uint256 i; i < ids.length; ++i) if (tests[ids[i]].revoked) {
                string[] storage req = requiredTypes[keccak256(bytes(b.componentType))];
                for (uint256 r; r < req.length; ++r) if (keccak256(bytes(req[r])) == keccak256(bytes(tests[ids[i]].testType))) return Status.REASSESSMENT_REQUIRED;
            }
        }
        string[] storage reqs = requiredTypes[keccak256(bytes(b.componentType))];
        if (!requirementsConfigured[keccak256(bytes(b.componentType))]) return batchTests[batchId].length == 0 ? Status.REGISTERED : Status.TESTING_IN_PROGRESS;
        bool allPassed = true;
        for (uint256 r; r < reqs.length; ++r) {
            bool found;
            bytes32[] storage ids2 = batchTests[batchId];
            for (uint256 j; j < ids2.length; ++j) {
                TestRecord storage t = tests[ids2[j]];
                if (keccak256(bytes(t.testType)) == keccak256(bytes(reqs[r]))) {
                    found = true;
                    if (t.result != Result.PASS || t.revoked || (t.expiresAt != 0 && t.expiresAt < block.timestamp)) allPassed = false;
                    break;
                }
            }
            if (!found) allPassed = false;
        }
        if (b.decision == Decision.APPROVED && allPassed) return Status.APPROVED;
        if (b.decision == Decision.REJECTED) return Status.REJECTED;
        if (b.decision == Decision.APPROVED && !allPassed) return Status.REASSESSMENT_REQUIRED;
        if (!allPassed) {
            for (uint256 i; i < batchTests[batchId].length; ++i) if (tests[batchTests[batchId][i]].result == Result.FAIL) return Status.NON_COMPLIANT;
            return batchTests[batchId].length == 0 ? Status.REGISTERED : Status.TESTING_IN_PROGRESS;
        }
        return Status.COMPLIANT_PENDING_APPROVAL;
    }
    }
