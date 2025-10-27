import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID, NETWORK_NAME } from '../lib/contract-config';

const Web3Component = dynamic(() => import('../components/Web3Interface'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Web3 Interface...</p>
    </div>
  </div>
});

const Home: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <>
        <Head>
          <title>Web3 Certificate Registry</title>
          <meta name="description" content="Blockchain-based certificate verification system" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Application...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Web3 Certificate Registry</title>
        <meta name="description" content="Issue and verify certificates on the blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Web3Component />
    </>
  );
};

export default Home; 