import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/design/tokens";

type ReaderToolbarProps = {
  title: string;
  onBack: () => void;
  onOpenSettings: () => void;
};

function ToolbarIconButton({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      <Ionicons name={icon} size={24} color={colors.textPrimary} />
    </Pressable>
  );
}

export function ReaderToolbar({ title, onBack, onOpenSettings }: ReaderToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <ToolbarIconButton accessibilityLabel="Back" icon="chevron-back" onPress={onBack} />
      <AppText variant="caption" muted numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <ToolbarIconButton accessibilityLabel="Reader settings" icon="settings-outline" onPress={onOpenSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.readerNavShell,
  },
  iconButton: {
    padding: spacing.sm,
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
});