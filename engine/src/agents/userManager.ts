import { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getConnection } from '../chain/connection.js';
import { getOrCreateTokenAccount } from '../chain/token.js';
import { UserAgent } from './user.js';
import { logger } from '../utils/index.js';

const USER_SOL_FUNDING = 0.005 * 1e9; // 0.005 SOL in lamports — enough for tx fees

export class UserManager {
  private users: Map<string, UserAgent> = new Map(); // phantomWallet → UserAgent
  private mintAuthority: Keypair;
  private mint: PublicKey;

  constructor(mintAuthority: Keypair, mint: PublicKey) {
    this.mintAuthority = mintAuthority;
    this.mint = mint;
  }

  async addUser(phantomWallet: string, role: 'solar' | 'home' | 'battery'): Promise<UserAgent> {
    if (this.users.has(phantomWallet)) {
      throw new Error('Wallet already joined');
    }

    const keypair = Keypair.generate();
    const agentId = `user_${phantomWallet.slice(0, 8)}`;

    logger.info('USER_MGR', `Creating user agent: ${agentId} (role: ${role})`);

    // Fund the new agent from mintAuthority (avoids devnet faucet rate limits)
    const conn = getConnection();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.mintAuthority.publicKey,
        toPubkey: keypair.publicKey,
        lamports: USER_SOL_FUNDING,
      })
    );
    await sendAndConfirmTransaction(conn, tx, [this.mintAuthority]);
    logger.info('USER_MGR', `Funded ${agentId} with 0.005 SOL from mintAuthority`);

    // Create token account (mintAuthority pays the rent)
    const tokenAccount = await getOrCreateTokenAccount(this.mintAuthority, this.mint, keypair.publicKey);

    // Only pass mintAuthority/mint to solar role users so they can mint
    const agent = new UserAgent(
      agentId,
      role,
      phantomWallet,
      keypair,
      tokenAccount,
      role === 'solar' ? this.mintAuthority : undefined,
      role === 'solar' || role === 'home' ? this.mint : undefined
    );

    this.users.set(phantomWallet, agent);
    logger.info('USER_MGR', `User agent created: ${agentId}`, { role, wallet: phantomWallet });

    return agent;
  }

  removeUser(phantomWallet: string): boolean {
    const agent = this.users.get(phantomWallet);
    if (agent) {
      logger.info('USER_MGR', `Removing user agent: ${agent.id}`);
      this.users.delete(phantomWallet);
      return true;
    }
    return false;
  }

  getUser(phantomWallet: string): UserAgent | undefined {
    return this.users.get(phantomWallet);
  }

  getAllUsers(): UserAgent[] {
    return Array.from(this.users.values());
  }

  hasUser(phantomWallet: string): boolean {
    return this.users.has(phantomWallet);
  }
}
