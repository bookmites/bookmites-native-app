import { router } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/design/tokens";

import { useStoredData } from "./useStoredData";

function DataSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <AppText variant="body" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText variant="caption" style={styles.mono}>
        {body}
      </AppText>
    </View>
  );
}

export function DataScreen() {
  const { data, loading, error, reload } = useStoredData();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Stored data</AppText>
        <View style={styles.headerActions}>
          <Button label="Refresh" variant="secondary" onPress={() => void reload()} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <DataSection title="books" body={JSON.stringify(data.books, null, 2)} />
          <DataSection title="reading_progress" body={JSON.stringify(data.readingProgress, null, 2)} />
          <DataSection title="book_quotes" body={JSON.stringify(data.bookQuotes, null, 2)} />
          <DataSection
            title="reader_global_settings"
            body={JSON.stringify(data.readerGlobalSettings, null, 2)}
          />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  error: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  mono: {
    fontFamily: "monospace",
  },
});