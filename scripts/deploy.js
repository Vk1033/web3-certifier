const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CertificateRegistry contract...");

  // Get the ContractFactory and Signers here
  const [deployer] = await ethers.getSigners();
  
  console.log("📝 Deploying contracts with the account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy();

  await certificateRegistry.deployed();

  console.log("✅ CertificateRegistry deployed to:", certificateRegistry.address);
  console.log("👤 Super Admin (Owner):", await certificateRegistry.owner());
  
  // Save deployment info
  const deploymentInfo = {
    contract: "CertificateRegistry",
    address: certificateRegistry.address,
    owner: await certificateRegistry.owner(),
    network: "localhost",
    deployedAt: new Date().toISOString()
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  return certificateRegistry;
}

main()
  .then((contract) => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });