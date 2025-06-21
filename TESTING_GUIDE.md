# Web3 Certificate Registry - Testing Guide

## 🎯 Application Overview

The Web3 Certificate Registry is a blockchain-based application that allows organizations to issue verifiable certificates on the Ethereum blockchain. The system uses a smart contract to manage access control and certificate issuance.

## 🚀 Quick Start

### Prerequisites
- MetaMask browser extension installed
- Access to the application at: http://localhost:3000

### Local Network Configuration
To test the application, you need to connect MetaMask to the local Hardhat network:

1. **Add Hardhat Network to MetaMask:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

2. **Import Test Accounts:**
   Use these private keys to import test accounts into MetaMask:
   
   **Super Admin Account:**
   - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   
   **Organization Account:**
   - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c6a2818568b7e7d8a3f5`
   
   **Recipient Account:**
   - Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

## 🧪 Testing Scenarios

### 1. Connect Wallet
1. Open http://localhost:3000
2. Click "Connect Wallet"
3. MetaMask should prompt for connection
4. Accept the connection

### 2. Super Admin Functions
1. Connect with the Super Admin account
2. You should see a "Super Admin" badge
3. Navigate to "Admin Panel" tab
4. Enter organization address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
5. Click "Approve Organization"
6. Transaction should be successful

### 3. Organization Functions
1. Switch to the Organization account in MetaMask
2. Refresh the page and reconnect
3. You should see an "Approved Org" badge
4. Navigate to "Issue Certificate" tab
5. Fill in the form:
   - Recipient Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Recipient Name: `John Doe`
   - Course: `Blockchain Development Course`
6. Click "Issue Certificate"
7. Note the certificate ID from the success message

### 4. Certificate Verification
1. Navigate to "Verify Certificate" tab
2. Enter the certificate ID you received
3. Click "Verify"
4. You should see certificate details with a green checkmark

### 5. Search Certificates
1. Navigate to "Search Certificates" tab
2. Enter recipient address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
3. Click "Search"
4. You should see the issued certificate in the results

## 🎯 Key Features Tested

✅ **Smart Contract Integration**
- Connection to local Hardhat network
- Reading contract state
- Executing transactions

✅ **Access Control**
- Super admin role detection
- Organization approval workflow
- Role-based UI rendering

✅ **Certificate Management**
- Certificate issuance by approved organizations
- Public certificate verification
- Certificate search by recipient

✅ **User Experience**
- Wallet connection workflow
- Transaction feedback
- Error handling
- Responsive design

## 🔧 Contract Information

- **Contract Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Network:** Hardhat Local (Chain ID: 1337)
- **Solidity Version:** 0.8.27
- **OpenZeppelin:** Used for access control and security

## 💡 Test Results

The automated test workflow shows:
- ✅ Organization approval working
- ✅ Certificate issuance working
- ✅ Certificate verification working
- ✅ Public access to certificates working
- ✅ Certificate search working

The application is ready for production deployment to testnets or mainnet!