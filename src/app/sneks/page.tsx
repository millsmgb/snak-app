'use client'

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import SnakeEggABI from '@/abis/SnakeEggNFT.json';
import ERC20ABI from '@/abis/Snak.json';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

const CONTRACT_ADDRESS = process.env.SNEK_EGG_NFT_CONTRACT_ADDRESS;
const TOKEN_ADDRESS = process.env.SNAK_CONTRACT_ADDRESS;
const HATCH_TIME_SECONDS = 600;
const HUNGER_INTERVAL = 4 * 60 * 60; // 4 hours in seconds
const STARVING_INTERVAL = 24 * 60 * 60; // 24 hours in seconds

export default function MySnakes() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [contract, setContract] = useState();
  const [account, setAccount] = useState('');
  const [snakeData, setSnakeData] = useState([]);
  const [loadingHatch, setLoadingHatch] = useState(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [justHatched, setJustHatched] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedAmounts, setFeedAmounts] = useState({});
  const [isFedId, setIsFedId] = useState(null);
  const handleFeedInput = (id, value) => {
    setFeedAmounts(prev => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const user = accounts[0];
    setAccount(user);
    const s = await provider.getSigner();
    setSigner(s);
    const c = new ethers.Contract(CONTRACT_ADDRESS, SnakeEggABI.abi, s);
    setContract(c);
    fetchOwnedNFTs(user, c);
  };

  const fetchOwnedNFTs = async (user, contract) => {
    const tokenIds = await contract.getOwnedTokens(user);
    const data = [];
    for (const id of tokenIds) {
      const snake = await contract.snakes(id);
      data.push({
        id: id.toString(),
        hatched: snake.hatched,
        color: snake.color,
        speckles: snake.speckles,
        birthTime: Number(snake.birthTime),
        lastFed: Number(snake.lastFed)
      });
    }
    setSnakeData(data);
  };

  const hatchSnake = async (id) => {
    try {
      setLoadingHatch(id);
      const tx = await contract.hatch(id);
      await tx.wait();
      setJustHatched(id);
      setShowConfetti(true);
      fetchOwnedNFTs(account, contract);
      setTimeout(() => setShowConfetti(false), 6000);
    } catch (err) {
      console.error("Hatch failed:", err);
    } finally {
      setLoadingHatch(null);
    }
  };

  const feedSnake = async (id) => {

    const amount = feedAmounts[id];
    if (!amount || isNaN(amount)) return alert('Enter a valid amount');

    if (amount < 10) return alert('Snek needs at least 10 snaks');

    try {
      const token = new ethers.Contract(TOKEN_ADDRESS, ERC20ABI.abi, signer);
      const parsedAmount = ethers.parseUnits(amount, 18);

      const owner = await contract.ownerOf(id);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        alert('You do not own this snake.');
        return;
      }

      const snake = await contract.snakes(id);
      if (!snake.hatched) {
        alert('Snake is not hatched yet.');
        return;
      }

      const allowance = await token.allowance(account, CONTRACT_ADDRESS);
      console.log('Allowance:', allowance.toString());
      console.log('Parsed Amount:', parsedAmount.toString());

      if (allowance < parsedAmount) {
        console.log('Approving token transfer...');
        const approveTx = await token.approve(CONTRACT_ADDRESS, parsedAmount);
        await approveTx.wait();
      } else {
        console.log('Sufficient allowance already set.');
      }

      console.log('Feeding snake...');
      const tx = await contract.feed(id, parsedAmount);
      await tx.wait();
      alert(`Snake #${id} has been fed ${amount} tokens.`);
      setFeedAmounts(prev => ({ ...prev, [id]: '' }));
      await fetchOwnedNFTs(account, contract);
    } catch (err) {
      console.error('Feeding failed:', err);
      alert('Feeding failed');
    }
  };

  const getHungerStyle = (lastFed) => {
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastFed = now - Number(lastFed);
    if (timeSinceLastFed >= STARVING_INTERVAL) {
      return {
        opacity: 0.2,
        overlay: true,
      };
    } else if (timeSinceLastFed >= HUNGER_INTERVAL) {
      const fadeLevel = Math.max(0.4, 1 - ((timeSinceLastFed - HUNGER_INTERVAL) / (STARVING_INTERVAL - HUNGER_INTERVAL)));
      return {
        opacity: fadeLevel,
        overlay: false,
      };
    } else {
      return {
        opacity: 1,
        overlay: false,
      };
    }
  };


  function generateSnakeSVG(color, speckles) {
    const bodySegments = Array.from({ length: 8 }).map((_, i) => {
      const cx = 20 + i * 10;
      const cy = 50 + Math.sin(i * 0.8) * 10;
      const base = `<circle cx='${cx}' cy='${cy}' r='6' fill='${color}' />`;

      let overlay = '';
      if (speckles === 'dots') {
        overlay = `<circle cx='${cx - 2}' cy='${cy - 2}' r='1.2' fill='black' />`;
      } else if (speckles === 'stripes' && i % 2 === 0) {
        overlay = `<rect x='${cx - 3}' y='${cy - 6}' width='6' height='12' fill='black' />`;
      }

      return `${base}${overlay}`;
    }).join('');

    const head = `<circle cx='100' cy='50' r='8' fill='${color}' />`;
    const eyes = `<circle cx='97' cy='47' r='1.5' fill='white'/><circle cx='103' cy='47' r='1.5' fill='white'/><circle cx='97' cy='47' r='0.5' fill='black'/><circle cx='103' cy='47' r='0.5' fill='black'/>`;
    const tongue = `<path d='M100 58 Q100 65, 97 68 Q100 65, 103 68 Q100 65, 100 58' stroke='red' fill='red'/>`;

    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='120' height='100'>
        ${bodySegments}
        ${head}
        ${eyes}
        ${tongue}
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  function getEggSVG(cracking = false) {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
        <ellipse cx='50' cy='50' rx='30' ry='40' fill='#f8f8f8' stroke='#ccc' stroke-width='2' />
        ${cracking ? "<path d='M50 20 Q52 30, 48 40 Q52 50, 48 60 Q52 70, 50 80' stroke='black' fill='none' stroke-width='2' />" : ''}
      </svg>
    `.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}
      <h1 className="text-3xl font-bold text-center mb-6">🐍 My Sneks</h1>
      {!account ? (
        <div className="flex justify-center">
          <button onClick={connectWallet} className="px-4 py-2 bg-blue-600 text-white rounded">Connect Wallet</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {snakeData.map(snake => {
            const timeLeft = snake.birthTime + HATCH_TIME_SECONDS - now;
            const canHatch = timeLeft <= 0;
            const hunger = getHungerStyle(snake.lastFed);

            return (
              <div key={snake.id} className="bg-white p-4 rounded shadow">
                <p><strong>ID:</strong> #{snake.id}</p>
                <p><strong>Status:</strong> {snake.hatched ? 'Hatched' : 'Egg'}</p>
                <p><strong>Color:</strong> {snake.color}</p>
                <p><strong>Speckles:</strong> {snake.speckles}</p>

                {snake.hatched ? (
                  <div className="flex flex-col items-center">
                    {hunger.opacity <= 0.2 ? (
                      <div className="mt-2 border rounded">
                        <span className="text-red-600 text-8xl font-bold">❌</span>
                      </div>
                    ) : (
                      <motion.img
                        initial={snake.id === justHatched ? { scale: 0.8, opacity: 0 } : false}
                        animate={snake.id === justHatched ? { scale: 1, opacity: 1 } : false}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        src={generateSnakeSVG(snake.color, snake.speckles)}
                        alt={`Snake ${snake.id}`}
                        style={{ opacity: hunger.opacity }}
                        className="mt-2 border rounded"
                      />
                    )}
                    <p className="text-sm text-center mt-2 font-medium">
                      Hunger Status: {
                        hunger.overlay
                          ? 'Starving'
                          : hunger.opacity >= 0.9
                            ? 'Full'
                            : hunger.opacity >= 0.6
                              ? 'Hungry'
                              : 'Very Hungry'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <motion.img
                      src={getEggSVG(loadingHatch === snake.id)}
                      alt="Egg"
                      className="mt-2 border rounded"
                      animate={loadingHatch === snake.id ? { rotate: [0, -10, 10, -10, 10, 0] } : false}
                      transition={{ duration: 0.8 }}
                    />
                    <button
                      onClick={() => hatchSnake(snake.id)}
                      disabled={!canHatch || loadingHatch === snake.id}
                      className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
                    >
                      {loadingHatch === snake.id ? 'Hatching...' : 'Hatch Now'}
                    </button>
                    <br></br>
                    <p className="text-sm text-gray-600">{canHatch ? 'Ready to hatch!' : `Time until hatch: ${timeLeft}s`}</p>
                  </div>
                )}
                {snake.hatched && (
                  <div className="mt-4">
                    <input
                      type="number"
                      placeholder="Amount to feed"
                      value={feedAmounts[snake.id] || ''}
                      onChange={(e) => handleFeedInput(snake.id, e.target.value)}
                      className="mb-2 w-full px-3 py-2 border rounded"
                    />
                    <button
                      onClick={() => feedSnake(snake.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded w-full"
                    >
                      Feed Snek Snaks 🍥
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
