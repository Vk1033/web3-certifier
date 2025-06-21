import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID, NETWORK_NAME } from './contract-config';

const App = () => {
  // State variables
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [orgAddress, setOrgAddress] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Certificate data
  const [certificates, setCertificates] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [stats, setStats] = useState({ total: 0, organizations: 0 });

  // Active tab state
  const [activeTab, setActiveTab] = useState('verify');

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    if (contract && account) {
      checkUserRole();
      loadStats();
    }
  }, [contract, account]);

  const initializeWeb3 = async () => {
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
        setError('Failed to connect to MetaMask: ' + error.message);
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask to use this dApp.');
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        await initializeWeb3();
      } catch (error) {
        setError('Failed to connect wallet: ' + error.message);
      }
    }
  };

  const checkUserRole = async () => {
    try {
      const owner = await contract.owner();
      setIsOwner(account.toLowerCase() === owner.toLowerCase());
      
      const orgApproved = await contract.approvedOrganizations(account);
      setIsOrganization(orgApproved);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadStats = async () => {
    try {
      const totalCerts = await contract.getTotalCertificates();
      setStats(prev => ({ ...prev, total: totalCerts.toNumber() }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const approveOrganization = async () => {
    if (!orgAddress) {
      showError('Please enter an organization address');
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.approveOrganization(orgAddress);
      await tx.wait();
      
      showSuccess(`Organization ${orgAddress} approved successfully!`);
      setOrgAddress('');
    } catch (error) {
      showError('Failed to approve organization: ' + error.message);
    }
    setLoading(false);
  };

  const issueCertificate = async () => {
    if (!recipientAddress || !recipientName || !courseName) {
      showError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.issueCertificate(recipientAddress, recipientName, courseName);
      const receipt = await tx.wait();
      
      // Get certificate ID from event
      const event = receipt.events?.find(e => e.event === 'CertificateIssued');
      const certificateId = event?.args?.certificateId?.toString();
      
      showSuccess(`Certificate #${certificateId} issued successfully to ${recipientName}!`);
      setRecipientAddress('');
      setRecipientName('');
      setCourseName('');
      loadStats();
    } catch (error) {
      showError('Failed to issue certificate: ' + error.message);
    }
    setLoading(false);
  };

  const verifyCertificate = async () => {
    if (!searchId) {
      showError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    try {
      const result = await contract.verifyCertificate(searchId);
      
      if (result.valid) {
        setVerificationResult({
          valid: true,
          id: searchId,
          organization: result.organization,
          recipient: result.recipient,
          name: result.name,
          course: result.course
        });
      } else {
        setVerificationResult({
          valid: false,
          id: searchId
        });
      }
    } catch (error) {
      showError('Failed to verify certificate: ' + error.message);
      setVerificationResult(null);
    }
    setLoading(false);
  };

  const searchCertificatesByAddress = async () => {
    if (!searchAddress) {
      showError('Please enter an address');
      return;
    }

    setLoading(true);
    try {
      const certIds = await contract.getRecipientCertificates(searchAddress);
      
      if (certIds.length === 0) {
        setCertificates([]);
        showError('No certificates found for this address');
        return;
      }

      const certPromises = certIds.map(async (id) => {
        const cert = await contract.getCertificate(id);
        return {
          id: id.toString(),
          organization: cert.organization,
          recipient: cert.recipient,
          name: cert.name,
          course: cert.course,
          issuedAt: new Date(cert.issuedAt.toNumber() * 1000).toLocaleDateString()
        };
      });

      const certs = await Promise.all(certPromises);
      setCertificates(certs);
    } catch (error) {
      showError('Failed to search certificates: ' + error.message);
      setCertificates([]);
    }
    setLoading(false);
  };

  const formatAddress = (address) => {
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

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('verify')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'verify'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🔍 Verify Certificate
              </button>
              
              {isOrganization && (
                <button
                  onClick={() => setActiveTab('issue')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'issue'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📝 Issue Certificate
                </button>
              )}
              
              {isOwner && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'admin'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ⚙️ Admin Panel
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('search')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🔎 Search Certificates
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Verify Certificate Tab */}
            {activeTab === 'verify' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Verify Certificate</h2>
                  <p className="text-gray-600 mb-6">Enter a certificate ID to verify its authenticity on the blockchain.</p>
                  
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      placeholder="Enter Certificate ID"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={verifyCertificate}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Verification Result */}
                {verificationResult && (
                  <div className={`rounded-xl p-6 ${verificationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    {verificationResult.valid ? (
                      <div>
                        <div className="flex items-center mb-4">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-green-800">Certificate Verified ✅</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Certificate ID:</p>
                            <p className="font-semibold text-gray-900">#{verificationResult.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Recipient Name:</p>
                            <p className="font-semibold text-gray-900">{verificationResult.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Course/Reason:</p>
                            <p className="font-semibold text-gray-900">{verificationResult.course}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Issued By:</p>
                            <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{formatAddress(verificationResult.organization)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-red-800">Certificate Not Found ❌</h3>
                        </div>
                        <p className="text-red-700 text-sm">Certificate ID #{verificationResult.id} does not exist on the blockchain.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Issue Certificate Tab */}
            {activeTab === 'issue' && isOrganization && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Issue New Certificate</h2>
                  <p className="text-gray-600 mb-6">Issue a blockchain certificate to a recipient.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course/Certification</label>
                    <input
                      type="text"
                      placeholder="Blockchain Development Course"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={issueCertificate}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {loading ? 'Issuing Certificate...' : 'Issue Certificate'}
                  </button>
                </div>
              </div>
            )}

            {/* Admin Panel Tab */}
            {activeTab === 'admin' && isOwner && (
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
                      disabled={loading}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Approving...' : 'Approve Organization'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Certificates Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Certificates</h2>
                  <p className="text-gray-600 mb-6">Find all certificates for a specific address.</p>
                  
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      placeholder="Enter wallet address (0x...)"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={searchCertificatesByAddress}
                      disabled={loading}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {certificates.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Found {certificates.length} certificate(s)</h3>
                    <div className="grid gap-4">
                      {certificates.map((cert, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Certificate ID:</p>
                              <p className="font-semibold">#{cert.id}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Name:</p>
                              <p className="font-semibold">{cert.name}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Course:</p>
                              <p className="font-semibold">{cert.course}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Issued:</p>
                              <p className="font-semibold">{cert.issuedAt}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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