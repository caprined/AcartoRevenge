import { patchCreateElement } from "./patches/createElementIntercept";
import { patchGuildsBar } from "./patches/guildsBar";
import { probeLayoutContainers } from "./patches/discovery";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { log, warn, error as logError } from "./utils/logger";
import LogsScreen from "./components/LogsScreen";

const cleanups: (() => void)[] = [];

export default {
    onLoad() {
        log("onLoad start");

        try {
            patchCreateElement(cleanups);
        } catch (e) {
            logError("patchCreateElement() wywalił się:", e);
        }

        let ok = false;
        try {
            ok = patchGuildsBar(cleanups);
        } catch (e) {
            logError("patchGuildsBar() wywalił się (górny poziom):", e);
        }

        try {
            if (!ok) {
                showToast(
                    "TopGuildBar: problem przy starcie, zobacz Configure",
                    getAssetIDByName("ic_warning_24px"),
                );
            } else {
                showToast(
                    "TopGuildBar załadowany — sprawdź Configure jeśli coś nie gra",
                    getAssetIDByName("ic_information_24px"),
                );
            }
        } catch (e) {
            logError("showToast() wywalił się:", e);
        }

        try {
            probeLayoutContainers();
        } catch (e) {
            logError("probeLayoutContainers() wywalił się:", e);
        }

        log("onLoad done, ok =", ok);
    },
    onUnload() {
        log("onUnload");
        for (const fn of cleanups) {
            try { fn(); } catch (e) { logError("cleanup() wywalił się:", e); }
        }
        cleanups.length = 0;
    },
    settings: LogsScreen,
};
