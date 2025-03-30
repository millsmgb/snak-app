import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: Date.now()
      })
    });

    return new Response(JSON.stringify({ status: 'Block mined' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to mine block', detail: err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const dynamic = 'force-dynamic';
