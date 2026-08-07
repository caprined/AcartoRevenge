import { findByProps } from "@vendetta/metro";
import { after, before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { findInReactTree } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";
import { startRecording, stopRecording, isRecording } from "../utils/recorder";
import { getReviews } from "../utils/store";
import ReadTriggerRow from "../components/ReadTriggerRow";
import { log, warn, error as logError } from "../utils/logger";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow ?? Forms.FormRow;

const patchedInstances = new Set<any>();

export function patchMessageMenu(cleanups: (() => void)[]): boolean {
    if (!LazyActionSheet?.openLazy) {
        warn("LazyActionSheet nie znaleziony");
        return false;
    }
    if (!ActionSheetRow) {
        warn("ActionSheetRow nie znaleziony");
        return false;
    }

    const unpatchOpen = before("openLazy", LazyActionSheet, ([component, key]: any[]) => {
        log("openLazy wywołany, key =", key);

        if (typeof key !== "string" || !key.endsWith("MessageLongPressActionSheet")) return;
        if (!component?.then) return;

        component.then((instance: any) => {
            if (patchedInstances.has(instance)) return;
            patchedInstances.add(instance);

            after("default", instance, (_args: any, res: any) => {
                const buttons = findInReactTree(res, (x: any) => x?.[0]?.type?.name === "ActionSheetRow");
                if (!buttons) {
                    warn("nie znaleziono tablicy ActionSheetRow w drzewie");
                    return;
                }

                if (buttons.some((b: any) => b?.key === "partnership-helper-read" || b?.key === "partnership-helper-toggle")) {
                    return; // już dodane w tym renderze
                }

                const recording = isRecording();
                const reviewLabel = recording ? "Zakończ review" : "Rozpocznij review";
                const reviewIcon = recording ? "ic_close_circle_24px" : "ic_add_circle_24px";

                const handleToggleReview = () => {
                    LazyActionSheet.hideActionSheet();
                    if (isRecording()) {
                        stopRecording();
                        showToast("Review zatrzymany", getAssetIDByName("ic_information_24px"));
                    } else {
                        startRecording();
                        showToast("Review włączony — scrolluj kanał", getAssetIDByName("ic_information_24px"));
                    }
                };

                buttons.splice(1, 0,
                    <ReadTriggerRow
                        key="partnership-helper-read"
                        ActionSheetRow={ActionSheetRow}
                        iconSource={getAssetIDByName("ic_message_24px")}
                        hideActionSheet={() => LazyActionSheet.hideActionSheet()}
                    />,
                    <ActionSheetRow
                        key="partnership-helper-toggle"
                        label={reviewLabel}
                        icon={<ActionSheetRow.Icon source={getAssetIDByName(reviewIcon)} />}
                        onPress={handleToggleReview}
                    />,
                );

                log("PATCH: dodano wiersze do menu wiadomości");
            });
        }).catch((e: any) => logError("component.then() error:", e));
    });

    cleanups.push(() => {
        unpatchOpen();
        patchedInstances.clear();
    });

    log("PATCH: hook na openLazy zainstalowany");
    return true;
}
