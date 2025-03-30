'use client'

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import SnakeEggABI from '@/abis/SnakeEggNFT.json';
import ERC20ABI from '@/abis/Snak.json';

const NFT_CONTRACT = '0x809d550fca64d94Bd9F66E60752A544199cfAC3D';
const ERC20_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export default function Feed() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [nftContract, setNftContract] = useState();
  const [erc20Contract, setErc20Contract] = useState();
  const [account, setAccount] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
    }
  }, []);

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const user = accounts[0];
    setAccount(user);
    const s = await provider.getSigner();
    setSigner(s);
    setNftContract(new ethers.Contract(NFT_CONTRACT, SnakeEggABI.abi, s));
    setErc20Contract(new ethers.Contract(ERC20_ADDRESS, ERC20ABI.abi, s));
  };

  const approveAndFeed = async () => {
    const amt = ethers.parseUnits(amount, 18);
    const approveTx = await erc20Contract.approve(NFT_CONTRACT, amt);
    await approveTx.wait();
    const feedTx = await nftContract.feed(tokenId, amt);
    await feedTx.wait();
    alert(`Fed snake #${tokenId} with ${amount} tokens`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">🍽️ Feed Your Snake</h1>
      {!account ? (
        <button onClick={connectWallet} className="px-4 py-2 bg-blue-600 text-white rounded">Connect Wallet</button>
      ) : (
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <input
            type="text"
            value={tokenId}
            onChange={e => setTokenId(e.target.value)}
            placeholder="Snake ID"
            className="border p-2 w-full rounded mb-4"
          />
          <input
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Token Amount"
            className="border p-2 w-full rounded mb-4"
          />
          <button
            onClick={approveAndFeed}
            className="w-full px-4 py-2 bg-green-600 text-white rounded"
          >
            Feed Snake
          </button>
        </div>
      )}
    </div>
  );
}
