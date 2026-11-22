import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

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
  type ReaderSurfaceHandle,
} from "@/services";

import { ReaderSettingsModal } from "./ReaderSettingsModal";

export function ReaderScreen() {
  const { bookId: bookIdParam } = useLocalSearchParams<{ bookId?: string }>();
  const bookId = typeof bookIdParam === "string" ? bookIdParam : undefined;
  const surfaceRef = useRef<ReaderSurfaceHandle>(null);
  const {
    state,
    location,
    spineCount,
    goTo,
    goToNextSection,
    goToPreviousSection,
    onLocationChange,
    onError,
  } = useReaderBookSession(bookId);
  const { tier, setTier, css } = useReaderFontSize();
  const {
    highlights,
    editingQuoteId,
    quoteError,
    onHighlightTap,
    onSelectionAction,
    onSelectionChange,
    textSelectionActiveRef,
    cancelHighlightEdit,
  } = useReaderBookQuotes(bookId, {
    epub: state.status === "ready" ? state.book.epub : null,
    surfaceRef,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const onLocationChangeWhileReading = useCallback(
    (cfi: string) => {
      if (textSelectionActiveRef.current) {
        return;
      }
      onLocationChange(cfi);
    },
    [onLocationChange, textSelectionActiveRef],
  );

  const onFontSizeTierChange = useCallback(
    (next: ReaderFontSizeTier) => {
      void setTier(next);
    },
    [setTier],
  );

  const ready = state.status === "ready" && location !== null;
  const spineIndex = location?.spineIndex ?? 0;

  return (
    <Screen padded={false}>
      <View style={styles.toolbar}>
        <Button label="Back" variant="secondary" onPress={() => router.back()} style={styles.toolbarButton} />
        <AppText variant="caption" muted numberOfLines={1} style={styles.title}>
          {state.status === "ready" ? state.book.title : (bookId ?? "")}
        </AppText>
        <Button
          label="Settings"
          variant="secondary"
          onPress={() => setSettingsOpen(true)}
          style={styles.toolbarButton}
        />
      </View>

      {ready && editingQuoteId ? (
        <View style={styles.banner}>
          <AppText variant="caption" style={styles.bannerText}>
            Select the passage you want, then tap Highlight to update this quote.
          </AppText>
          <Button
            label="Cancel"
            variant="secondary"
            onPress={cancelHighlightEdit}
            style={styles.bannerButton}
          />
        </View>
      ) : null}

      {quoteError ? (
        <AppText variant="caption" style={styles.quoteError}>
          {quoteError}
        </AppText>
      ) : null}

      <View style={styles.readerArea}>
        {ready && state.status === "ready" && location ? (
          <ReaderSurface
            ref={surfaceRef}
            book={state.book}
            location={location}
            css={css}
            highlights={highlights}
            onLocationChange={onLocationChangeWhileReading}
            onSelectionChange={onSelectionChange}
            onSelectionAction={onSelectionAction}
            onHighlightTap={onHighlightTap}
            onNavigate={goTo}
            onError={onError}
          />
        ) : (
          <View style={styles.status}>
            {!bookId ? (
              <AppText variant="body" muted>
                No book selected.
              </AppText>
            ) : null}
            {bookId && (state.status === "loading" || state.status === "idle") ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} />
                <AppText variant="body" muted>
                  Opening…
                </AppText>
              </View>
            ) : null}
            {state.status === "error" ? <AppText variant="body">{state.message}</AppText> : null}
          </View>
        )}
      </View>

      {ready ? (
        <View style={styles.sectionBar}>
          <Button
            label="Previous"
            variant="secondary"
            onPress={goToPreviousSection}
            disabled={spineIndex <= 0}
            style={[styles.sectionButton, spineIndex <= 0 && styles.disabled]}
          />
          <AppText variant="caption" muted>
            {`Section ${String(spineIndex + 1)} of ${String(spineCount)}`}
          </AppText>
          <Button
            label="Next"
            variant="secondary"
            onPress={goToNextSection}
            disabled={spineIndex >= spineCount - 1}
            style={[styles.sectionButton, spineIndex >= spineCount - 1 && styles.disabled]}
          />
        </View>
      ) : null}

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
    backgroundColor: colors.background,
  },
  toolbarButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    flex: 1,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  bannerText: {
    flex: 1,
  },
  bannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  quoteError: {
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  readerArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  status: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  sectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  disabled: {
    opacity: 0.4,
  },
});
