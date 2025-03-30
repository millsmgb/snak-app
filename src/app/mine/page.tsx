'use client'

import { useState } from 'react';

export default function MineBlocks() {
  const [blockCount, setBlockCount] = useState('');
  const [mining, setMining] = useState(false);
  const [status, setStatus] = useState('');

  const handleMineBlocks = async () => {
    if (!blockCount || isNaN(Number(blockCount))) {
      setStatus('Please enter a valid number of blocks');
      return;
    }

    try {
      setMining(true);
      setStatus('Mining blocks...');

      for (let i = 0; i < Number(blockCount); i++) {
        await fetch('/api/mine-block', { method: 'POST' });
      }

      setStatus(`${blockCount} blocks mined successfully.`);
    } catch (error) {
      console.error(error);
      setStatus('Error mining blocks');
    } finally {
      setMining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Hardhat Block Mining</h1>
      <input
        type="text"
        value={blockCount}
        onChange={e => setBlockCount(e.target.value)}
        placeholder="Number of blocks"
        className="border p-2 w-64 rounded mb-4"
      />
      <button
        onClick={handleMineBlocks}
        disabled={mining}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {mining ? 'Mining...' : 'Mine Blocks'}
      </button>
      {status && <p className="mt-4 text-center">{status}</p>}
    </div>
  );
}
