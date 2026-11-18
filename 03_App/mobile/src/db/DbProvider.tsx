import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing } from "@/design/tokens";

import { db } from "./client";
import migrations from "./drizzle/migrations";

export function DbProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.centered}>
        <AppText variant="body">Database setup failed.</AppText>
        <AppText variant="caption" muted style={styles.errorDetail}>
          {error.message}
        </AppText>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  errorDetail: {
    textAlign: "center",
  },
});