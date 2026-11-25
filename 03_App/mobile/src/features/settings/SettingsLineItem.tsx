import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/design/tokens";

type SettingsLineItemProps = {
  title: string;
  description: string;
  onPress: () => void;
};

export function SettingsLineItem({ title, description, onPress }: SettingsLineItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={(state) => [styles.row, state.pressed && styles.pressed]}
    >
      <View style={styles.textBlock}>
        <AppText variant="body">{title}</AppText>
        <AppText variant="caption" muted>
          {description}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  textBlock: {
    gap: spacing.xs,
  },
});