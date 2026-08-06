import { patchAnchor } from "./patches/anchor";
import { patchMessageMenu } from "./patches/messageMenu";
import { stopRecording } from "./utils/recorder";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

const cleanups: (() => void)[] = [];

export default {
    onLoad() {
        console.log("[PartnershipHelper] onLoad start");

        let hostOk = false;
        try {
            hostOk = patchAnchor(cleanups);
        } catch (e) {
            console.log("[PartnershipHelper] patchAnchor top-level error:", e);
        }

        let menuOk = false;
        try {
            menuOk = patchMessageMenu(cleanups);
        } catch (e) {
            console.log("[PartnershipHelper] patchMessageMenu top-level error:", e);
        }

        try {
            if (!menuOk) {
                showToast(
                    "Partnership Helper: nie udało się spatchować menu wiadomości",
                    getAssetIDByName("ic_warning_24px"),
                );
            } else {
                showToast(
                    "Partnership Helper załadowany — przytrzymaj wiadomość",
                    getAssetIDByName("ic_information_24px"),
                );
            }
        } catch { /* ignore */ }

        console.log("[PartnershipHelper] onLoad done, hostOk =", hostOk, "menuOk =", menuOk);
    },
    onUnload() {
        stopRecording();
        for (const fn of cleanups) {
            try { fn(); } catch (e) { console.log("[PartnershipHelper] cleanup error:", e); }
        }
        cleanups.length = 0;
    },
};
