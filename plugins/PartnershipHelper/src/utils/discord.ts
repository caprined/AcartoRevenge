import { findByProps, findByStoreName } from "@vendetta/metro";
import { log, warn } from "./logger";

export const FluxDispatcher = findByProps("dispatch", "subscribe");
export const SelectedChannelStore = findByStoreName("SelectedChannelStore");
export const ChannelStore = findByStoreName("ChannelStore");
export const GuildStore = findByStoreName("GuildStore");
export const UserStore = findByStoreName("UserStore");

const PrivateChannelActions =
    findByProps("openPrivateChannel") ?? findByProps("selectPrivateChannel");

const ProfileActions =
    findByProps("openUserProfile") ?? findByProps("showUserProfile") ?? findByProps("fetchProfile");

/**
 * WAŻNE: te akcje najczęściej oczekują TABLICY user ID (np. bo obsługują też
 * grupowe DM-y), nie gołego stringa. Podanie samego stringa powoduje że JS
 * iteruje po pojedynczych znakach ID jako "userach" — stąd bezsensowne,
 * puste grupy zamiast 1:1 DM-a.
 */
export function openDM(userId: string) {
    try {
        log("openDM: PrivateChannelActions keys =", JSON.stringify(Object.keys(PrivateChannelActions ?? {})));
    } catch { /* ignore */ }

    const ensureFn =
        PrivateChannelActions?.getOrEnsurePrivateChannel ?? PrivateChannelActions?.ensurePrivateChannel;

    const navigateTo = (channelId: string) => {
        try {
            if (PrivateChannelActions?.openChannel) {
                PrivateChannelActions.openChannel(channelId);
                log("openDM: openChannel() wywołany dla", channelId);
            } else {
                warn("openDM: brak openChannel do nawigacji");
            }
        } catch (e) {
            warn("openDM: openChannel() rzucił błąd:", e);
        }
    };

    if (ensureFn) {
        try {
            const result = ensureFn(userId);
            log("openDM: ensure() zwrócił typeof =", typeof result);

            if (result && typeof (result as any).then === "function") {
                (result as Promise<any>)
                    .then((ch: any) => navigateTo(ch?.id ?? ch))
                    .catch((e: any) => warn("openDM: ensure() promise reject:", e));
                return true;
            }
            if (result && typeof result === "object" && (result as any).id) {
                navigateTo((result as any).id);
                return true;
            }
            if (typeof result === "string") {
                navigateTo(result);
                return true;
            }
            warn("openDM: nierozpoznany kształt wyniku ensure(), spróbuj Configure po kolejnej próbie");
        } catch (e) {
            warn("openDM: ensure() rzucił błąd:", e);
        }
    }

    // Fallback — stary wariant, na wszelki wypadek
    if (PrivateChannelActions?.openPrivateChannel) {
        try {
            PrivateChannelActions.openPrivateChannel({ recipients: [userId] });
            log("openDM: fallback openPrivateChannel({recipients})");
            return true;
        } catch (e) {
            warn("openDM: fallback też rzucił błąd:", e);
        }
    }

    warn("openDM: żaden wariant nie zadziałał");
    return false;
}

export function openProfile(userId: string) {
    try {
        if (ProfileActions?.openUserProfile) {
            ProfileActions.openUserProfile({ userId });
            return true;
        }
        if (ProfileActions?.showUserProfile) {
            ProfileActions.showUserProfile({ userId });
            return true;
        }
    } catch (e) {
        warn("openProfile error:", e);
    }
    return false;
}

const fetchAttempted = new Set<string>();

/**
 * Discord trzyma w UserStore tylko userów "widzianych ostatnio" (znajomi,
 * aktywne DM-y, aktualnie renderowane wiadomości). Po restarcie appki losowi
 * userzy z reklam wypadają z cache. Tu próbujemy ich aktywnie dociągnąć.
 */
export function fetchUserIfMissing(userId: string) {
    if (UserStore?.getUser?.(userId)) return; // już mamy
    if (fetchAttempted.has(userId)) return;
    fetchAttempted.add(userId);

    const candidates = [
        () => findByProps("fetchProfile")?.fetchProfile?.(userId),
        () => findByProps("getUser", "fetchProfile")?.fetchProfile?.(userId),
        () => findByProps("fetchUser")?.fetchUser?.(userId),
    ];

    for (const attempt of candidates) {
        try {
            const r = attempt();
            if (r) {
                log("fetchUserIfMissing: zainicjowano fetch dla", userId);
                return;
            }
        } catch (e) {
            // próbuj kolejnej
        }
    }
    warn("fetchUserIfMissing: żadna metoda fetch nie zadziałała dla", userId);
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

export function getDisplayName(userId: string): { displayName: string; username: string; found: boolean } {
    try {
        const user = UserStore?.getUser?.(userId);
        if (!user) return { displayName: "Nieznany user", username: userId, found: false };
        return {
            displayName: user.globalName || user.global_name || user.username || userId,
            username: user.username || userId,
            found: true,
        };
    } catch {
        return { displayName: "Nieznany user", username: userId, found: false };
    }
}
