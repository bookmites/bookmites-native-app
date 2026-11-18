import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/design/tokens";

type CardModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  cardStyle?: ViewStyle;
};

export function CardModal({ visible, onClose, children, cardStyle }: CardModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View
          style={[
            styles.card,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            cardStyle,
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: "70%",
  },
});