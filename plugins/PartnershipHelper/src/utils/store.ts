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
    // Sortowanie wg. czasu WYSŁANIA reklamy (im wcześniejszy, tym wyżej) —
    // nie wg. kiedy MY ją znaleźliśmy scrollując.
    return Object.values(reviews).sort((a, b) => a.timestamp - b.timestamp);
}

export function hasReview(userId: string): boolean {
    return !!ensure()[userId];
}

export function clearAllReviews() {
    storage.reviews = {};
}
