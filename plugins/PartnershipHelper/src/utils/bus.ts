type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function openReadScreen() {
    for (const fn of listeners) {
        try { fn(); } catch (e) { console.log("[PartnershipHelper] bus listener error:", e); }
    }
}
