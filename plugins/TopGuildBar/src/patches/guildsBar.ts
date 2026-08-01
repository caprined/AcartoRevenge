import React from "react";
import { find, findByName } from "@vendetta/metro";
import { registerIntercept } from "./createElementIntercept";
import HorizontalTopBar from "../components/HorizontalTopBar";

const TAG = "[TopGuildBar]";

function findGuildsBarModule(): any {
    const byName = findByName("GuildsBar");
    if (byName) return { default: byName };

    let mod = find((m) => {
        try { return m?.default?.type?.name === "GuildsBar"; } catch { return false; }
    });
    if (mod?.default) return mod;

    mod = find((m) => {
        try { return m?.default?.displayName === "GuildsBar"; } catch { return false; }
    });
    if (mod?.default) return mod;

    return null;
}

/**
 * Zamienia GuildsBar (pionowy pasek) na nasz poziomy HorizontalTopBar.
 *
 * UWAGA (etap 1/2): to podmienia TREŚĆ starego slotu, ale nie gwarantuje
 * jeszcze że slot rozciągnie się na pełną szerokość ekranu ani że zniknie
 * zarezerwowane po lewej miejsce — to zależy od tego, jak rodzic tego
 * komponentu układa flex/width, czego nie widać bez live-inspekcji.
 * Log poniżej (measured size) pokaże nam realną szerokość/wysokość slotu
 * na Twoim telefonie — na tej podstawie dopniemy drugi etap patcha.
 */
export function patchGuildsBar(cleanups: (() => void)[]): boolean {
    const mod = findGuildsBarModule();
    if (!mod?.default) {
        console.log(TAG, "WARN: GuildsBar nie znaleziony — wyślij mi log konsoli Revenge (Settings > Developer)");
        return false;
    }
    const orig = mod.default;

    registerIntercept(orig, HorizontalTopBar);

    mod.default = function TopGuildBarPatch() {
        return React.createElement(HorizontalTopBar);
    };
    mod.default.displayName = "GuildsBar";

    cleanups.push(() => { mod.default = orig; });
    console.log(TAG, "PATCH: GuildsBar zastąpiony przez HorizontalTopBar");
    return true;
}
