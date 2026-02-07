#!/usr/bin/env npx tsx

/**
 * Standalone Heartbeat Runner
 *
 * Runs independently of the energy market engine.
 * Monitors Colosseum hackathon status, polls, forum activity, etc.
 *
 * Usage: npx tsx src/heartbeat-runner.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from hackathon root
config({ path: resolve(process.cwd(), '../.env') });

import { runHeartbeat, colosseumAPI } from './colosseum/index.js';
import { COLOSSEUM_ENABLED, HEARTBEAT_INTERVAL_MS } from './config.js';

const QUICK_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes for quick checks

async function main() {
  console.log('=== SolGrid Heartbeat Monitor ===\n');

  if (!COLOSSEUM_ENABLED) {
    console.error('ERROR: COLOSSEUM_API_KEY not set in .env');
    console.error('Heartbeat requires Colosseum API access.');
    process.exit(1);
  }

  // Initial full heartbeat
  await runHeartbeat();

  // Set up intervals
  console.log(`\n[Monitor] Full heartbeat every ${HEARTBEAT_INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`[Monitor] Quick poll check every ${QUICK_CHECK_INTERVAL_MS / 1000 / 60} minutes`);
  console.log('[Monitor] Press Ctrl+C to stop\n');

  // Full heartbeat every 30 minutes
  setInterval(async () => {
    await runHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);

  // Quick poll check every 5 minutes
  setInterval(async () => {
    try {
      const status = await colosseumAPI.getStatus();
      if (status.hasActivePoll) {
        const poll = await colosseumAPI.getActivePoll();
        if (poll) {
          const expiresAt = new Date(poll.poll.activeUntil);
          const now = new Date();
          const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

          if (hoursLeft < 2) {
            console.log(`\n[Monitor] URGENT: Poll "${poll.poll.title}" expires in ${hoursLeft.toFixed(1)} hours!`);
          }
        }
      }

      // Check for replies on our posts
      if (status.engagement.repliesOnYourPosts > 0) {
        console.log(`[Monitor] You have ${status.engagement.repliesOnYourPosts} replies on your posts`);
      }
    } catch (err) {
      // Silent fail for quick checks
    }
  }, QUICK_CHECK_INTERVAL_MS);

  // Keep process running
  process.on('SIGINT', () => {
    console.log('\n[Monitor] Shutting down...');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
