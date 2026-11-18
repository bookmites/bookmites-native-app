import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { CardModal } from "@/components/ui/CardModal";
import { spacing } from "@/design/tokens";
import type { ReaderFontSizeTier } from "@/services";

import { ReaderSettings } from "./ReaderSettings";

type ReaderSettingsModalProps = {
  visible: boolean;
  fontSizeTier: ReaderFontSizeTier;
  onClose: () => void;
  onFontSizeTierChange: (tier: ReaderFontSizeTier) => void;
};

export function ReaderSettingsModal({
  visible,
  fontSizeTier,
  onClose,
  onFontSizeTierChange,
}: ReaderSettingsModalProps) {
  return (
    <CardModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <AppText variant="title" style={styles.title}>
          Reader Settings
        </AppText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close reader settings"
          hitSlop={8}
          style={styles.close}
        >
          <AppText variant="body" style={styles.closeLabel}>
            ×
          </AppText>
        </Pressable>
      </View>
      <ReaderSettings
        fontSizeTier={fontSizeTier}
        onFontSizeTierChange={onFontSizeTierChange}
      />
    </CardModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    paddingRight: spacing.md,
  },
  close: {
    paddingHorizontal: spacing.xs,
  },
  closeLabel: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "400",
  },
});