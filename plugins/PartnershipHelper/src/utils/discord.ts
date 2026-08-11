import { findByProps, findByStoreName } from "@vendetta/metro";
import { log, warn } from "./logger";

export const FluxDispatcher = findByProps("dispatch", "subscribe");
export const SelectedChannelStore = findByStoreName("SelectedChannelStore");
export const ChannelStore = findByStoreName("ChannelStore");
export const GuildStore = findByStoreName("GuildStore");
export const UserStore = findByStoreName("UserStore");

const PrivateChannelActions =
    findByProps("openPrivateChannel") ?? findByProps("selectPrivateChannel");
const RootNav = findByProps("getRootNavigationRef");

const ProfileActions =
    findByProps("openUserProfile") ?? findByProps("showUserProfile") ?? findByProps("fetchProfile");

/**
 * WAŻNE: te akcje najczęściej oczekują TABLICY user ID (np. bo obsługują też
 * grupowe DM-y), nie gołego stringa. Podanie samego stringa powoduje że JS
 * iteruje po pojedynczych znakach ID jako "userach" — stąd bezsensowne,
 * puste grupy zamiast 1:1 DM-a.
 */
export function openDM(userId: string, onChannelResolved?: (channelId: string) => void) {
    try {
        log("openDM: PrivateChannelActions keys =", JSON.stringify(Object.keys(PrivateChannelActions ?? {})));
    } catch { /* ignore */ }

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

        // openChannel() zdaje się tylko tworzyć/aktualizować stan, ale nie
        // przełączać widocznego ekranu na mobile. Dokładamy jawną nawigację
        // tym samym wzorcem co sprawdzony w ServerDrawer dla serwerów.
        try {
            RootNav?.getRootNavigationRef?.()?.navigate("guilds", { guildId: null, channelId });
            log("openDM: RootNav.navigate() wywołany dla", channelId);
        } catch (e) {
            warn("openDM: RootNav.navigate() rzucił błąd:", e);
        }

        try { onChannelResolved?.(channelId); } catch { /* ignore */ }
    };

    const hasEnsure = !!(PrivateChannelActions?.getOrEnsurePrivateChannel ?? PrivateChannelActions?.ensurePrivateChannel);

    if (hasEnsure) {
        try {
            // WAŻNE: wołamy metodę BEZPOŚREDNIO na obiekcie (nie przez
            // oderwaną zmienną) — inaczej metoda traci swój `this` w środku.
            const result = PrivateChannelActions.getOrEnsurePrivateChannel
                ? PrivateChannelActions.getOrEnsurePrivateChannel(userId)
                : PrivateChannelActions.ensurePrivateChannel(userId);

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

export function getCurrentUserId(): string | null {
    try {
        return UserStore?.getCurrentUser?.()?.id ?? null;
    } catch {
        return null;
    }
}

/**
 * Nie usuwamy wpisu od razu po kliknięciu "Wyślij wiadomość" — czekamy aż
 * user FAKTYCZNIE coś napisze w tym konkretnym DM-ie (nasłuch na
 * MESSAGE_CREATE autorstwa nas samych w tym kanale). Auto-sprzątanie po
 * 30 minutach na wypadek gdyby user nic nie wysłał.
 */
export function watchForSentMessage(channelId: string, onSent: () => void) {
    const myId = getCurrentUserId();
    if (!myId || !FluxDispatcher?.subscribe) {
        warn("watchForSentMessage: brak currentUserId lub FluxDispatcher — usuwam wpis od razu jako fallback");
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
            log("watchForSentMessage: wykryto wysłaną wiadomość w", channelId);
            onSent();
        }
    };

    FluxDispatcher.subscribe("MESSAGE_CREATE", handler);

    setTimeout(() => {
        if (!done) {
            done = true;
            FluxDispatcher.unsubscribe("MESSAGE_CREATE", handler);
            warn("watchForSentMessage: timeout (30 min), przestałem czekać na", channelId);
        }
    }, 30 * 60 * 1000);
}

/**
 * Sprawdza czy mamy już otwarty/istniejący kanał DM z tym userem —
 * przybliżony sygnał "czy kiedyś pisaliśmy", bez skanowania pełnej
 * historii wiadomości (kosztowne przy 100+ wpisach naraz).
 */
export function hasExistingConversation(userId: string): boolean {
    try {
        const channelId = ChannelStore?.getDMFromUserId?.(userId);
        return !!channelId;
    } catch {
        return false;
    }
}

const UserProfileStore = findByStoreName("UserProfileStore");

/**
 * UWAGA — SZCZERZE: to jest heurystyka, nie pewność. Sprawdzamy czy po
 * chwili UserProfileStore ma jakiekolwiek dane dla tego usera. Nie mam
 * live-dostępu żeby zweryfikować że to faktycznie odzwierciedla "profil
 * widoczny na ekranie" — jeśli to będzie dawać fałszywe alarmy albo
 * przepuszczać prawdziwe błędy, powiedz co widzisz w Configure i to
 * dopracujemy, zamiast teraz zgadywać głębiej bez potwierdzenia.
 */
export function openProfile(userId: string, onResult?: (success: boolean) => void) {
    let called = false;
    try {
        if (ProfileActions?.openUserProfile) {
            ProfileActions.openUserProfile({ userId });
            called = true;
        } else if (ProfileActions?.showUserProfile) {
            ProfileActions.showUserProfile({ userId });
            called = true;
        }
    } catch (e) {
        warn("openProfile error:", e);
    }

    if (!called) {
        onResult?.(false);
        return false;
    }

    if (onResult) {
        setTimeout(() => {
            try {
                const hasData = !!UserProfileStore?.getUserProfile?.(userId);
                log("openProfile: heurystyka po 700ms, hasData =", hasData);
                onResult(hasData);
            } catch (e) {
                warn("openProfile: błąd heurystyki weryfikacji:", e);
                onResult(true); // nie chcemy fałszywego alarmu jak sama weryfikacja padnie
            }
        }, 700);
    }

    return true;
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

export const RelationshipStore = findByStoreName("RelationshipStore");
const RelationshipActions = findByProps("addRelationship", "removeRelationship") ?? findByProps("addRelationship");

export function isFriend(userId: string): boolean {
    try {
        // Typ 1 = znajomy w wewnętrznym enumie Discorda; niektóre buildy mają
        // gotowe isFriend(), inne trzeba sprawdzić przez getRelationshipType.
        if (RelationshipStore?.isFriend) return !!RelationshipStore.isFriend(userId);
        if (RelationshipStore?.getRelationshipType) return RelationshipStore.getRelationshipType(userId) === 1;
        return false;
    } catch {
        return false;
    }
}

export function addFriend(userId: string): boolean {
    try {
        log("addFriend: RelationshipActions keys =", JSON.stringify(Object.keys(RelationshipActions ?? {})));
    } catch { /* ignore */ }

    if (RelationshipActions?.addRelationship) {
        try {
            RelationshipActions.addRelationship(userId, { type: 1 });
            log("addFriend: wysłano zaproszenie (addRelationship+{type:1}) do", userId);
            return true;
        } catch (e) {
            warn("addFriend: addRelationship({type:1}) rzuciło błąd:", e);
        }
    }
    if (RelationshipActions?.updateRelationship) {
        try {
            RelationshipActions.updateRelationship(userId, 1);
            log("addFriend: wysłano zaproszenie (updateRelationship) do", userId);
            return true;
        } catch (e) {
            warn("addFriend: updateRelationship(userId,1) rzuciło błąd:", e);
        }
    }
    warn("addFriend: żadna metoda nie zadziałała");
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
