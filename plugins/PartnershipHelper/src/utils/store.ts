import { storage } from "@vendetta/plugin";

export interface ReviewEntry {
    userId: string;
    guildId: string;
    guildName: string;
    channelId: string;
    timestamp: number; // ms epoch - kiedy WIADOMOŚĆ z reklamą została wysłana
    foundAt: number; // ms epoch - kiedy MY ją znaleźliśmy (scrollując)
}

// storage.reviews: Record<userId, ReviewEntry>
function ensure() {
    if (!storage.reviews || typeof storage.reviews !== "object") {
        storage.reviews = {};
    }
    return storage.reviews as Record<string, ReviewEntry>;
}

export function addReview(entry: ReviewEntry): boolean {
    const reviews = ensure();
    if (reviews[entry.userId]) return false; // antyduplikacja - już mamy tego usera
    reviews[entry.userId] = entry;
    return true;
}

export function removeReview(userId: string) {
    const reviews = ensure();
    delete reviews[userId];
}

export function getReviews(): ReviewEntry[] {
    const reviews = ensure();
    // Najnowsze (najpóźniej wysłane) na górze.
    return Object.values(reviews).sort((a, b) => b.timestamp - a.timestamp);
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Usuwa wpisy starsze niż 7 dni (licząc od czasu WYSŁANIA reklamy). */
export function cleanupOldReviews(): number {
    const reviews = ensure();
    const now = Date.now();
    let removed = 0;
    for (const key of Object.keys(reviews)) {
        if (now - reviews[key].timestamp > SEVEN_DAYS_MS) {
            delete reviews[key];
            removed++;
        }
    }
    return removed;
}

export function hasReview(userId: string): boolean {
    return !!ensure()[userId];
}

export function clearAllReviews() {
    storage.reviews = {};
}
