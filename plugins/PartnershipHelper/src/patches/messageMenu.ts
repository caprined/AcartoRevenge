import { findByName, findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";
import { startRecording, stopRecording, isRecording } from "../utils/recorder";
import { getReviews } from "../utils/store";
import { openReadScreen } from "../utils/bus";

const MessageLongPressActionSheet = findByName("MessageLongPressActionSheet", false);
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow;
const ActionSheetRowGroup =
    findByProps("ActionSheetRowGroup")?.ActionSheetRowGroup ?? (ActionSheetRow as any)?.Group;
const ActionSheetRowIcon =
    findByProps("ActionSheetRowIcon")?.ActionSheetRowIcon ?? (ActionSheetRow as any)?.Icon;

function findActionGroups(tree: any) {
    return findInReactTree(tree, (node: any) => node?.[0]?.type?.name === "ActionSheetRowGroup");
}

function findFlatButtons(tree: any) {
    return findInReactTree(tree, (node: any) => node?.[0]?.type?.name === "ActionSheetRow");
}

export function patchMessageMenu(cleanups: (() => void)[]): boolean {
    if (!MessageLongPressActionSheet) {
        console.log("[PartnershipHelper] MessageLongPressActionSheet nie znaleziony");
        return false;
    }
    if (!ActionSheetRow) {
        console.log("[PartnershipHelper] ActionSheetRow nie znaleziony");
        return false;
    }

    let innerUnpatch: (() => void) | null = null;

    const outerUnpatch = after("default", MessageLongPressActionSheet, (_args: any, ret: any) => {
        if (innerUnpatch) innerUnpatch();

        innerUnpatch = after("type", ret, (_a: any, component: any) => {
            const recording = isRecording();
            const reviewLabel = recording ? "Zakończ review" : "Rozpocznij review";
            const reviewIcon = recording ? "ic_close_circle_24px" : "ic_add_circle_24px";

            const handleToggleReview = () => {
                if (isRecording()) {
                    stopRecording();
                    showToast("Review zatrzymany", getAssetIDByName("ic_information_24px"));
                } else {
                    startRecording();
                    showToast("Review włączony — scrolluj kanał", getAssetIDByName("ic_information_24px"));
                }
            };

            const handleOpenRead = () => {
                setTimeout(() => openReadScreen(), 50);
            };

            const readRow = React.createElement(ActionSheetRow, {
                label: `Odczyt (${getReviews().length})`,
                icon: ActionSheetRowIcon
                    ? React.createElement(ActionSheetRowIcon, { source: getAssetIDByName("ic_message_24px") })
                    : undefined,
                onPress: handleOpenRead,
            });

            const toggleRow = React.createElement(ActionSheetRow, {
                label: reviewLabel,
                icon: ActionSheetRowIcon
                    ? React.createElement(ActionSheetRowIcon, { source: getAssetIDByName(reviewIcon) })
                    : undefined,
                onPress: handleToggleReview,
            });

            // Nowsze buildy: wiersze pogrupowane w ActionSheetRowGroup
            const groups = findActionGroups(component);
            if (groups && ActionSheetRowGroup) {
                groups.push(
                    React.createElement(
                        ActionSheetRowGroup,
                        { key: "partnership-helper" },
                        readRow,
                        toggleRow,
                    ),
                );
                return;
            }

            // Starsze buildy: płaska tablica ActionSheetRow
            const flat = findFlatButtons(component);
            if (flat) {
                flat.unshift(readRow, toggleRow);
            } else {
                console.log("[PartnershipHelper] nie znaleziono ani ActionSheetRowGroup ani płaskiej listy przycisków");
            }
        });
    });

    cleanups.push(() => {
        if (innerUnpatch) innerUnpatch();
        outerUnpatch();
    });

    console.log("[PartnershipHelper] PATCH: menu wiadomości spatchowane (nowy wzorzec)");
    return true;
}
