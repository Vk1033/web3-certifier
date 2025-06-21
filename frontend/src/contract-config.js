export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CHAIN_ID = 1337;
export const NETWORK_NAME = "Hardhat Local";
export const RPC_URL = "http://127.0.0.1:8545";

// Contract ABI is imported from the generated JSON file
import CertificateRegistryArtifact from './CertificateRegistry.json';
export const CONTRACT_ABI = CertificateRegistryArtifact.abi;