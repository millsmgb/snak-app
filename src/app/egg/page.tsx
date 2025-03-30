'use client'

import { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import SnakeEggABI from '@/abis/SnakeEggNFT.json';

const CONTRACT_ADDRESS = '0x809d550fca64d94Bd9F66E60752A544199cfAC3D';
const HATCH_TIME_SECONDS = 600; // 10 minutes

export default function MintPage() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [contract, setContract] = useState();
  const [account, setAccount] = useState('');
  const [mintedTokenId, setMintedTokenId] = useState(null);
  const [birthTime, setBirthTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [hatchable, setHatchable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const p = new BrowserProvider(window.ethereum);
      setProvider(p);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (birthTime) {
      interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = birthTime + HATCH_TIME_SECONDS - now;
        setTimeLeft(Math.max(remaining, 0));
        setHatchable(remaining <= 0);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [birthTime]);

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const user = accounts[0];
    setAccount(user);
    const s = await provider.getSigner();
    setSigner(s);
    const c = new Contract(CONTRACT_ADDRESS, SnakeEggABI.abi, s);
    setContract(c);
  };

  const mintEgg = async () => {
    const tx = await contract.mintEgg();
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === 'EggMinted');
    const tokenId = event?.args?.tokenId?.toString();
    setMintedTokenId(tokenId);
    const snakeData = await contract.snakes(tokenId);
    setBirthTime(Number(snakeData.birthTime));
  };

  const hatchEgg = async () => {
    if (!hatchable || mintedTokenId === null) return;
    const tx = await contract.hatch(mintedTokenId);
    await tx.wait();
    alert(`Snake #${mintedTokenId} has hatched!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">🐣 Snake Egg Mint</h1>
      {!account ? (
        <button onClick={connectWallet} className="px-4 py-2 bg-blue-600 text-white rounded">Connect Wallet</button>
      ) : (
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <p className="mb-4">Connected as: {account}</p>
          <button onClick={mintEgg} className="px-4 py-2 bg-green-500 text-white rounded w-full">Mint Egg</button>

          {mintedTokenId !== null && (
            <div className="mt-6 text-center">
              <p className="text-lg">Your Egg: #{mintedTokenId}</p>
              <p className="text-sm text-gray-600">{hatchable ? 'Ready to hatch!' : `Time until hatch: ${timeLeft}s`}</p>
              <button
                onClick={hatchEgg}
                disabled={!hatchable}
                className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
              >
                Hatch Snake
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
