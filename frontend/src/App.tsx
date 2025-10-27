import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID, NETWORK_NAME } from './contract-config';

interface Web3State {
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

interface DisplayCertificate {
  id: string;
  organization: string;
  recipient: string;
  name: string;
  course: string;
  issuedAt: string;
}

interface VerificationResult {
  valid: boolean;
  id: string;
  organization: string;
  recipient: string;
  name: string;
  course: string;
}

const App: React.FC = () => {
  // State variables
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isOrganization, setIsOrganization] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form states
  const [orgAddress, setOrgAddress] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');
  const [searchAddress, setSearchAddress] = useState<string>('');

  // Certificate data
  const [certificates, setCertificates] = useState<DisplayCertificate[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [stats, setStats] = useState<{ total: number; organizations: number }>({ total: 0, organizations: 0 });

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>('verify');

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    if (contract && account) {
      checkUserRole();
      loadStats();
    }
  }, [contract, account]);

  const initializeWeb3 = async (): Promise<void> => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          
          setProvider(provider);
          setSigner(signer);
          setContract(contract);
          setAccount(accounts[0]);
          
          // Check if we're on the correct network
          const network = await provider.getNetwork();
          if (network.chainId !== BigInt(CHAIN_ID)) {
            setError(`Please switch to ${NETWORK_NAME} (Chain ID: ${CHAIN_ID})`);
          }
        }
      } catch (error) {
        setError('Failed to connect to MetaMask: ' + (error as Error).message);
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask to use this dApp.');
    }
  };

  const connectWallet = async (): Promise<void> => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        await initializeWeb3();
      } catch (error) {
        setError('Failed to connect wallet: ' + (error as Error).message);
      }
    }
  };

  const checkUserRole = async (): Promise<void> => {
    if (!contract) return;
    
    try {
      const owner = await contract.owner();
      setIsOwner(account.toLowerCase() === owner.toLowerCase());
      
      const orgApproved = await contract.approvedOrganizations(account);
      setIsOrganization(orgApproved);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadStats = async (): Promise<void> => {
    if (!contract) return;
    
    try {
      const totalCerts = await contract.getTotalCertificates();
      setStats(prev => ({ ...prev, total: Number(totalCerts) }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const showError = (message: string): void => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string): void => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const approveOrganization = async (): Promise<void> => {
    if (!orgAddress || !contract || !signer) {
      showError('Please enter an organization address');
      return;
    }

    setLoading(true);
    try {
      console.log('Approving organization:', orgAddress);
      console.log('Contract address:', contract.address);
      console.log('Signer address:', await signer.getAddress());
      
      const tx = await contract.approveOrganization(orgAddress);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      showSuccess(`Organization ${orgAddress} approved successfully!`);
      setOrgAddress('');
    } catch (error) {
      console.error('Error approving organization:', error);
      showError('Failed to approve organization: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-2M7 12h8m-8 4h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Web3 Certificate Registry</h1>
          <p className="text-gray-600 mb-6">Connect your wallet to issue and verify blockchain certificates</p>
          <button
            onClick={connectWallet}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎓 Web3 Certificate Registry</h1>
              <p className="text-sm text-gray-600">Blockchain-based certificate verification</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Connected Account</p>
                <p className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{formatAddress(account)}</p>
              </div>
              <div className="flex space-x-2">
                {isOwner && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Super Admin
                  </span>
                )}
                {isOrganization && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Approved Org
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-600">Total Certificates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{isOwner ? '1' : '0'}</div>
              <div className="text-gray-600">Super Admin</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{isOrganization ? '✓' : '✗'}</div>
              <div className="text-gray-600">Organization Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel Tab */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-6">
            {isOwner && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Panel</h2>
                  <p className="text-gray-600 mb-6">Approve organizations to issue certificates.</p>
                  
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      placeholder="Organization Address (0x...)"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={approveOrganization}
                      disabled={loading || !orgAddress.trim() || !orgAddress.startsWith('0x') || orgAddress.length !== 42}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Approving...' : 'Approve Organization'}
                    </button>
                    {loading && (
                      <button
                        onClick={() => setLoading(false)}
                        className="bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {orgAddress && (!orgAddress.startsWith('0x') || orgAddress.length !== 42) && (
                    <p className="text-red-600 text-sm mt-2">Please enter a valid Ethereum address (0x followed by 40 characters)</p>
                  )}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Debug Info:</strong> Connected as: {formatAddress(account)} | 
                      Owner: {isOwner ? 'Yes' : 'No'} | 
                      Loading: {loading ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>🔗 Web3 Certificate Registry - Powered by Blockchain Technology</p>
            <p className="text-sm mt-2">Contract Address: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{CONTRACT_ADDRESS}</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App; 