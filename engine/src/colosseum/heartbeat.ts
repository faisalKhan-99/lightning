import { colosseumAPI, AgentStatus, ActivePoll } from './api.js';
import { COLOSSEUM_ENABLED, HEARTBEAT_INTERVAL_MS } from '../config.js';

interface HeartbeatState {
  lastCheck: Date | null;
  status: AgentStatus | null;
  activePoll: ActivePoll | null;
  respondedPolls: Set<number>;
  lastAnnouncementTitle: string | null;
}

const state: HeartbeatState = {
  lastCheck: null,
  status: null,
  activePoll: null,
  respondedPolls: new Set(),
  lastAnnouncementTitle: null,
};

function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${hours}h`;
}

export async function runHeartbeat(): Promise<void> {
  if (!COLOSSEUM_ENABLED) {
    console.log('[Heartbeat] Colosseum API key not configured, skipping');
    return;
  }

  console.log('\n[Heartbeat] ====== Colosseum Sync ======');

  try {
    // 1. Fetch agent status
    const status = await colosseumAPI.getStatus();
    state.status = status;
    state.lastCheck = new Date();

    // 2. Log hackathon status
    console.log(`[Heartbeat] Hackathon: ${status.hackathon.name}`);
    console.log(`[Heartbeat] Day ${status.hackathon.currentDay} | ${status.hackathon.timeRemainingFormatted}`);
    console.log(`[Heartbeat] Agent Status: ${status.status}`);

    // 3. Log engagement metrics
    console.log(`[Heartbeat] Engagement: ${status.engagement.forumPostCount} posts | Project: ${status.engagement.projectStatus}`);

    // 4. Check for announcements
    if (status.announcement && status.announcement.title !== state.lastAnnouncementTitle) {
      console.log(`[Heartbeat] NEW ANNOUNCEMENT: ${status.announcement.title}`);
      console.log(`[Heartbeat]   ${status.announcement.message}`);
      state.lastAnnouncementTitle = status.announcement.title;
    }

    // 5. Check for active polls
    if (status.hasActivePoll) {
      const poll = await colosseumAPI.getActivePoll();
      if (poll && !state.respondedPolls.has(poll.poll.id)) {
        state.activePoll = poll;
        console.log(`[Heartbeat] ACTIVE POLL: "${poll.poll.title}"`);
        console.log(`[Heartbeat]   ${poll.poll.prompt}`);
        console.log(`[Heartbeat]   Expires: ${new Date(poll.poll.activeUntil).toLocaleString()}`);
        // Note: We don't auto-respond, just notify. User should respond manually or we can add auto-response logic.
      }
    }

    // 6. Log next steps
    if (status.nextSteps.length > 0) {
      console.log('[Heartbeat] Next Steps:');
      status.nextSteps.forEach((step, i) => {
        console.log(`[Heartbeat]   ${i + 1}. ${step}`);
      });
    }

    // 7. Check project status and provide reminders
    if (status.engagement.projectStatus === 'none') {
      console.log('[Heartbeat] REMINDER: No project created yet!');
    }

    console.log('[Heartbeat] ========================\n');

  } catch (err) {
    console.error('[Heartbeat] Error:', err);
  }
}

export function markPollResponded(pollId: number): void {
  state.respondedPolls.add(pollId);
}

export function getHeartbeatState(): HeartbeatState {
  return { ...state };
}

export function startHeartbeatLoop(): void {
  if (!COLOSSEUM_ENABLED) {
    console.log('[Heartbeat] Disabled (no API key)');
    return;
  }

  console.log(`[Heartbeat] Starting heartbeat loop (interval: ${HEARTBEAT_INTERVAL_MS / 1000 / 60} minutes)`);

  // Run immediately on start
  runHeartbeat();

  // Then run periodically
  setInterval(() => {
    runHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
}

// Quick status check (lightweight, for more frequent polling)
export async function quickStatusCheck(): Promise<{
  daysRemaining: number;
  hasActivePoll: boolean;
  projectStatus: string;
} | null> {
  if (!COLOSSEUM_ENABLED) return null;

  try {
    const status = await colosseumAPI.getStatus();
    return {
      daysRemaining: status.hackathon.daysRemaining,
      hasActivePoll: status.hasActivePoll,
      projectStatus: status.engagement.projectStatus,
    };
  } catch {
    return null;
  }
}
