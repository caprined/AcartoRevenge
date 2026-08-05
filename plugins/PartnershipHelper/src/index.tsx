import { patchAnchor } from "./patches/anchor";
import { stopRecording } from "./utils/recorder";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

const cleanups: (() => void)[] = [];

export default {
    onLoad() {
        console.log("[PartnershipHelper] onLoad start");
        let ok = false;
        try {
            ok = patchAnchor(cleanups);
        } catch (e) {
            console.log("[PartnershipHelper] patchAnchor top-level error:", e);
        }

        try {
            if (!ok) {
                showToast(
                    "Partnership Helper: nie znalazłem miejsca zaczepienia",
                    getAssetIDByName("ic_warning_24px"),
                );
            }
        } catch { /* ignore */ }

        console.log("[PartnershipHelper] onLoad done, ok =", ok);
    },
    onUnload() {
        stopRecording();
        for (const fn of cleanups) {
            try { fn(); } catch (e) { console.log("[PartnershipHelper] cleanup error:", e); }
        }
        cleanups.length = 0;
    },
};
