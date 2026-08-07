import React from "react";
import { Modal } from "react-native";
import ReadScreen from "./ReadScreen";
import { getReviews } from "../utils/store";
import { log, error as logError } from "../utils/logger";

export default function ReadTriggerRow({ ActionSheetRow, iconSource }: { ActionSheetRow: any; iconSource: any }) {
    const [open, setOpen] = React.useState(false);
    const [crashed, setCrashed] = React.useState<string | null>(null);

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
                    <ErrorSafeReadScreen onClose={() => setOpen(false)} />
                </Modal>
            )}
        </>
    );
}

class ErrorSafeReadScreen extends React.Component<{ onClose: () => void }, { error: string | null }> {
    constructor(props: { onClose: () => void }) {
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
        return <ReadScreen onClose={this.props.onClose} />;
    }
}
