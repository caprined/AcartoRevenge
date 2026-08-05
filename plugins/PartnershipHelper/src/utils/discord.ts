import { findByProps, findByStoreName } from "@vendetta/metro";

export const FluxDispatcher = findByProps("dispatch", "subscribe");
export const SelectedChannelStore = findByStoreName("SelectedChannelStore");
export const ChannelStore = findByStoreName("ChannelStore");
export const GuildStore = findByStoreName("GuildStore");
export const UserStore = findByStoreName("UserStore");

const PrivateChannelActions =
    findByProps("openPrivateChannel") ?? findByProps("selectPrivateChannel");

export function openDM(userId: string) {
    try {
        if (PrivateChannelActions?.openPrivateChannel) {
            PrivateChannelActions.openPrivateChannel(userId);
            return true;
        }
        if (PrivateChannelActions?.selectPrivateChannel) {
            PrivateChannelActions.selectPrivateChannel(userId);
            return true;
        }
    } catch (e) {
        console.log("[PartnershipHelper] openDM error:", e);
    }
    return false;
}

const MENTION_RE = /<@!?(\d+)>/g;

export function extractMentionedUserIds(content: string): string[] {
    if (!content) return [];
    const ids: string[] = [];
    let m: RegExpExecArray | null;
    MENTION_RE.lastIndex = 0;
    while ((m = MENTION_RE.exec(content))) {
        ids.push(m[1]);
    }
    return ids;
}

export function getGuildNameForChannel(channelId: string): { guildId: string; guildName: string } | null {
    try {
        const channel = ChannelStore?.getChannel?.(channelId);
        if (!channel?.guild_id) return null;
        const guild = GuildStore?.getGuild?.(channel.guild_id);
        return { guildId: channel.guild_id, guildName: guild?.name ?? "Nieznany serwer" };
    } catch {
        return null;
    }
}

export function getDisplayName(userId: string): { displayName: string; username: string } {
    try {
        const user = UserStore?.getUser?.(userId);
        if (!user) return { displayName: "Nieznany user", username: userId };
        return {
            displayName: user.globalName || user.global_name || user.username || userId,
            username: user.username || userId,
        };
    } catch {
        return { displayName: "Nieznany user", username: userId };
    }
}
