import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { Locator } from "react-native-readium";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/design/tokens";
import {
  ReaderSurface,
  isReaderFontSizeTier,
  useReaderBookQuotes,
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
  const {
    decorations,
    editingQuoteId,
    quoteError,
    selectionActions,
    onDecorationActivated,
    onSelectionAction,
    onSelectionChange,
    textSelectionActiveRef,
    cancelHighlightEdit,
  } = useReaderBookQuotes(bookId, { enabled: state.status === "ready" });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const onLocationChangeWhileReading = useCallback(
    (locator: Locator) => {
      if (textSelectionActiveRef.current) {
        return;
      }
      onLocationChange(locator);
    },
    [onLocationChange, textSelectionActiveRef],
  );

  const onFontSizeTierChange = useCallback(
    (next: ReaderFontSizeTier) => {
      void setTier(next);
    },
    [setTier],
  );

  const ready = Boolean(bookId && state.status === "ready");

  return (
    <Screen padded={false}>
      <View style={styles.shell}>
        {ready && state.status === "ready" ? (
          <ReaderSurface
            file={state.file}
            preferences={preferences}
            decorations={decorations}
            selectionActions={selectionActions}
            onLocationChange={onLocationChangeWhileReading}
            onPublicationError={onPublicationError}
            onDecorationActivated={onDecorationActivated}
            onSelectionChange={onSelectionChange}
            onSelectionAction={onSelectionAction}
            style={styles.reader}
          />
        ) : null}

        <View style={styles.chrome} pointerEvents="box-none">
          <View style={styles.toolbar} pointerEvents="auto">
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

          {ready && editingQuoteId ? (
            <View style={styles.highlightBanner} pointerEvents="auto">
              <AppText variant="caption" style={styles.highlightBannerText}>
                Adjust the selection, then tap Highlight to update this quote.
              </AppText>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={cancelHighlightEdit}
                style={styles.highlightBannerButton}
              />
            </View>
          ) : null}

          {quoteError ? (
            <AppText variant="caption" style={styles.quoteError}>
              {quoteError}
            </AppText>
          ) : null}
        </View>

        {!ready ? (
          <View style={styles.statusOverlay} pointerEvents="none">
            {!bookId ? (
              <AppText variant="body" muted>
                No book selected.
              </AppText>
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
              <AppText variant="body">{state.message}</AppText>
            ) : null}
          </View>
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
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reader: {
    ...StyleSheet.absoluteFill,
  },
  chrome: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-start",
  },
  statusOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  bookIdLabel: {
    flex: 1,
  },
  settingsButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  highlightBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  highlightBannerText: {
    flex: 1,
  },
  highlightBannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  quoteError: {
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
});