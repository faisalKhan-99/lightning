import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  burn,
  transfer,
  getAccount,
  Account,
} from '@solana/spl-token';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getConnection } from './connection.js';
import { TOKEN_DECIMALS, TOKEN_MULTIPLIER } from '../config.js';

export async function createEnergyMint(mintAuthority: Keypair): Promise<PublicKey> {
  const conn = getConnection();
  const mint = await createMint(
    conn,
    mintAuthority, // payer
    mintAuthority.publicKey, // mint authority
    null, // freeze authority
    TOKEN_DECIMALS
  );
  console.log(`Created energy token mint: ${mint.toBase58()}`);
  return mint;
}

export async function getOrCreateTokenAccount(
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<Account> {
  const conn = getConnection();
  const account = await getOrCreateAssociatedTokenAccount(
    conn,
    payer,
    mint,
    owner
  );
  return account;
}

export async function mintTokens(
  mintAuthority: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: number
): Promise<string> {
  const conn = getConnection();
  const rawAmount = Math.round(amount * TOKEN_MULTIPLIER);
  const sig = await mintTo(conn, mintAuthority, mint, destination, mintAuthority, rawAmount);
  return sig;
}

export async function burnTokens(
  owner: Keypair,
  mint: PublicKey,
  tokenAccount: PublicKey,
  amount: number
): Promise<string> {
  const conn = getConnection();
  const rawAmount = Math.round(amount * TOKEN_MULTIPLIER);
  const sig = await burn(conn, owner, tokenAccount, mint, owner, rawAmount);
  return sig;
}

export async function transferTokens(
  owner: Keypair,
  source: PublicKey,
  destination: PublicKey,
  amount: number
): Promise<string> {
  const conn = getConnection();
  const rawAmount = Math.round(amount * TOKEN_MULTIPLIER);
  const sig = await transfer(conn, owner, source, destination, owner, rawAmount);
  return sig;
}

export async function getTokenBalance(tokenAccount: PublicKey): Promise<number> {
  const conn = getConnection();
  try {
    const account = await getAccount(conn, tokenAccount);
    return Number(account.amount) / TOKEN_MULTIPLIER;
  } catch {
    return 0;
  }
}
