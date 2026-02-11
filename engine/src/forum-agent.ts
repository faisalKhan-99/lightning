#!/usr/bin/env npx tsx

/**
 * Automated Colosseum Forum Replier
 *
 * Monitors new forum posts and replies with an Energy/DePIN expert persona.
 * Uses GPT-4o-mini for contextual reply generation.
 *
 * Usage: cd engine && npx tsx src/forum-agent.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from hackathon root
config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

import OpenAI from 'openai';
import { colosseumAPI } from './colosseum/api.js';
import { OPENAI_API_KEY, LLM_ENABLED, COLOSSEUM_ENABLED } from './config.js';

const FORUM_CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const REPLY_THROTTLE_MS = 60_000; // 60s minimum between replies
const MAX_REPLIES_PER_RUN = 1; // 1 reply per check cycle

const SYSTEM_PROMPT = `You are an Energy and DePIN infrastructure expert participating in a hackathon forum. You have deep knowledge of:
- Decentralized energy markets and peer-to-peer energy trading
- Real-world asset tokenization (RWA) on Solana
- DePIN (Decentralized Physical Infrastructure Networks)
- Smart grid technology and renewable energy systems
- Solana blockchain development and SPL tokens

Your communication style:
- Concise: 2-4 sentences max
- Conversational and authentic — you sound like a knowledgeable peer, not a corporate bot
- You ask thoughtful follow-up questions to drive discussion
- You frame discussions through the lens of decentralized energy and DePIN when relevant
- You reference SolGrid (your project — an autonomous energy trading simulation on Solana devnet) naturally when it's genuinely relevant, but NOT in every reply
- Never use generic praise like "Great post!" or "Love this idea!" — jump straight into substance
- Never start with "As an expert in..." or similar self-referencing phrases`;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const repliedPostIds = new Set<number>();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateReply(title: string, body: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Reply to this forum post:\n\nTitle: ${title}\n\n${body}`,
      },
    ],
    max_tokens: 200,
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

async function checkAndReply() {
  console.log(`[Forum] Checking for new posts... (${new Date().toLocaleTimeString()})`);

  try {
    const { posts } = await colosseumAPI.getForumPosts('new', 20);
    console.log(`[Forum] Found ${posts.length} posts`);

    let repliesThisRun = 0;

    for (const post of posts) {
      if (repliesThisRun >= MAX_REPLIES_PER_RUN) break;
      if (repliedPostIds.has(post.id)) continue;
      if (post.agentName === 'lightning') {
        repliedPostIds.add(post.id);
        continue;
      }

      console.log(`[Forum] Generating reply for: "${post.title}" by ${post.agentName}`);

      const reply = await generateReply(post.title, post.body);
      if (!reply) {
        console.log(`[Forum] Empty reply generated, skipping`);
        continue;
      }

      console.log(`[Forum] Reply: ${reply.slice(0, 100)}...`);

      await colosseumAPI.createComment(post.id, reply);
      repliedPostIds.add(post.id);
      repliesThisRun++;

      console.log(`[Forum] Posted reply to post #${post.id}`);

      if (repliesThisRun < MAX_REPLIES_PER_RUN) {
        await sleep(REPLY_THROTTLE_MS);
      }
    }

    if (repliesThisRun === 0) {
      console.log(`[Forum] No new posts to reply to`);
    }
  } catch (err: any) {
    console.error(`[Forum] Error: ${err.message}`);
  }
}

async function main() {
  console.log('=== SolGrid Forum Agent ===\n');

  if (!COLOSSEUM_ENABLED) {
    console.error('ERROR: COLOSSEUM_API_KEY not set in .env');
    process.exit(1);
  }

  if (!LLM_ENABLED) {
    console.error('ERROR: OPENAI_API_KEY not set in .env');
    process.exit(1);
  }

  // Seed replied set with our own posts to avoid self-replies
  try {
    const { posts: myPosts } = await colosseumAPI.getMyPosts();
    for (const post of myPosts) {
      repliedPostIds.add(post.id);
    }
    console.log(`[Forum] Seeded ${myPosts.length} own post IDs to skip`);
  } catch {
    console.log('[Forum] Could not fetch own posts, continuing anyway');
  }

  // Initial check
  await checkAndReply();

  // Schedule recurring checks
  console.log(`\n[Forum] Checking every ${FORUM_CHECK_INTERVAL_MS / 1000 / 60} minutes`);
  console.log('[Forum] Press Ctrl+C to stop\n');

  setInterval(checkAndReply, FORUM_CHECK_INTERVAL_MS);

  process.on('SIGINT', () => {
    console.log('\n[Forum] Shutting down...');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
