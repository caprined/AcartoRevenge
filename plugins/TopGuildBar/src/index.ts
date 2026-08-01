import { patchCreateElement } from "./patches/createElementIntercept";
import { patchGuildsBar } from "./patches/guildsBar";
import { probeLayoutContainers } from "./patches/discovery";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

const TAG = "[TopGuildBar]";
const cleanups: (() => void)[] = [];

export default {
    onLoad() {
        console.log(TAG, "onLoad start");

        patchCreateElement(cleanups);

        const ok = patchGuildsBar(cleanups);

        if (!ok) {
            showToast(
                "TopGuildBar: nie znalazłem GuildsBar, sprawdź konsolę Revenge",
                getAssetIDByName("ic_warning_24px"),
            );
        } else {
            showToast(
                "TopGuildBar załadowany — jeśli layout wygląda źle, wyślij mi logi",
                getAssetIDByName("ic_information_24px"),
            );
        }

        // Diagnostyka do etapu 2 (usuwanie lewego offsetu) — nie patchuje niczego,
        // tylko loguje potencjalnych kandydatów na kontener layoutu.
        probeLayoutContainers();

        console.log(TAG, "onLoad done");
    },
    onUnload() {
        console.log(TAG, "onUnload");
        for (const fn of cleanups) fn();
        cleanups.length = 0;
    },
};
