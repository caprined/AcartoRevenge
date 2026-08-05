import React from "react";
import { find, findByTypeName } from "@vendetta/metro";
import PartnershipOverlay from "../components/PartnershipOverlay";

const CANDIDATES = ["LaunchPadContainer", "AccessibilityPreferencesContextProvider", "KeyCommandsView"];

function findTargetMemo(): { memoObj: any; name: string } | null {
    for (const name of CANDIDATES) {
        try {
            const mod = findByTypeName(name);
            if (mod && typeof mod === "object" && "type" in mod) return { memoObj: mod, name };
        } catch (e) {
            console.log(`[PartnershipHelper] findByTypeName(${name}) error:`, e);
        }
        try {
            const mod = find((m) => {
                try { return m?.type?.name === name || m?.type?.displayName === name; } catch { return false; }
            });
            if (mod?.type) return { memoObj: mod, name };
        } catch (e) {
            console.log(`[PartnershipHelper] find(${name}) error:`, e);
        }
    }
    return null;
}

/**
 * Zaczep na LaunchPadContainer — komponent blisko korzenia appki (opakowuje
 * cały StackNavigator), NIE ma nic wspólnego z paskiem serwerów. Powinien
 * być widoczny na KAŻDYM ekranie appki, nie tylko wewnątrz serwera.
 *
 * Patchujemy .type (nie .default) w miejscu, bo komponent jest prawdopodobnie
 * opakowany w React.memo — dokładnie ta sama poprawka co zadziałała
 * na GuildsBar dziś wieczorem przez żywe devtoolsy.
 */
export function patchAnchor(cleanups: (() => void)[]): boolean {
    try {
        const found = findTargetMemo();
        if (!found) {
            console.log("[PartnershipHelper] żaden z kandydatów nie znaleziony:", CANDIDATES.join(", "));
            return false;
        }
        const { memoObj, name } = found;
        const origRender = memoObj.type;

        memoObj.type = function PatchedWithOverlay(...args: any[]) {
            const original = origRender.apply(this, args);
            return React.createElement(React.Fragment, null, original, React.createElement(PartnershipOverlay));
        };

        cleanups.push(() => { memoObj.type = origRender; });
        console.log(`[PartnershipHelper] PATCH: overlay dopięty do ${name}`);
        return true;
    } catch (e) {
        console.log("[PartnershipHelper] patchAnchor() wywalił się:", e);
        return false;
    }
}
