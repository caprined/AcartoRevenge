import { patchMessageMenu } from "./patches/messageMenu";
import { stopRecording } from "./utils/recorder";
import { getReviews, cleanupOldReviews } from "./utils/store";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { log, error as logError } from "./utils/logger";
import LogsScreen from "./components/LogsScreen";

const cleanups: (() => void)[] = [];

export default {
    onLoad() {
        log("onLoad start");

        try {
            const removed = cleanupOldReviews();
            if (removed > 0) log(`cleanupOldReviews: usunięto ${removed} wpisów starszych niż 7 dni`);
        } catch (e) {
            logError("cleanupOldReviews error:", e);
        }

        let menuOk = false;
        try {
            menuOk = patchMessageMenu(cleanups);
        } catch (e) {
            logError("patchMessageMenu top-level error:", e);
        }

        try {
            if (!menuOk) {
                showToast(
                    "Partnership Helper: problem przy starcie, zobacz Configure",
                    getAssetIDByName("ic_warning_24px"),
                );
            } else {
                const count = getReviews().length;
                showToast(
                    `Załadowano ${count} ${count === 1 ? "wpis" : "wpisów"}`,
                    getAssetIDByName("ic_information_24px"),
                );
            }
        } catch { /* ignore */ }

        log("onLoad done, menuOk =", menuOk);
    },
    onUnload() {
        stopRecording();
        for (const fn of cleanups) {
            try { fn(); } catch (e) { logError("cleanup error:", e); }
        }
        cleanups.length = 0;
    },
    settings: LogsScreen,
};
