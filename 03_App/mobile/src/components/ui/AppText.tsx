import type { TextProps } from "react-native";
import { StyleSheet, Text } from "react-native";

import { colors, typography } from "@/design/tokens";

type AppTextVariant = "title" | "body" | "caption";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  muted?: boolean;
};

export function AppText({
  variant = "body",
  muted = false,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        muted && styles.muted,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
  title: typography.title,
  body: typography.body,
  caption: typography.caption,
  muted: {
    color: colors.textSecondary,
  },
});