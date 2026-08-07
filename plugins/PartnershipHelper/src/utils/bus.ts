import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { log, warn } from "./logger";

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
    listeners.add(fn);
    log("bus: subscriber dodany, teraz jest ich", listeners.size);
    return () => listeners.delete(fn);
}

export function openReadScreen() {
    log("bus: openReadScreen() wywołany, liczba subskrybentów =", listeners.size);
    if (listeners.size === 0) {
        warn("bus: BRAK subskrybentów — ReadScreenHost się nie zamontował. Zmień serwer/kanał i spróbuj ponownie.");
        showToast(
            "Odczyt: zmień serwer raz i spróbuj ponownie (host się jeszcze nie zamontował)",
            getAssetIDByName("ic_warning_24px"),
        );
        return;
    }
    for (const fn of listeners) {
        try { fn(); } catch (e) { warn("bus listener error:", e); }
    }
}
