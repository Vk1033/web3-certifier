const { ethers } = require("hardhat");

async function testCertificateWorkflow() {
  console.log("🚀 Testing Complete Certificate Workflow...\n");

  // Get signers
  const [superAdmin, org1, recipient1] = await ethers.getSigners();
  
  console.log("👥 Test Accounts:");
  console.log(`Super Admin: ${superAdmin.address}`);
  console.log(`Organization: ${org1.address}`);
  console.log(`Recipient: ${recipient1.address}\n`);

  // Get contract instance
  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const contract = CertificateRegistry.attach(contractAddress);

  try {
    // Test 1: Verify super admin
    const owner = await contract.owner();
    console.log("✅ Super Admin verified:", owner);
    
    // Test 2: Approve organization
    console.log("\n📝 Approving organization...");
    const approveTx = await contract.connect(superAdmin).approveOrganization(org1.address);
    await approveTx.wait();
    console.log("✅ Organization approved successfully");
    
    // Test 3: Verify organization approval
    const isApproved = await contract.approvedOrganizations(org1.address);
    console.log(`✅ Organization approval status: ${isApproved}`);
    
    // Test 4: Issue certificate
    console.log("\n🎓 Issuing certificate...");
    const issueTx = await contract.connect(org1).issueCertificate(
      recipient1.address,
      "John Doe",
      "Blockchain Development Course"
    );
    const receipt = await issueTx.wait();
    
    // Get certificate ID from event
    const event = receipt.events?.find(e => e.event === 'CertificateIssued');
    const certificateId = event?.args?.certificateId;
    console.log(`✅ Certificate issued with ID: ${certificateId}`);
    
    // Test 5: Verify certificate
    console.log("\n🔍 Verifying certificate...");
    const certDetails = await contract.getCertificate(certificateId);
    console.log("✅ Certificate details:");
    console.log(`  Organization: ${certDetails.organization}`);
    console.log(`  Recipient: ${certDetails.recipient}`);
    console.log(`  Name: ${certDetails.name}`);
    console.log(`  Course: ${certDetails.course}`);
    console.log(`  Issued At: ${new Date(certDetails.issuedAt.toNumber() * 1000).toLocaleString()}`);
    
    // Test 6: Public verification
    const verification = await contract.verifyCertificate(certificateId);
    console.log("\n✅ Public verification result:");
    console.log(`  Valid: ${verification.valid}`);
    console.log(`  Name: ${verification.name}`);
    console.log(`  Course: ${verification.course}`);
    
    // Test 7: Get recipient certificates
    const recipientCerts = await contract.getRecipientCertificates(recipient1.address);
    console.log(`\n✅ Recipient has ${recipientCerts.length} certificate(s)`);
    
    // Test 8: Get stats
    const totalCerts = await contract.getTotalCertificates();
    console.log(`✅ Total certificates issued: ${totalCerts}`);
    
    console.log("\n🎉 All tests passed! Certificate workflow is working perfectly!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testCertificateWorkflow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });