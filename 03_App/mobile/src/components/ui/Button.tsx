import type { PressableProps } from "react-native";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing, typography } from "@/design/tokens";

type ButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary";
};

export function Button({ label, variant = "primary", style, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        state.pressed && styles.pressed,
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      <AppText
        style={[
          styles.label,
          variant === "primary" ? styles.labelPrimary : styles.labelSecondary,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
  },
  labelPrimary: {
    color: colors.surface,
    ...typography.body,
    fontWeight: "600",
  },
  labelSecondary: {
    color: colors.textPrimary,
    ...typography.body,
    fontWeight: "600",
  },
});