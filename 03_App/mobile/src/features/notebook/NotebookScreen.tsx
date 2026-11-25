import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/design/tokens";

import { useNotebookQuotes } from "./useNotebookQuotes";

export function NotebookScreen() {
  const { quotes, loading, error, reload } = useNotebookQuotes();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <Screen>
      <AppText variant="title" style={styles.title}>
        Notebook
      </AppText>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.quoteId}
          contentContainerStyle={quotes.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <AppText variant="body" muted style={styles.emptyText}>
              No highlights yet
            </AppText>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <AppText variant="body">{item.snippet}</AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {item.bookTitle}
                {item.bookAuthor ? ` · ${item.bookAuthor}` : ""}
              </AppText>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
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
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  row: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});