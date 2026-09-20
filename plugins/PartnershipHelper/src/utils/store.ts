import { storage } from "@vendetta/plugin";

export interface ReviewEntry {
    userId: string;
    guildId: string;
    guildName: string;
    channelId: string;
    timestamp: number; // ms epoch - kiedy WIADOMOŚĆ z reklamą została wysłana
    foundAt: number; // ms epoch - kiedy MY ją znaleźliśmy (scrollując)
}

const listeners = new Set<() => void>();

function notify() {
    for (const listener of listeners) {
        try {
            listener();
        } catch {
            // ignore listener errors
        }
    }
}

// storage.reviews: Record<userId, ReviewEntry>
function ensure() {
    if (!storage.reviews || typeof storage.reviews !== "object") {
        storage.reviews = {};
    }
    return storage.reviews as Record<string, ReviewEntry>;
}

export function subscribeStore(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function addReview(entry: ReviewEntry): boolean {
    const reviews = ensure();
    if (reviews[entry.userId]) return false; // antyduplikacja - już mamy tego usera
    reviews[entry.userId] = entry;
    notify();
    return true;
}

export function removeReview(userId: string) {
    const reviews = ensure();
    delete reviews[userId];
    notify();
}

export function getReviews(): ReviewEntry[] {
    const reviews = ensure();
    // Najnowsze (najpóźniej wysłane) na górze.
    return Object.values(reviews).sort((a, b) => b.timestamp - a.timestamp);
}

export function hasReview(userId: string): boolean {
    return !!ensure()[userId];
}

export function clearAllReviews() {
    storage.reviews = {};
    notify();
}
