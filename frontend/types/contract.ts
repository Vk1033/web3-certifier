import { ethers } from 'ethers';

// Contract ABI types
export interface CertificateRegistryABI {
  approveOrganization: (organization: string) => Promise<ethers.ContractTransaction>;
  revokeOrganization: (organization: string) => Promise<ethers.ContractTransaction>;
  issueCertificate: (recipient: string, name: string, course: string) => Promise<ethers.ContractTransaction>;
  getCertificate: (certificateId: string | number) => Promise<CertificateData>;
  getRecipientCertificates: (recipient: string) => Promise<bigint[]>;
  getOrganizationCertificates: (organization: string) => Promise<bigint[]>;
  verifyCertificate: (certificateId: string | number) => Promise<VerificationResult>;
  isOrganizationApproved: (organization: string) => Promise<boolean>;
  getCurrentCertificateId: () => Promise<bigint>;
  getTotalCertificates: () => Promise<bigint>;
  getCertificatesBatch: (certificateIds: (string | number)[]) => Promise<CertificateData[]>;
  owner: () => Promise<string>;
  approvedOrganizations: (address: string) => Promise<boolean>;
}

// Certificate data structure
export interface CertificateData {
  organization: string;
  recipient: string;
  name: string;
  course: string;
  issuedAt: bigint;
  certificateId: bigint;
  exists: boolean;
}

// Verification result structure
export interface VerificationResult {
  valid: boolean;
  organization: string;
  recipient: string;
  name: string;
  course: string;
  id: string;
}

// Frontend certificate display structure
export interface DisplayCertificate {
  id: string;
  organization: string;
  recipient: string;
  name: string;
  course: string;
  issuedAt: string;
}

// Contract configuration
export interface ContractConfig {
  address: string;
  abi: any;
  chainId: number;
  networkName: string;
  rpcUrl: string;
}

// Web3 state interface
export interface Web3State {
  account: string;
  contract: ethers.Contract | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isOwner: boolean;
  isOrganization: boolean;
  loading: boolean;
  error: string;
  success: string;
}

// Form state interfaces
export interface FormState {
  orgAddress: string;
  recipientAddress: string;
  recipientName: string;
  courseName: string;
  searchId: string;
  searchAddress: string;
}

// Stats interface
export interface Stats {
  total: number;
  organizations: number;
} 