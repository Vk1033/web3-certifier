import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID, NETWORK_NAME } from '../lib/contract-config';
import { DisplayCertificate, VerificationResult } from '../types/contract';

const Web3Interface: React.FC = () => {
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isOrganization, setIsOrganization] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [orgAddress, setOrgAddress] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');
  const [searchAddress, setSearchAddress] = useState<string>('');

  const [certificates, setCertificates] = useState<DisplayCertificate[]>([]);
  const [userCertificates, setUserCertificates] = useState<DisplayCertificate[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [stats, setStats] = useState<{ total: number; organizations: number }>({ total: 0, organizations: 0 });
  const [activeTab, setActiveTab] = useState<string>('verify');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeWeb3();
    }
  }, []);

  useEffect(() => {
    if (contract && account) {
      checkUserRole();
      loadStats();
      loadUserCertificates();
    }
  }, [contract, account]);

  const initializeWeb3 = async (): Promise<void> => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setProvider(provider);
          setSigner(signer);
          setContract(contract);
          setAccount(accounts[0].address);
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
        await window.ethereum.request({ method: 'eth_requestAccounts' });
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
    console.log('approveOrganization called', { orgAddress, contract, signer });
    if (!orgAddress || !contract || !signer) {
      showError('Please enter an organization address');
      console.error('Missing orgAddress, contract, or signer', { orgAddress, contract, signer });
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.approveOrganization(orgAddress);
      await tx.wait();
      showSuccess(`Organization ${orgAddress} approved successfully!`);
      setOrgAddress('');
    } catch (error) {
      showError('Failed to approve organization: ' + (error as Error).message);
      console.error('approveOrganization error', error);
    } finally {
      setLoading(false);
    }
  };

  const issueCertificate = async (): Promise<void> => {
    if (!recipientAddress || !recipientName || !courseName || !contract) {
      showError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.issueCertificate(recipientAddress, recipientName, courseName);
      const receipt = await tx.wait();
      let certificateId = 'unknown';
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const parsedLog = contract.interface.parseLog(receipt.logs[0]);
          if (parsedLog && parsedLog.args && parsedLog.args.certificateId) {
            certificateId = parsedLog.args.certificateId.toString();
          }
        } catch {}
      }
      showSuccess(`Certificate #${certificateId} issued successfully to ${recipientName}!`);
      setRecipientAddress('');
      setRecipientName('');
      setCourseName('');
      loadStats();
    } catch (error) {
      showError('Failed to issue certificate: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const verifyCertificate = async (): Promise<void> => {
    if (!searchId || !contract) {
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
        } as VerificationResult);
      } else {
        setVerificationResult({
          valid: false,
          id: searchId,
          organization: '',
          recipient: '',
          name: '',
          course: ''
        } as VerificationResult);
      }
    } catch (error) {
      showError('Failed to verify certificate: ' + (error as Error).message);
      setVerificationResult(null);
    }
    setLoading(false);
  };

  const searchCertificatesByAddress = async (): Promise<void> => {
    if (!searchAddress || !contract) {
      showError('Please enter an address');
      return;
    }
    setLoading(true);
    try {
      const certIds = await contract.getRecipientCertificates(searchAddress);
      if (!certIds || certIds.length === 0) {
        setCertificates([]);
        showError('No certificates found for this address');
        return;
      }
      const certPromises = certIds.map(async (id: bigint) => {
        const cert = await contract.getCertificate(id);
        return {
          id: id.toString(),
          organization: cert.organization,
          recipient: cert.recipient,
          name: cert.name,
          course: cert.course,
          issuedAt: new Date(Number(cert.issuedAt) * 1000).toLocaleDateString()
        };
      });
      const certs = await Promise.all(certPromises);
      setCertificates(certs);
    } catch (error) {
      showError('Failed to search certificates: ' + (error as Error).message);
      setCertificates([]);
    }
    setLoading(false);
  };

  const loadUserCertificates = async (): Promise<void> => {
    if (!account || !contract) return;
    setLoading(true);
    try {
      const certIds = await contract.getRecipientCertificates(account);
      if (certIds && certIds.length === 0) {
        setUserCertificates([]);
        return;
      }
      const certPromises = certIds.map(async (id: bigint) => {
        const cert = await contract.getCertificate(id);
        return {
          id: id.toString(),
          organization: cert.organization,
          recipient: cert.recipient,
          name: cert.name,
          course: cert.course,
          issuedAt: new Date(Number(cert.issuedAt) * 1000).toLocaleDateString()
        };
      });
      const certs = await Promise.all(certPromises);
      setUserCertificates(certs);
    } catch (error) {
      setUserCertificates([]);
    }
    setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-2">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Web3 Certificate Registry</h1>
            <p className="text-gray-600">Issue, approve, and verify certificates on the blockchain</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <span className="text-gray-700 font-mono text-sm mb-1">{formatAddress(account)}</span>
            <span className="text-xs text-gray-500">{isOwner ? 'Owner' : isOrganization ? 'Organization' : 'User'}</span>
          </div>
        </div>
        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-center">{success}</div>
        )}
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none ${activeTab === 'verify' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
            onClick={() => setActiveTab('verify')}
          >
            Verify Certificate
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none ${activeTab === 'search' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
            onClick={() => setActiveTab('search')}
          >
            Search by Address
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none ${activeTab === 'my' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
            onClick={() => setActiveTab('my')}
          >
            My Certificates
          </button>
          {isOrganization && (
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none ${activeTab === 'issue' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
              onClick={() => setActiveTab('issue')}
            >
              Issue Certificate
            </button>
          )}
          {isOwner && (
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none ${activeTab === 'admin' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          )}
        </div>
        {/* Tab Content */}
        <div className="bg-gray-50 rounded-b-2xl p-6 min-h-[300px]">
          {/* Verify Certificate Tab */}
          {activeTab === 'verify' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Verify Certificate</h2>
              <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-2 md:space-y-0 md:space-x-4">
                <input
                  type="text"
                  placeholder="Certificate ID"
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={verifyCertificate}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Verify
                </button>
              </div>
              {verificationResult && (
                <div className={`mt-4 p-4 rounded ${verificationResult.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {verificationResult.valid ? (
                    <div>
                      <div className="font-bold mb-2">Certificate is valid!</div>
                      <div><span className="font-semibold">ID:</span> {verificationResult.id}</div>
                      <div><span className="font-semibold">Organization:</span> {verificationResult.organization}</div>
                      <div><span className="font-semibold">Recipient:</span> {verificationResult.recipient}</div>
                      <div><span className="font-semibold">Name:</span> {verificationResult.name}</div>
                      <div><span className="font-semibold">Course:</span> {verificationResult.course}</div>
                    </div>
                  ) : (
                    <div>Certificate is invalid or does not exist.</div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Search by Address Tab */}
          {activeTab === 'search' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Certificates by Address</h2>
              <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-2 md:space-y-0 md:space-x-4">
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={searchAddress}
                  onChange={e => setSearchAddress(e.target.value)}
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={searchCertificatesByAddress}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Search
                </button>
              </div>
              {certificates.length > 0 && (
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full bg-white rounded shadow">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Organization</th>
                        <th className="px-4 py-2">Recipient</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Course</th>
                        <th className="px-4 py-2">Issued At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map(cert => (
                        <tr key={cert.id} className="border-t">
                          <td className="px-4 py-2 font-mono">{cert.id}</td>
                          <td className="px-4 py-2">{formatAddress(cert.organization)}</td>
                          <td className="px-4 py-2">{formatAddress(cert.recipient)}</td>
                          <td className="px-4 py-2">{cert.name}</td>
                          <td className="px-4 py-2">{cert.course}</td>
                          <td className="px-4 py-2">{cert.issuedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* My Certificates Tab */}
          {activeTab === 'my' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">My Certificates</h2>
              {userCertificates.length === 0 ? (
                <div className="text-gray-500">No certificates found for your account.</div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full bg-white rounded shadow">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Organization</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Course</th>
                        <th className="px-4 py-2">Issued At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userCertificates.map(cert => (
                        <tr key={cert.id} className="border-t">
                          <td className="px-4 py-2 font-mono">{cert.id}</td>
                          <td className="px-4 py-2">{formatAddress(cert.organization)}</td>
                          <td className="px-4 py-2">{cert.name}</td>
                          <td className="px-4 py-2">{cert.course}</td>
                          <td className="px-4 py-2">{cert.issuedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* Issue Certificate Tab (Organization Only) */}
          {activeTab === 'issue' && isOrganization && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Issue Certificate</h2>
              <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-2 md:space-y-0 md:space-x-4">
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  placeholder="Course Name"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={issueCertificate}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Issue
                </button>
              </div>
            </div>
          )}
          {/* Admin Tab (Owner Only) */}
          {activeTab === 'admin' && isOwner && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Approve Organization</h2>
              <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-2 md:space-y-0 md:space-x-4">
                <input
                  type="text"
                  placeholder="Organization Address"
                  value={orgAddress}
                  onChange={e => setOrgAddress(e.target.value)}
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={approveOrganization}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Stats */}
        <div className="mt-8 flex flex-col md:flex-row md:justify-between text-gray-600 text-sm">
          <div>Total Certificates: <span className="font-semibold text-gray-900">{stats.total}</span></div>
        </div>
      </div>
    </div>
  );
};

export default Web3Interface; 