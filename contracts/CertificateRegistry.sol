// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CertificateRegistry
 * @dev Smart contract for issuing and verifying certificates on blockchain
 * Organizations can issue certificates to recipients after being approved by super admin
 */
contract CertificateRegistry is Ownable, ReentrancyGuard {
    
    // Certificate structure
    struct Certificate {
        address organization;
        address recipient;
        string name;
        string course;
        uint256 issuedAt;
        uint256 certificateId;
        bool exists;
    }
    
    // State variables
    mapping(uint256 => Certificate) public certificates;
    mapping(address => bool) public approvedOrganizations;
    mapping(address => uint256[]) public recipientCertificates;
    mapping(address => uint256[]) public organizationCertificates;
    
    uint256 private _certificateCounter;
    
    // Events
    event OrganizationApproved(address indexed organization, address indexed approver);
    event OrganizationRevoked(address indexed organization, address indexed revoker);
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed organization,
        address indexed recipient,
        string name,
        string course,
        uint256 issuedAt
    );
    
    // Modifiers
    modifier onlyApprovedOrganization() {
        require(approvedOrganizations[msg.sender], "Only approved organizations can issue certificates");
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    modifier certificateExists(uint256 _certificateId) {
        require(certificates[_certificateId].exists, "Certificate does not exist");
        _;
    }
    
    constructor() Ownable(msg.sender) {
       _certificateCounter = 1;
   }
    
    // Organization Management Functions (Only Super Admin)
    
    /**
     * @dev Approve an organization to issue certificates
     * @param _organization Address of the organization to approve
     */
    function approveOrganization(address _organization) 
        external 
        onlyOwner 
        validAddress(_organization) 
    {
        require(!approvedOrganizations[_organization], "Organization already approved");
        require(_organization != owner(), "Owner cannot be an organization");
        
        approvedOrganizations[_organization] = true;
        emit OrganizationApproved(_organization, msg.sender);
    }
    
    /**
     * @dev Revoke an organization's approval
     * @param _organization Address of the organization to revoke
     */
    function revokeOrganization(address _organization) 
        external 
        onlyOwner 
        validAddress(_organization) 
    {
        require(approvedOrganizations[_organization], "Organization not approved");
        
        approvedOrganizations[_organization] = false;
        emit OrganizationRevoked(_organization, msg.sender);
    }
    
    // Certificate Issuance Functions (Only Approved Organizations)
    
    /**
     * @dev Issue a certificate to a recipient
     * @param _recipient Address of the certificate recipient
     * @param _name Name of the recipient
     * @param _course Course or reason for the certificate
     */
    function issueCertificate(
        address _recipient,
        string memory _name,
        string memory _course
    ) 
        external 
        onlyApprovedOrganization 
        validAddress(_recipient) 
        nonReentrant
        returns (uint256)
    {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_course).length > 0, "Course cannot be empty");
        require(_recipient != msg.sender, "Cannot issue certificate to self");
        
        uint256 certificateId = _certificateCounter;
        uint256 issuedAt = block.timestamp;
        
        certificates[certificateId] = Certificate({
            organization: msg.sender,
            recipient: _recipient,
            name: _name,
            course: _course,
            issuedAt: issuedAt,
            certificateId: certificateId,
            exists: true
        });
        
        // Update mappings for easy lookup
        recipientCertificates[_recipient].push(certificateId);
        organizationCertificates[msg.sender].push(certificateId);
        
        _certificateCounter++;
        
        emit CertificateIssued(certificateId, msg.sender, _recipient, _name, _course, issuedAt);
        
        return certificateId;
    }
    
    // Public Verification Functions
    
    /**
     * @dev Get certificate details by ID
     * @param _certificateId ID of the certificate
     */
    function getCertificate(uint256 _certificateId) 
        external 
        view 
        certificateExists(_certificateId)
        returns (
            address organization,
            address recipient,
            string memory name,
            string memory course,
            uint256 issuedAt,
            uint256 certificateId
        )
    {
        Certificate memory cert = certificates[_certificateId];
        return (
            cert.organization,
            cert.recipient,
            cert.name,
            cert.course,
            cert.issuedAt,
            cert.certificateId
        );
    }
    
    /**
     * @dev Get all certificates for a recipient
     * @param _recipient Address of the recipient
     */
    function getRecipientCertificates(address _recipient) 
        external 
        view 
        validAddress(_recipient)
        returns (uint256[] memory)
    {
        uint256[] storage certIds = recipientCertificates[_recipient];
        uint256 length = certIds.length;
        
        if (length == 0) {
            return new uint256[](0);
        }
        
        uint256[] memory result = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = certIds[i];
        }
        return result;
    }
    
    /**
     * @dev Get all certificates issued by an organization
     * @param _organization Address of the organization
     */
    function getOrganizationCertificates(address _organization) 
        external 
        view 
        validAddress(_organization)
        returns (uint256[] memory)
    {
        uint256[] storage certIds = organizationCertificates[_organization];
        uint256 length = certIds.length;
        
        if (length == 0) {
            return new uint256[](0);
        }
        
        uint256[] memory result = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = certIds[i];
        }
        return result;
    }
    
    /**
     * @dev Verify if a certificate exists and is valid
     * @param _certificateId ID of the certificate to verify
     */
    function verifyCertificate(uint256 _certificateId) 
        external 
        view 
        returns (bool valid, address organization, address recipient, string memory name, string memory course)
    {
        if (!certificates[_certificateId].exists) {
            return (false, address(0), address(0), "", "");
        }
        
        Certificate memory cert = certificates[_certificateId];
        return (
            true,
            cert.organization,
            cert.recipient,
            cert.name,
            cert.course
        );
    }
    
    /**
     * @dev Check if an organization is approved
     * @param _organization Address to check
     */
    function isOrganizationApproved(address _organization) 
        external 
        view 
        returns (bool)
    {
        return approvedOrganizations[_organization];
    }
    
    /**
     * @dev Get the current certificate counter (next certificate ID)
     */
    function getCurrentCertificateId() external view returns (uint256) {
        return _certificateCounter;
    }
    
    /**
     * @dev Get total number of certificates issued
     */
    function getTotalCertificates() external view returns (uint256) {
        return _certificateCounter - 1;
    }
    
    /**
     * @dev Batch get multiple certificates
     * @param _certificateIds Array of certificate IDs to retrieve
     */
    function getCertificatesBatch(uint256[] memory _certificateIds) 
        external 
        view 
        returns (Certificate[] memory)
    {
        Certificate[] memory certs = new Certificate[](_certificateIds.length);
        
        for (uint256 i = 0; i < _certificateIds.length; i++) {
            if (certificates[_certificateIds[i]].exists) {
                certs[i] = certificates[_certificateIds[i]];
            }
        }
        
        return certs;
    }
}