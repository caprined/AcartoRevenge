import { findByProps, findByStoreName } from "@vendetta/metro";
import { log, warn } from "./logger";

export const FluxDispatcher = findByProps("dispatch", "subscribe");
export const UserStore = findByStoreName("UserStore");
export const GuildStore = findByStoreName("GuildStore");
export const ChannelStore = findByStoreName("ChannelStore");
export const SelectedChannelStore = findByStoreName("SelectedChannelStore");
export const PresenceStore = findByStoreName("PresenceStore");
export const RelationshipStore = findByStoreName("RelationshipStore");

const PrivateChannelActions =
  findByProps("openPrivateChannel") ?? findByProps("selectPrivateChannel") ?? findByProps("openChannel");

const RootNav = findByProps("getRootNavigationRef");

export function getCurrentUserId(): string | null {
  try {
    return UserStore?.getCurrentUser?.()?.id ?? null;
  } catch {
    return null;
  }
}

export function getUser(userId: string): any {
  try {
    return UserStore?.getUser?.(userId) ?? null;
  } catch {
    return null;
  }
}

export function getDisplayName(userId: string): { displayName: string; username: string; avatar?: string | null } {
  const user = getUser(userId);
  const displayName = user?.globalName ?? user?.username ?? "Unknown User";
  const username = user?.username ?? "unknown";
  const avatar = user?.avatar ?? user?.avatarURL ?? null;
  return { displayName, username, avatar };
}

export function extractMentionedUserIds(content: string): string[] {
  if (!content || typeof content !== "string") return [];
  const matches = content.match(/<@!(\d+)>|<@(\d+)>/g) ?? [];
  const ids: string[] = [];

  for (const match of matches) {
    const cleaned = match.replace(/[<@!>]/g, "");
    if (cleaned && !ids.includes(cleaned)) ids.push(cleaned);
  }

  return ids;
}

export function getGuildNameForChannel(channelId: string): { guildId: string; guildName: string; serverLink: string } | null {
  try {
    const channel = ChannelStore?.getChannel?.(channelId) ?? ChannelStore?.getDMFromUserId?.(channelId);
    if (!channel?.guild_id && !channel?.guildId) return null;
    const guildId = channel.guild_id ?? channel.guildId;
    const guild = GuildStore?.getGuild?.(String(guildId));
    const guildName = guild?.name ?? "Unknown Server";
    const serverLink = `https://discord.com/channels/${guildId}/${channelId}`;
    return { guildId: String(guildId), guildName, serverLink };
  } catch {
    return null;
  }
}

export function openDM(userId: string, onChannelResolved?: (channelId: string) => void) {
  const navigateTo = (channelId: string) => {
    try {
      if (PrivateChannelActions?.openChannel) {
        PrivateChannelActions.openChannel(channelId);
      }
      RootNav?.getRootNavigationRef?.()?.navigate("guilds", { guildId: null, channelId });
    } catch (e) {
      warn("openDM navigation failed:", e);
    }
    onChannelResolved?.(channelId);
  };

  const ensure = PrivateChannelActions?.getOrEnsurePrivateChannel ?? PrivateChannelActions?.ensurePrivateChannel;
  if (ensure) {
    try {
      const result = ensure.call(PrivateChannelActions, userId);
      if (result && typeof result.then === "function") {
        result.then((channel: any) => navigateTo(channel?.id ?? channel)).catch(() => {});
        return true;
      }
      if (result && typeof result === "object" && result.id) {
        navigateTo(result.id);
        return true;
      }
      if (typeof result === "string") {
        navigateTo(result);
        return true;
      }
    } catch (e) {
      warn("openDM ensure failed:", e);
    }
  }

  if (PrivateChannelActions?.openPrivateChannel) {
    try {
      PrivateChannelActions.openPrivateChannel({ recipients: [userId] });
      return true;
    } catch (e) {
      warn("openDM openPrivateChannel failed:", e);
    }
  }

  warn("openDM: no working private channel action found");
  return false;
}

export function watchForSentMessage(channelId: string, onSent: () => void) {
  const myId = getCurrentUserId();
  if (!myId || !FluxDispatcher?.subscribe) {
    onSent();
    return;
  }

  let done = false;
  const handler = (event: any) => {
    if (done) return;
    if (event?.type !== "MESSAGE_CREATE") return;
    const msg = event.message;
    if (msg?.channel_id === channelId && msg?.author?.id === myId) {
      done = true;
      FluxDispatcher.unsubscribe("MESSAGE_CREATE", handler);
      onSent();
    }
  };

  FluxDispatcher.subscribe("MESSAGE_CREATE", handler);
  setTimeout(() => {
    if (!done) {
      done = true;
      FluxDispatcher.unsubscribe("MESSAGE_CREATE", handler);
    }
  }, 30 * 60 * 1000);
}

export function isFriend(userId: string): boolean {
  try {
    if (RelationshipStore?.isFriend) return !!RelationshipStore.isFriend(userId);
    if (RelationshipStore?.getRelationshipType) return RelationshipStore.getRelationshipType(userId) === 1;
    return false;
  } catch {
    return false;
  }
}

export function addFriend(userId: string): boolean {
  const actions = findByProps("addRelationship");
  if (actions?.addRelationship) {
    try {
      actions.addRelationship(userId, { type: 1 });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function getAvatarUri(userId: string): string | null {
  try {
    const user = getUser(userId);
    if (!user) return null;
    if (user.getAvatarURL) return user.getAvatarURL();
    if (user.avatar) return user.avatar;
    return null;
  } catch {
    return null;
  }
}

export function isUserActive(userId: string): boolean {
  try {
    if (PresenceStore?.getPresence) {
      const presence = PresenceStore.getPresence(userId);
      return !!presence?.status && presence.status !== "offline";
    }
    return false;
  } catch {
    return false;
  }
}

export function fetchUserIfMissing(userId: string) {
  try {
    if (UserStore?.getUser?.(userId)) return;
  } catch {
    // ignore
  }

  try {
    const fetchProfile = findByProps("fetchProfile")?.fetchProfile;
    if (fetchProfile) fetchProfile(userId);
  } catch {
    // ignore
  }
}
