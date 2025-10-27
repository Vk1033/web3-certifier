import { ContractConfig } from '../types/contract';

// Contract ABI is imported from the generated JSON file
import CertificateRegistryArtifact from './CertificateRegistry.json';

// Contract configuration
export const CONTRACT_ADDRESS: string = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const RPC_URL: string = "http://127.0.0.1:8545";

// Contract ABI
export const CONTRACT_ABI = CertificateRegistryArtifact.abi;

// Network configuration
export const CHAIN_ID: number = 1337; // Hardhat local network
export const NETWORK_NAME: string = "Hardhat Local";

// Export contract config object
export const contractConfig: ContractConfig = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  chainId: CHAIN_ID,
  networkName: NETWORK_NAME,
  rpcUrl: RPC_URL
}; 