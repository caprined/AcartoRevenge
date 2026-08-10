import React from "react";
import { Modal } from "react-native";
import { error as logError } from "../utils/logger";

interface Props {
    ActionSheetRow: any;
    label: string;
    iconSource: any;
    hideActionSheet?: () => void;
    renderScreen: (ctx: { onClose: () => void; onNavigateAway?: () => void }) => React.ReactNode;
}

export default function ModalTriggerRow({ ActionSheetRow, label, iconSource, hideActionSheet, renderScreen }: Props) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <ActionSheetRow
                label={label}
                icon={<ActionSheetRow.Icon source={iconSource} />}
                onPress={() => setOpen(true)}
            />
            {open && (
                <Modal
                    transparent
                    visible
                    animationType="none"
                    statusBarTranslucent
                    onRequestClose={() => setOpen(false)}
                >
                    <ErrorSafe>
                        {renderScreen({ onClose: () => setOpen(false), onNavigateAway: hideActionSheet })}
                    </ErrorSafe>
                </Modal>
            )}
        </>
    );
}

class ErrorSafe extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(err: any) {
        return { error: String(err?.message ?? err) };
    }
    componentDidCatch(err: any) {
        logError("ModalTriggerRow render error:", err);
    }
    render() {
        if (this.state?.error) return null;
        return this.props.children;
    }
}
