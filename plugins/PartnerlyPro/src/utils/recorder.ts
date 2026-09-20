import { FluxDispatcher, SelectedChannelStore, getCurrentUserId, getGuildNameForChannel, extractMentionedUserIds } from "./discord";
import { addEntry } from "./store";
import { log } from "./logger";

let active = false;
let onEventBound: ((event: any) => void) | null = null;
let sessionAddedCount = 0;

function toMillis(ts: any): number {
  try {
    if (typeof ts === "number") return ts;
    if (typeof ts === "string") return new Date(ts).getTime();
    if (ts?.valueOf) return ts.valueOf();
  } catch {
    // ignore
  }
  return Date.now();
}

function isCurrentChannel(channelId: string): boolean {
  try {
    return SelectedChannelStore?.getChannelId?.() === channelId;
  } catch {
    return true;
  }
}

function processMessage(message: any) {
  if (!message?.content || !message?.channel_id) return;
  if (!isCurrentChannel(message.channel_id)) return;

  const ids = extractMentionedUserIds(message.content);
  if (!ids.length) return;

  const guildInfo = getGuildNameForChannel(message.channel_id);
  if (!guildInfo) return;

  const myId = getCurrentUserId();
  const timestamp = toMillis(message.timestamp);

  for (const userId of ids) {
    if (myId && userId === myId) continue;

    const added = addEntry({
      userId,
      guildId: guildInfo.guildId,
      guildName: guildInfo.guildName,
      channelId: message.channel_id,
      serverLink: guildInfo.serverLink,
      timestamp,
      foundAt: Date.now(),
    });

    if (added) {
      sessionAddedCount++;
      log("captured user", userId, "from", guildInfo.guildName);
    }
  }
}

function onEvent(event: any) {
  try {
    if (event?.type === "LOAD_MESSAGES_SUCCESS" && Array.isArray(event.messages)) {
      for (const msg of event.messages) processMessage(msg);
    } else if (event?.type === "MESSAGE_CREATE" && event.message) {
      processMessage(event.message);
    }
  } catch (e) {
    console.log("[PartnerlyPro] recorder error:", e);
  }
}

export function startRecording() {
  if (active) return;
  active = true;
  sessionAddedCount = 0;
  onEventBound = onEvent;
  FluxDispatcher?.subscribe?.("LOAD_MESSAGES_SUCCESS", onEventBound);
  FluxDispatcher?.subscribe?.("MESSAGE_CREATE", onEventBound);
}

export function stopRecording() {
  if (!active) return;
  active = false;
  if (onEventBound) {
    FluxDispatcher?.unsubscribe?.("LOAD_MESSAGES_SUCCESS", onEventBound);
    FluxDispatcher?.unsubscribe?.("MESSAGE_CREATE", onEventBound);
  }
  onEventBound = null;
}

export function isRecording() {
  return active;
}

export function resetSessionCount() {
  sessionAddedCount = 0;
}

export function getSessionAddedCount() {
  return sessionAddedCount;
}
