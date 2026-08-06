import React from "react";
import { findByProps } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { findInReactTree } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";
import { startRecording, stopRecording, isRecording } from "../utils/recorder";
import { getReviews } from "../utils/store";
import { openReadScreen } from "../utils/bus";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow ?? Forms.FormRow;

export function patchMessageMenu(cleanups: (() => void)[]): boolean {
    try {
        if (!LazyActionSheet?.openLazy) {
            console.log("[PartnershipHelper] LazyActionSheet nie znaleziony");
            return false;
        }

        const unpatchOpen = before("openLazy", LazyActionSheet, ([component, key]: any[]) => {
            if (key !== "MessageLongPressActionSheet" || !component?.then) return;

            component.then((instance: any) => {
                const unpatchInstance = after("default", instance, (_args: any, res: any) => {
                    setTimeout(unpatchInstance, 0);

                    const buttons = findInReactTree(res, (x: any) => x?.[0]?.type?.name === "ActionSheetRow");
                    if (!buttons) return;

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
                        LazyActionSheet.hideActionSheet();
                    };

                    const handleOpenRead = () => {
                        LazyActionSheet.hideActionSheet();
                        setTimeout(() => openReadScreen(), 50);
                    };

                    buttons.unshift(
                        <ActionSheetRow
                            label={`Odczyt (${getReviews().length})`}
                            icon={<ActionSheetRow.Icon source={getAssetIDByName("ic_message_24px")} />}
                            onPress={handleOpenRead}
                        />,
                        <ActionSheetRow
                            label={reviewLabel}
                            icon={<ActionSheetRow.Icon source={getAssetIDByName(reviewIcon)} />}
                            onPress={handleToggleReview}
                        />,
                    );
                });
            });
        });

        cleanups.push(unpatchOpen);
        console.log("[PartnershipHelper] PATCH: menu wiadomości spatchowane");
        return true;
    } catch (e) {
        console.log("[PartnershipHelper] patchMessageMenu() wywalił się:", e);
        return false;
    }
}
