import { patchAnchor } from "./patches/anchor";
import { patchMessageMenu } from "./patches/messageMenu";
import { stopRecording } from "./utils/recorder";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { log, error as logError } from "./utils/logger";
import LogsScreen from "./components/LogsScreen";

const cleanups: (() => void)[] = [];

export default {
    onLoad() {
        log("onLoad start");

        let hostOk = false;
        try {
            hostOk = patchAnchor(cleanups);
        } catch (e) {
            logError("patchAnchor top-level error:", e);
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
                showToast(
                    "Partnership Helper załadowany — przytrzymaj wiadomość",
                    getAssetIDByName("ic_information_24px"),
                );
            }
        } catch { /* ignore */ }

        log("onLoad done, hostOk =", hostOk, "menuOk =", menuOk);
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
