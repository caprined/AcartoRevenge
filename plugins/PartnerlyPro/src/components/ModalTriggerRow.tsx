import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { findByProps } from "@vendetta/metro";

const List = findByProps("List") ?? { List: View };

export default function ModalTriggerRow({
  ActionSheetRow,
  label,
  iconSource,
  hideActionSheet,
  renderScreen,
}: {
  ActionSheetRow: any;
  label: string;
  iconSource: any;
  hideActionSheet?: () => void;
  renderScreen: (ctx: { onClose: () => void; onNavigateAway?: () => void }) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <ActionSheetRow
        label={label}
        icon={<ActionSheetRow.Icon source={iconSource} />}
        onPress={() => {
          hideActionSheet?.();
          setOpen(true);
        }}
      />

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{label}</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.body}>{renderScreen({ onClose: () => setOpen(false), onNavigateAway: hideActionSheet })}</View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.46)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111214",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "78%",
    minHeight: "36%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  close: {
    color: "#fff",
    fontSize: 18,
    padding: 4,
  },
  body: {
    flex: 1,
  },
});
