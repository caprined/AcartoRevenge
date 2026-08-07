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

    // UWAGA: nie próbujemy wielu wariantów w pętli jeśli żaden nie rzuca
    // błędu — mogłoby to odpalić kilka różnych akcji Discorda naraz (kilka
    // kanałów/grup) przy jednym kliknięciu. Próbujemy NAJBARDZIEJ
    // prawdopodobnego kształtu, z fallbackiem tylko gdy faktycznie rzuci wyjątek.
    if (PrivateChannelActions?.openPrivateChannel) {
        const fn = PrivateChannelActions.openPrivateChannel;
        try {
            fn({ recipients: [userId] });
            log("openDM: wywołano openPrivateChannel({recipients:[userId]})");
            return true;
        } catch (e) {
            warn("openDM: {recipients} rzuciło błąd, próbuję [userId]:", e);
            try {
                fn([userId]);
                log("openDM: wywołano openPrivateChannel([userId])");
                return true;
            } catch (e2) {
                warn("openDM: [userId] też rzuciło błąd:", e2);
            }
        }
    }

    if (PrivateChannelActions?.selectPrivateChannel) {
        try {
            PrivateChannelActions.selectPrivateChannel(userId);
            log("openDM: użyto selectPrivateChannel(userId)");
            return true;
        } catch (e) {
            warn("openDM: selectPrivateChannel error:", e);
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
