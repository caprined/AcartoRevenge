import { findByProps, findByStoreName } from "@vendetta/metro";
import { after, before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { findInReactTree } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";
import { startRecording, stopRecording, isRecording, getSessionAddedCount } from "../utils/recorder";
import { getReviews } from "../utils/store";
import { getGuildNameForChannel, SelectedChannelStore } from "../utils/discord";
import ModalTriggerRow from "../components/ModalTriggerRow";
import ReadScreen from "../components/ReadScreen";
import ManageServersScreen from "../components/ManageServersScreen";
import SendServersScreen from "../components/SendServersScreen";
import PublishAdScreen from "../components/PublishAdScreen";
import { log, warn, error as logError } from "../utils/logger";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow ?? Forms.FormRow;

const patchedInstances = new Set<any>();

let persistentToastInterval: ReturnType<typeof setInterval> | null = null;

function startPersistentOnToast() {
    stopPersistentOnToast();
    showToast("Review: ON", getAssetIDByName("ic_information_24px"));
    persistentToastInterval = setInterval(() => {
        if (!isRecording()) {
            stopPersistentOnToast();
            return;
        }
        showToast("Review: ON", getAssetIDByName("ic_information_24px"));
    }, 4000);
}

function stopPersistentOnToast() {
    if (persistentToastInterval) {
        clearInterval(persistentToastInterval);
        persistentToastInterval = null;
    }
}

export function patchMessageMenu(cleanups: (() => void)[]): boolean {
    if (!LazyActionSheet?.openLazy) {
        warn("LazyActionSheet nie znaleziony");
        return false;
    }
    if (!ActionSheetRow) {
        warn("ActionSheetRow nie znaleziony");
        return false;
    }

    const unpatchOpen = before("openLazy", LazyActionSheet, ([component, key, msg]: any[]) => {
        log("openLazy wywołany, key =", key);

        if (typeof key !== "string" || !key.endsWith("MessageLongPressActionSheet")) return;
        if (!component?.then) return;

        // Kontekst wiadomości którą przytrzymano — potrzebny do "Wyślij
        // serwery" (dokąd wysłać) i "Opublikuj reklamę" (jaki to serwer).
        let channelId: string | null = null;
        try {
            channelId = msg?.message?.channel_id ?? SelectedChannelStore?.getChannelId?.() ?? null;
        } catch {
            channelId = null;
        }
        const guildInfo = channelId ? getGuildNameForChannel(channelId) : null;
        const currentGuildId = guildInfo?.guildId ?? null;

        component.then((instance: any) => {
            if (patchedInstances.has(instance)) return;
            patchedInstances.add(instance);

            after("default", instance, (_args: any, res: any) => {
                const buttons = findInReactTree(res, (x: any) => x?.[0]?.type?.name === "ActionSheetRow");
                if (!buttons) {
                    warn("nie znaleziono tablicy ActionSheetRow w drzewie");
                    return;
                }

                if (buttons.some((b: any) => typeof b?.key === "string" && b.key.startsWith("partnership-helper"))) {
                    return; // już dodane w tym renderze
                }

                const recording = isRecording();
                const reviewLabel = recording ? "Zakończ review" : "Rozpocznij review";
                const reviewIcon = recording ? "ic_close_circle_24px" : "ic_add_circle_24px";

                const handleToggleReview = () => {
                    LazyActionSheet.hideActionSheet();
                    if (isRecording()) {
                        const added = getSessionAddedCount();
                        stopRecording();
                        stopPersistentOnToast();
                        showToast(
                            `Dodano ${added} ${added === 1 ? "wpis" : "wpisów"}`,
                            getAssetIDByName("ic_information_24px"),
                        );
                    } else {
                        startRecording();
                        startPersistentOnToast();
                    }
                };

                const newRows = [
                    <ModalTriggerRow
                        key="partnership-helper-read"
                        ActionSheetRow={ActionSheetRow}
                        label={`Odczyt (${getReviews().length})`}
                        iconSource={getAssetIDByName("ic_message_24px")}
                        hideActionSheet={() => LazyActionSheet.hideActionSheet()}
                        renderScreen={({ onClose, onNavigateAway }) => (
                            <ReadScreen onClose={onClose} onNavigateAway={onNavigateAway} />
                        )}
                    />,
                    <ActionSheetRow
                        key="partnership-helper-toggle"
                        label={reviewLabel}
                        icon={<ActionSheetRow.Icon source={getAssetIDByName(reviewIcon)} />}
                        onPress={handleToggleReview}
                    />,
                    <ModalTriggerRow
                        key="partnership-helper-manage"
                        ActionSheetRow={ActionSheetRow}
                        label="Zarządzaj serwerami"
                        iconSource={getAssetIDByName("ic_cog_24px")}
                        hideActionSheet={() => LazyActionSheet.hideActionSheet()}
                        renderScreen={({ onClose }) => <ManageServersScreen onClose={onClose} />}
                    />,
                ];

                if (channelId) {
                    newRows.push(
                        <ModalTriggerRow
                            key="partnership-helper-sendservers"
                            ActionSheetRow={ActionSheetRow}
                            label="Wyślij serwery"
                            iconSource={getAssetIDByName("ic_send_24px") ?? getAssetIDByName("ic_message_24px")}
                            hideActionSheet={() => LazyActionSheet.hideActionSheet()}
                            renderScreen={({ onClose }) => (
                                <SendServersScreen onClose={onClose} targetChannelId={channelId as string} />
                            )}
                        />,
                        <ModalTriggerRow
                            key="partnership-helper-publish"
                            ActionSheetRow={ActionSheetRow}
                            label="Opublikuj reklamę"
                            iconSource={getAssetIDByName("ic_upload_24px") ?? getAssetIDByName("ic_message_24px")}
                            hideActionSheet={() => LazyActionSheet.hideActionSheet()}
                            renderScreen={({ onClose }) => (
                                <PublishAdScreen onClose={onClose} currentGuildId={currentGuildId} />
                            )}
                        />,
                    );
                }

                buttons.splice(1, 0, ...newRows);
                log("PATCH: dodano wiersze do menu wiadomości");
            });
        }).catch((e: any) => logError("component.then() error:", e));
    });

    cleanups.push(() => {
        unpatchOpen();
        patchedInstances.clear();
        stopPersistentOnToast();
    });

    log("PATCH: hook na openLazy zainstalowany");
    return true;
}
