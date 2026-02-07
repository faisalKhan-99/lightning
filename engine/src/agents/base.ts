import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { getTokenBalance } from '../chain/token.js';
import { getConnection } from '../chain/connection.js';
import { AgentState } from '../market/types.js';

export abstract class BaseAgent {
  public id: string;
  public name: string;
  public type: 'solar' | 'home' | 'battery';
  public keypair: Keypair;
  public tokenAccount: Account;
  public tokenAccountAddress: PublicKey;
  public activity: string = 'Idle';
  public strategy: string = '';
  public reasoning: string = '';

  constructor(
    id: string,
    name: string,
    type: 'solar' | 'home' | 'battery',
    keypair: Keypair,
    tokenAccount: Account
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.keypair = keypair;
    this.tokenAccount = tokenAccount;
    this.tokenAccountAddress = tokenAccount.address;
  }

  async getTokenBalance(): Promise<number> {
    return getTokenBalance(this.tokenAccountAddress);
  }

  async getSolBalance(): Promise<number> {
    const conn = getConnection();
    const balance = await conn.getBalance(this.keypair.publicKey);
    return balance / 1e9;
  }

  abstract getState(tokenBalance: number, solBalance: number): AgentState;
}
