import type { PressableProps } from "react-native";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing, typography } from "@/design/tokens";

type SelectButtonProps = PressableProps & {
  label: string;
  selected?: boolean;
};

export function SelectButton({ label, selected = false, style, ...rest }: SelectButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={(state) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        state.pressed && styles.pressed,
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      <AppText
        variant="caption"
        style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 52,
    alignItems: "center",
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontWeight: typography.body.fontWeight,
  },
  labelSelected: {
    color: colors.surface,
    fontWeight: "600",
  },
  labelUnselected: {
    color: colors.textPrimary,
  },
});