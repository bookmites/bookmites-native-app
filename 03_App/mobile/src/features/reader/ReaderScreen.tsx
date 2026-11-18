import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/design/tokens";
import {
  ReaderSurface,
  isReaderFontSizeTier,
  useReaderBookSession,
  useReaderFontSize,
  type ReaderFontSizeTier,
} from "@/services";

import { ReaderSettingsModal } from "./ReaderSettingsModal";

export function ReaderScreen() {
  const { bookId: bookIdParam } = useLocalSearchParams<{ bookId?: string }>();
  const bookId = typeof bookIdParam === "string" ? bookIdParam : undefined;
  const { state, onLocationChange, onPublicationError } = useReaderBookSession(bookId);
  const { tier, setTier, preferences } = useReaderFontSize();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const onFontSizeTierChange = useCallback(
    (next: ReaderFontSizeTier) => {
      void setTier(next);
    },
    [setTier],
  );

  return (
    <Screen padded={false}>
      <View style={styles.toolbar}>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
        {state.status === "ready" ? (
          <AppText variant="caption" muted numberOfLines={1} style={styles.bookIdLabel}>
            {state.title}
          </AppText>
        ) : bookId ? (
          <AppText variant="caption" muted numberOfLines={1} style={styles.bookIdLabel}>
            {bookId}
          </AppText>
        ) : null}
        <Button
          label="Settings"
          variant="secondary"
          onPress={() => setSettingsOpen(true)}
          style={styles.settingsButton}
        />
      </View>

      <View style={styles.body}>
        {!bookId ? (
          <View style={styles.centered}>
            <AppText variant="body" muted>
              No book selected.
            </AppText>
          </View>
        ) : null}

        {bookId && state.status === "loading" ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
            <AppText variant="body" muted>
              Opening…
            </AppText>
          </View>
        ) : null}

        {bookId && state.status === "error" ? (
          <View style={styles.centered}>
            <AppText variant="body">{state.message}</AppText>
          </View>
        ) : null}

        {bookId && state.status === "ready" ? (
          <ReaderSurface
            file={state.file}
            preferences={preferences}
            onLocationChange={onLocationChange}
            onPublicationError={onPublicationError}
            style={styles.reader}
          />
        ) : null}
      </View>

      <ReaderSettingsModal
        visible={settingsOpen}
        fontSizeTier={tier}
        onClose={() => setSettingsOpen(false)}
        onFontSizeTierChange={(value) => {
          if (isReaderFontSizeTier(value)) {
            onFontSizeTierChange(value);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bookIdLabel: {
    flex: 1,
  },
  settingsButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  body: {
    flex: 1,
  },
  reader: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});