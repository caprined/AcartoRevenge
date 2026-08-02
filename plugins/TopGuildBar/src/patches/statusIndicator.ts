import React from "react";
import { find, findByName } from "@vendetta/metro";
import { registerIntercept } from "./createElementIntercept";
import HorizontalTopBar from "../components/HorizontalTopBar";
import { log, warn, error as logError } from "../utils/logger";

function findStatusIndicatorModule(): any {
    try {
        const byName = findByName("GlobalStatusIndicator");
        if (byName) return { default: byName };
    } catch (e) {
        warn("findByName(GlobalStatusIndicator) rzucił błąd:", e);
    }

    try {
        const mod = find((m) => {
            try {
                return (
                    m?.default?.type?.name === "GlobalStatusIndicator" ||
                    m?.default?.displayName === "GlobalStatusIndicator"
                );
            } catch {
                return false;
            }
        });
        if (mod?.default) return mod;
    } catch (e) {
        warn("find(GlobalStatusIndicator) rzucił błąd:", e);
    }

    return null;
}

/**
 * EKSPERYMENT: zamiast Modal (który blokuje dotyk na Androidzie), próbujemy
 * podpiąć się pod GlobalStatusIndicator — komponent widoczny w prawdziwym
 * crash-stacku, renderowany blisko korzenia appki, pełną szerokością,
 * poza kolumną GuildsBar (więc teoretycznie nie klipowany).
 *
 * Nie mamy gwarancji że to zadziała bez klipowania/bez własnych ograniczeń —
 * to hipoteza do przetestowania, nie pewnik. Log "measured" w konsoli powie
 * nam czy wymiary są sensowne (pełny ekran) czy znów wąski pasek.
 */
export function patchStatusIndicator(cleanups: (() => void)[]): boolean {
    try {
        const mod = findStatusIndicatorModule();
        if (!mod?.default) {
            warn("GlobalStatusIndicator nie znaleziony — zobacz Configure");
            return false;
        }
        const orig = mod.default;

        registerIntercept(orig, HorizontalTopBar);

        mod.default = function TopGuildBarStatusPatch(props: any) {
            log("TopGuildBarStatusPatch() wywołany");
            return React.createElement(HorizontalTopBar);
        };
        mod.default.displayName = "GlobalStatusIndicator";

        cleanups.push(() => { mod.default = orig; });
        log("PATCH: GlobalStatusIndicator zastąpiony przez HorizontalTopBar");
        return true;
    } catch (e) {
        logError("patchStatusIndicator() wywalił się:", e);
        return false;
    }
}
