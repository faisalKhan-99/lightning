import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { airdropSol, generateKeypair, sleep, getConnection } from './connection.js';
import { createEnergyMint, getOrCreateTokenAccount } from './token.js';
import { Account } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const KEYS_FILE = path.resolve(process.cwd(), '.keys.json');

export interface SystemAccounts {
  mintAuthority: Keypair;
  mint: PublicKey;
  agents: {
    solar: { keypair: Keypair; tokenAccount: Account };
    home: { keypair: Keypair; tokenAccount: Account };
    battery: { keypair: Keypair; tokenAccount: Account };
  };
}

interface SavedKeys {
  mintAuthority: number[];
  solar: number[];
  home: number[];
  battery: number[];
  mint?: string;
}

function loadOrCreateKeypair(name: string, saved: SavedKeys | null, field: keyof Omit<SavedKeys, 'mint'>): Keypair {
  if (saved && saved[field]) {
    return Keypair.fromSecretKey(Uint8Array.from(saved[field]));
  }
  return generateKeypair();
}

function saveKeys(keys: SavedKeys): void {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

async function getBalance(keypair: Keypair): Promise<number> {
  try {
    const balance = await getConnection().getBalance(keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

export async function initializeSystem(): Promise<SystemAccounts> {
  console.log('Initializing Solana system on Devnet...\n');

  // Load or create keypairs
  let saved: SavedKeys | null = null;
  if (fs.existsSync(KEYS_FILE)) {
    try {
      saved = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
      console.log('  Loaded existing keypairs from .keys.json');
    } catch {
      saved = null;
    }
  }

  const mintAuthority = loadOrCreateKeypair('mintAuthority', saved, 'mintAuthority');
  const solarKeypair = loadOrCreateKeypair('solar', saved, 'solar');
  const homeKeypair = loadOrCreateKeypair('home', saved, 'home');
  const batteryKeypair = loadOrCreateKeypair('battery', saved, 'battery');

  // SAVE KEYS IMMEDIATELY
  saveKeys({
    mintAuthority: Array.from(mintAuthority.secretKey),
    solar: Array.from(solarKeypair.secretKey),
    home: Array.from(homeKeypair.secretKey),
    battery: Array.from(batteryKeypair.secretKey),
    mint: saved?.mint,
  });

  const wallets = [
    { name: 'mintAuthority', kp: mintAuthority },
    { name: 'solar', kp: solarKeypair },
    { name: 'home', kp: homeKeypair },
    { name: 'battery', kp: batteryKeypair },
  ];

  // Check current balances
  console.log('  Checking wallet balances...');
  const balances = await Promise.all(
    wallets.map(async ({ name, kp }) => ({
      name,
      kp,
      balance: await getBalance(kp),
    }))
  );

  for (const { name, kp, balance } of balances) {
    console.log(`    ${name}: ${kp.publicKey.toBase58()} (${balance.toFixed(4)} SOL)`);
  }

  // Try airdropping to any wallet with < 0.1 SOL
  const needsFunding = balances.filter(b => b.balance < 0.1);

  if (needsFunding.length > 0) {
    console.log(`\n  Requesting airdrops for ${needsFunding.length} wallet(s)...`);
    let airdropFailed = false;

    for (const { name, kp } of needsFunding) {
      const ok = await airdropSol(kp, 1);
      if (!ok) airdropFailed = true;
      await sleep(3000);
    }

    if (airdropFailed) {
      // Re-check balances
      const updatedBalances = await Promise.all(
        wallets.map(async ({ name, kp }) => ({
          name,
          address: kp.publicKey.toBase58(),
          balance: await getBalance(kp),
        }))
      );

      const stillUnfunded = updatedBalances.filter(b => b.balance < 0.01);

      if (stillUnfunded.length > 0) {
        console.log('\n  ╔══════════════════════════════════════════════════════╗');
        console.log('  ║  DEVNET FAUCET RATE LIMITED - Manual funding needed  ║');
        console.log('  ╠══════════════════════════════════════════════════════╣');
        console.log('  ║                                                      ║');
        console.log('  ║  1. Visit https://faucet.solana.com                  ║');
        console.log('  ║  2. Select "Devnet" network                          ║');
        console.log('  ║  3. Fund each address below with 1 SOL:              ║');
        console.log('  ║                                                      ║');
        for (const { name, address, balance } of stillUnfunded) {
          console.log(`  ║  ${name}: ${address}`);
          console.log(`  ║    Balance: ${balance.toFixed(4)} SOL`);
        }
        console.log('  ║                                                      ║');
        console.log('  ║  4. Restart the engine: npx tsx src/main.ts          ║');
        console.log('  ║     Keypairs are saved - no data will be lost.       ║');
        console.log('  ╚══════════════════════════════════════════════════════╝\n');
        process.exit(1);
      }
    }
  }

  console.log('  All wallets funded!');

  // Create or reuse mint
  let mint: PublicKey;
  if (saved?.mint) {
    try {
      const mintInfo = await getConnection().getAccountInfo(new PublicKey(saved.mint));
      if (mintInfo) {
        mint = new PublicKey(saved.mint);
        console.log(`  Reusing token mint: ${mint.toBase58()}`);
      } else {
        mint = await createEnergyMint(mintAuthority);
      }
    } catch {
      mint = await createEnergyMint(mintAuthority);
    }
  } else {
    mint = await createEnergyMint(mintAuthority);
  }

  // Update saved keys with mint
  saveKeys({
    mintAuthority: Array.from(mintAuthority.secretKey),
    solar: Array.from(solarKeypair.secretKey),
    home: Array.from(homeKeypair.secretKey),
    battery: Array.from(batteryKeypair.secretKey),
    mint: mint.toBase58(),
  });

  // Create token accounts
  const solarTokenAccount = await getOrCreateTokenAccount(mintAuthority, mint, solarKeypair.publicKey);
  const homeTokenAccount = await getOrCreateTokenAccount(mintAuthority, mint, homeKeypair.publicKey);
  const batteryTokenAccount = await getOrCreateTokenAccount(mintAuthority, mint, batteryKeypair.publicKey);

  console.log('\n  System initialized successfully!');

  return {
    mintAuthority,
    mint,
    agents: {
      solar: { keypair: solarKeypair, tokenAccount: solarTokenAccount },
      home: { keypair: homeKeypair, tokenAccount: homeTokenAccount },
      battery: { keypair: batteryKeypair, tokenAccount: batteryTokenAccount },
    },
  };
}
