import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import {
  colors,
  readerSectionBarMaxHeight,
  readerToolbarMaxHeight,
  spacing,
} from "@/design/tokens";
import {
  ReaderSurface,
  isReaderFontSizeTier,
  useReaderBookQuotes,
  useReaderBookSession,
  useReaderFontSize,
  type ReaderFontSizeTier,
  type ReaderSurfaceHandle,
} from "@/services";

import { ReaderQuoteEditBanner } from "./ReaderQuoteEditBanner";
import { ReaderSectionBar } from "./ReaderSectionBar";
import { ReaderSettingsModal } from "./ReaderSettingsModal";
import { ReaderSurfaceFrame } from "./ReaderSurfaceFrame";
import { ReaderToolbar } from "./ReaderToolbar";
import { useReaderChromeMode } from "./useReaderChromeMode";
import { useReaderChromeTransition } from "./useReaderChromeTransition";

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
  const { chromeMode, toggleChromeMode } = useReaderChromeMode(bookId, {
    editingQuoteId,
    textSelectionActiveRef,
  });
  const chromeProgress = useReaderChromeTransition(chromeMode);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toolbarChromeStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(chromeProgress.value, [0, 1], [0, readerToolbarMaxHeight]),
    opacity: chromeProgress.value,
    overflow: "hidden",
  }));

  const sectionChromeStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(chromeProgress.value, [0, 1], [0, readerSectionBarMaxHeight]),
    opacity: chromeProgress.value,
    overflow: "hidden",
  }));

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

  const onContentTap = useCallback(() => {
    toggleChromeMode();
  }, [toggleChromeMode]);

  const onHighlightTapInRead = useCallback(
    (quoteId: string) => {
      if (chromeMode !== "read") {
        return;
      }
      onHighlightTap(quoteId);
    },
    [chromeMode, onHighlightTap],
  );

  const ready = state.status === "ready" && location !== null;
  const spineIndex = location?.spineIndex ?? 0;
  const title = state.status === "ready" ? state.book.title : (bookId ?? "");
  const inNav = chromeMode === "nav";

  return (
    <Screen padded={false}>
      {ready ? (
        <Animated.View style={toolbarChromeStyle} pointerEvents={inNav ? "auto" : "none"}>
          <ReaderToolbar
            title={title}
            onBack={() => router.back()}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </Animated.View>
      ) : null}

      {ready && editingQuoteId && chromeMode === "read" ? (
        <ReaderQuoteEditBanner onCancel={cancelHighlightEdit} />
      ) : null}

      {quoteError ? (
        <AppText variant="caption" style={styles.quoteError}>
          {quoteError}
        </AppText>
      ) : null}

      <ReaderSurfaceFrame progress={chromeProgress}>
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
            onHighlightTap={onHighlightTapInRead}
            onContentTap={onContentTap}
            textSelectionEnabled={chromeMode === "read"}
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
      </ReaderSurfaceFrame>

      {ready ? (
        <Animated.View style={sectionChromeStyle} pointerEvents={inNav ? "auto" : "none"}>
          <ReaderSectionBar
            spineIndex={spineIndex}
            spineCount={spineCount}
            onPrevious={goToPreviousSection}
            onNext={goToNextSection}
          />
        </Animated.View>
      ) : null}

      <ReaderSettingsModal
        visible={settingsOpen && inNav}
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
  quoteError: {
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
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
});