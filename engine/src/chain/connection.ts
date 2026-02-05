import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SOLANA_RPC } from '../config.js';

let connection: Connection;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(SOLANA_RPC, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true,
    });
  }
  return connection;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function airdropSol(keypair: Keypair, amount: number = 1): Promise<boolean> {
  const conn = getConnection();

  // Check current balance first — skip if already funded
  try {
    const balance = await conn.getBalance(keypair.publicKey);
    if (balance >= 0.1 * LAMPORTS_PER_SOL) {
      console.log(`  ${keypair.publicKey.toBase58().slice(0, 8)}... already has ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
      return true;
    }
  } catch {
    // ignore balance check failure
  }

  // Use raw fetch to avoid web3.js internal retry logic
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: `airdrop-${Date.now()}`,
        method: 'requestAirdrop',
        params: [keypair.publicKey.toBase58(), amount * LAMPORTS_PER_SOL],
      });

      const resp = await fetch(SOLANA_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (resp.status === 429) {
        if (attempt < maxRetries) {
          const delay = 5000 * attempt;
          console.log(`  Airdrop rate-limited (attempt ${attempt}/${maxRetries}), waiting ${delay / 1000}s...`);
          await sleep(delay);
          continue;
        }
        console.warn(`  Airdrop failed for ${keypair.publicKey.toBase58().slice(0, 8)}... (rate limited)`);
        return false;
      }

      const json = await resp.json() as { result?: string; error?: { message: string } };
      if (json.error) {
        if (attempt < maxRetries) {
          const delay = 5000 * attempt;
          console.log(`  Airdrop error: ${json.error.message}, retrying in ${delay / 1000}s...`);
          await sleep(delay);
          continue;
        }
        console.warn(`  Airdrop failed: ${json.error.message}`);
        return false;
      }

      if (json.result) {
        // Confirm transaction
        try {
          await conn.confirmTransaction(json.result, 'confirmed');
        } catch {
          // May timeout but funds might still arrive
        }
        console.log(`  Airdropped ${amount} SOL to ${keypair.publicKey.toBase58().slice(0, 8)}...`);
        return true;
      }
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = 5000 * attempt;
        console.log(`  Airdrop network error (attempt ${attempt}), retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        console.warn(`  Airdrop failed for ${keypair.publicKey.toBase58().slice(0, 8)}... after ${maxRetries} attempts`);
        return false;
      }
    }
  }
  return false;
}

export function generateKeypair(): Keypair {
  return Keypair.generate();
}
