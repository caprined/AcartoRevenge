import React from "react";
import { Modal } from "react-native";
import ReadScreen from "./ReadScreen";
import { getReviews } from "../utils/store";
import { log, error as logError } from "../utils/logger";

export default function ReadTriggerRow({ ActionSheetRow, iconSource, hideActionSheet }: { ActionSheetRow: any; iconSource: any; hideActionSheet?: () => void }) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <ActionSheetRow
                label={`Odczyt (${getReviews().length})`}
                icon={<ActionSheetRow.Icon source={iconSource} />}
                onPress={() => {
                    log("ReadTriggerRow: otwieram Modal");
                    setOpen(true);
                }}
            />
            {open && (
                <Modal
                    transparent
                    visible
                    animationType="none"
                    statusBarTranslucent
                    onRequestClose={() => setOpen(false)}
                >
                    <ErrorSafeReadScreen onClose={() => setOpen(false)} onNavigateAway={hideActionSheet} />
                </Modal>
            )}
        </>
    );
}

class ErrorSafeReadScreen extends React.Component<{ onClose: () => void; onNavigateAway?: () => void }, { error: string | null }> {
    constructor(props: { onClose: () => void; onNavigateAway?: () => void }) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(err: any) {
        return { error: String(err?.message ?? err) };
    }
    componentDidCatch(err: any) {
        logError("ReadScreen render error:", err);
    }
    render() {
        if (this.state?.error) {
            return null; // nie blokujemy appki nawet jeśli coś tu pęknie
        }
        return <ReadScreen onClose={this.props.onClose} onNavigateAway={this.props.onNavigateAway} />;
    }
}
