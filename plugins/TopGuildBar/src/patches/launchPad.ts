import React from "react";
import { find, findByName } from "@vendetta/metro";
import HorizontalTopBar from "../components/HorizontalTopBar";
import { log, warn, error as logError } from "../utils/logger";

function findLaunchPadModule(): any {
    try {
        const byName = findByName("LaunchPadContainer");
        if (byName) return { default: byName };
    } catch (e) {
        warn("findByName(LaunchPadContainer) rzucił błąd:", e);
    }

    try {
        const mod = find((m) => {
            try {
                return (
                    m?.default?.type?.name === "LaunchPadContainer" ||
                    m?.default?.displayName === "LaunchPadContainer"
                );
            } catch {
                return false;
            }
        });
        if (mod?.default) return mod;
    } catch (e) {
        warn("find(LaunchPadContainer) rzucił błąd:", e);
    }

    return null;
}

/**
 * EKSPERYMENT 3: LaunchPadContainer widoczny w realnym crash-stacku jako
 * opakowanie całego StackNavigatora (czyli renderuje się raz, na starcie,
 * i nie odmontowuje się przy nawigacji między ekranami — w przeciwieństwie
 * do GuildsBar czy GlobalStatusIndicator).
 *
 * WAŻNE: tu NIE zastępujemy komponentu (jak wcześniej) — OPAKOWUJEMY go,
 * żeby cała reszta appki (cały StackNavigator w środku) renderowała się
 * normalnie. Nasz pasek dokładamy jako rodzeństwo, nie zamiennik.
 */
export function patchLaunchPad(cleanups: (() => void)[]): boolean {
    try {
        const mod = findLaunchPadModule();
        if (!mod?.default) {
            warn("LaunchPadContainer nie znaleziony — zobacz Configure");
            return false;
        }
        const orig = mod.default;

        mod.default = function LaunchPadWithTopBar(props: any) {
            log("LaunchPadWithTopBar() wywołany — opakowujemy oryginalną zawartość");
            return React.createElement(
                React.Fragment,
                null,
                React.createElement(HorizontalTopBar),
                React.createElement(orig, props),
            );
        };
        mod.default.displayName = "LaunchPadContainer";

        cleanups.push(() => { mod.default = orig; });
        log("PATCH: LaunchPadContainer opakowany naszym paskiem");
        return true;
    } catch (e) {
        logError("patchLaunchPad() wywalił się:", e);
        return false;
    }
}
