import type { ReactElement } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import type { BookRow } from "@/db/schema";
import { colors, spacing } from "@/design/tokens";

import { BookLI } from "./BookLI";

export type BookListProps = {
  books: BookRow[];
  loading?: boolean;
  onBookPress: (bookId: string) => void;
  emptyMessage?: string;
  ListFooterComponent?: ReactElement | null;
};

export function BookList({
  books,
  loading = false,
  onBookPress,
  emptyMessage = "No books yet",
  ListFooterComponent,
}: BookListProps) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        style={styles.list}
        data={books}
        keyExtractor={(item) => item.bookId}
        renderItem={({ item }) => <BookLI book={item} onPress={onBookPress} />}
        contentContainerStyle={books.length === 0 ? styles.emptyContent : styles.content}
        ListEmptyComponent={
          <AppText variant="body" muted style={styles.emptyText}>
            {emptyMessage}
          </AppText>
        }
        ListFooterComponent={ListFooterComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexGrow: 1,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginBottom: spacing.lg,
  },
});