import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View, type ViewStyle } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

import { colors } from "@/design/tokens";
import {
  cfiFromBodyAddress,
  parseCfiLocation,
  rangeCfiFromBodyAddresses,
  type FullAddress,
} from "@/services/epub";
import { READER_BUNDLE } from "@/services/epub/injected/generated/readerBundle";
import {
  BRIDGE_GLOBAL,
  PRELOAD_GLOBAL,
  type AddressRange,
  type InjectedHighlight,
  type PreloadParams,
  type ReaderCommand,
  type ReaderMessage,
  type ReaderTarget,
} from "@/services/epub/injected/protocol";

import type { ReaderBook } from "./openReaderBook";

export type { ReaderTarget };

/** Where the reader should be. A new `nonce` re-applies `target` even within the same document. */
export type ReaderLocation = {
  spineIndex: number;
  target: ReaderTarget;
  nonce: number;
};

export type ReaderSelection = {
  /** Range CFI of the selection. */
  cfi: string;
  text: string;
};

export type ReaderHighlight = {
  id: string;
  /** Range CFI. Highlights outside the current spine document are ignored. */
  cfi: string;
  color: string;
};

export type ReaderSelectionAction = "highlight" | "copy";

export type ReaderSurfaceHandle = {
  /** Selects the range (e.g. an existing highlight) so the user can adjust it. */
  selectCfi(cfi: string): void;
  clearSelection(): void;
};

export type ReaderSurfaceProps = {
  book: ReaderBook;
  location: ReaderLocation;
  /** Reader stylesheet (font size etc.) applied to every spine document. */
  css: string;
  highlights: ReaderHighlight[];
  /** Point CFI of the first content in view, whenever it changes. */
  onLocationChange?: (cfi: string) => void;
  onSelectionChange?: (selection: ReaderSelection | null) => void;
  onSelectionAction?: (action: ReaderSelectionAction, selection: ReaderSelection) => void;
  onHighlightTap?: (id: string) => void;
  /** Quick tap on book content (not highlight, not selection drag). */
  onContentTap?: () => void;
  /** When false (nav chrome), in-document selection/highlight is disabled. */
  textSelectionEnabled?: boolean;
  /** A link inside the book points at another spine document. */
  onNavigate?: (spineIndex: number, target: ReaderTarget) => void;
  onError?: (message: string) => void;
  style?: ViewStyle;
  ref?: Ref<ReaderSurfaceHandle>;
};

// Android replaces the whole selection menu with custom items, so Copy is ours to provide;
// iOS appends custom items to the system menu, which already has Copy.
const SELECTION_MENU_ITEMS =
  Platform.OS === "android"
    ? [
        { label: "Highlight", key: "highlight" },
        { label: "Copy", key: "copy" },
      ]
    : [{ label: "Highlight", key: "highlight" }];

/** Reveal the document even if the bundle never reports ready (so a failure is not a blank screen). */
const READY_FALLBACK_MS = 4000;

function normalizeFileUrl(url: string): string {
  const base = url.split("#")[0]?.split("?")[0] ?? url;
  let decoded = base;
  try {
    decoded = decodeURI(base);
  } catch {
    // keep as-is
  }
  // WKWebView reports symlink-resolved paths (/private/var/…) for /var/… sandboxes.
  return decoded.replace(/^file:\/\/\/private\/var\//, "file:///var/");
}

function fragmentOf(url: string): string | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex < 0 || hashIndex === url.length - 1) {
    return null;
  }
  try {
    return decodeURIComponent(url.slice(hashIndex + 1));
  } catch {
    return url.slice(hashIndex + 1);
  }
}

function highlightsForSpine(highlights: ReaderHighlight[], spineIndex: number): InjectedHighlight[] {
  return highlights.flatMap((highlight) => {
    const location = parseCfiLocation(highlight.cfi);
    if (!location || location.spineIndex !== spineIndex) {
      return [];
    }
    return [{ id: highlight.id, start: location.start, end: location.end, color: highlight.color }];
  });
}

function buildInjection(params: PreloadParams): string {
  return `window.${PRELOAD_GLOBAL} = ${JSON.stringify(params)};\n${READER_BUNDLE}\ntrue;`;
}

function commandScript(command: ReaderCommand): string {
  return `window.${BRIDGE_GLOBAL} && window.${BRIDGE_GLOBAL}.receive(${JSON.stringify(command)}); true;`;
}

type DocumentState = {
  loadId: string;
  css: string;
  highlightsJson: string;
  nonce: number;
};

/**
 * App-owned reader surface: a WebView rendering one spine document of the extracted epub,
 * driven by the injected reader bundle (`services/epub/injected`). Only `services/reader`
 * knows about the WebView; features talk in CFIs and callbacks.
 */
export const ReaderSurface = memo(function ReaderSurface({
  book,
  location,
  css,
  highlights,
  onLocationChange,
  onSelectionChange,
  onSelectionAction,
  onHighlightTap,
  onContentTap,
  textSelectionEnabled = true,
  onNavigate,
  onError,
  style,
  ref,
}: ReaderSurfaceProps) {
  const { epub, rootUri } = book;
  const { spineIndex } = location;
  const webViewRef = useRef<WebView>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [readyLoadId, setReadyLoadId] = useState<string | null>(null);

  const documentUri = useMemo(() => epub.spineFileUri(spineIndex), [epub, spineIndex]);
  const loadId = `${documentUri ?? ""}|${String(reloadKey)}`;
  const ready = readyLoadId === loadId;
  const menuItems = textSelectionEnabled ? SELECTION_MENU_ITEMS : [];

  const spineUris = useMemo(
    () => epub.spine.itemref.map((_, index) => normalizeFileUrl(epub.spineFileUri(index) ?? "")),
    [epub],
  );

  const spineHighlights = useMemo(
    () => highlightsForSpine(highlights, spineIndex),
    [highlights, spineIndex],
  );
  const highlightsJson = useMemo(() => JSON.stringify(spineHighlights), [spineHighlights]);

  // Last thing we saw in view, so a WebView crash can reopen at the same place.
  const lastVisibleStartRef = useRef<FullAddress | null>(null);
  const recoveryRef = useRef<{ loadId: string; target: ReaderTarget } | null>(null);
  // Native menus report the action after the selection may already be collapsing, so keep
  // the last non-empty selection the document reported.
  const lastSelectionRef = useRef<ReaderSelection | null>(null);

  const loadTarget =
    recoveryRef.current?.loadId === loadId ? recoveryRef.current.target : location.target;

  // What the document will have been preloaded with; reconciled once it reports ready.
  const documentStateRef = useRef<DocumentState | null>(null);
  if (documentStateRef.current?.loadId !== loadId) {
    documentStateRef.current = { loadId, css, highlightsJson, nonce: location.nonce };
    lastVisibleStartRef.current = null;
    lastSelectionRef.current = null;
  }

  const injection = useMemo(
    () =>
      buildInjection({
        spineIndex,
        documentPath: documentUri ?? "",
        css,
        layout: {},
        target: loadTarget,
        highlights: spineHighlights,
      }),
    [spineIndex, documentUri, css, loadTarget, spineHighlights],
  );

  const latest = useRef({
    spineIndex,
    loadId,
    documentUri,
    spineUris,
    onLocationChange,
    onSelectionChange,
    onSelectionAction,
    onHighlightTap,
    onContentTap,
    textSelectionEnabled,
    onNavigate,
    onError,
  });
  latest.current = {
    spineIndex,
    loadId,
    documentUri,
    spineUris,
    onLocationChange,
    onSelectionChange,
    onSelectionAction,
    onHighlightTap,
    onContentTap,
    textSelectionEnabled,
    onNavigate,
    onError,
  };

  const send = useCallback((command: ReaderCommand) => {
    webViewRef.current?.injectJavaScript(commandScript(command));
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      selectCfi(cfi: string) {
        const parsed = parseCfiLocation(cfi);
        if (parsed && parsed.spineIndex === latest.current.spineIndex) {
          send({ type: "select", range: { start: parsed.start, end: parsed.end } });
        }
      },
      clearSelection() {
        send({ type: "clearSelection" });
      },
    }),
    [send],
  );

  // Bring the live document in line with props (after ready, and on every change).
  useEffect(() => {
    const doc = documentStateRef.current;
    if (!ready || !doc) {
      return;
    }
    if (doc.css !== css) {
      doc.css = css;
      send({ type: "style", css });
    }
    if (doc.highlightsJson !== highlightsJson) {
      doc.highlightsJson = highlightsJson;
      send({ type: "highlights", highlights: spineHighlights });
    }
    if (doc.nonce !== location.nonce) {
      doc.nonce = location.nonce;
      send({ type: "goTo", target: location.target });
    }
  }, [ready, css, highlightsJson, spineHighlights, location.nonce, location.target, send]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    send({ type: "setTextSelectionEnabled", enabled: textSelectionEnabled });
    if (!textSelectionEnabled) {
      send({ type: "clearSelection" });
    }
  }, [ready, textSelectionEnabled, send]);

  useEffect(() => {
    if (ready) {
      return;
    }
    const timer = setTimeout(() => {
      console.warn("Reader did not report ready; revealing document anyway.");
      setReadyLoadId(loadId);
    }, READY_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [ready, loadId]);

  const reportVisible = useCallback((visible: AddressRange) => {
    lastVisibleStartRef.current = visible.start;
    latest.current.onLocationChange?.(cfiFromBodyAddress(latest.current.spineIndex, visible.start));
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: ReaderMessage;
      try {
        message = JSON.parse(event.nativeEvent.data) as ReaderMessage;
      } catch {
        return;
      }
      const current = latest.current;
      if ("spineIndex" in message && message.spineIndex !== current.spineIndex) {
        return; // from a document we already navigated away from
      }
      switch (message.type) {
        case "ready":
          setReadyLoadId(current.loadId);
          if (message.visible) {
            reportVisible(message.visible);
          }
          return;
        case "location":
          reportVisible(message.visible);
          return;
        case "selection": {
          if (!current.textSelectionEnabled) {
            return;
          }
          if (!message.range) {
            current.onSelectionChange?.(null);
            return;
          }
          const cfi = rangeCfiFromBodyAddresses(current.spineIndex, message.range.start, message.range.end);
          if (!cfi) {
            return;
          }
          const selection = { cfi, text: message.text };
          lastSelectionRef.current = selection;
          current.onSelectionChange?.(selection);
          return;
        }
        case "highlightTap":
          current.onHighlightTap?.(message.id);
          return;
        case "contentTap":
          current.onContentTap?.();
          return;
        case "log":
          if (message.level === "error") {
            console.warn(`[reader] ${message.message}`);
          } else if (__DEV__) {
            console.log(`[reader] ${message.message}`);
          }
          return;
      }
    },
    [reportVisible],
  );

  const onCustomMenuSelection = useCallback(
    (event: { nativeEvent: { key: string; selectedText: string } }) => {
      if (!latest.current.textSelectionEnabled) {
        return;
      }
      const { key, selectedText } = event.nativeEvent;
      if (key !== "highlight" && key !== "copy") {
        return;
      }
      const selection = lastSelectionRef.current;
      if (!selection) {
        if (key === "copy" && selectedText) {
          latest.current.onSelectionAction?.("copy", { cfi: "", text: selectedText });
        }
        return;
      }
      latest.current.onSelectionAction?.(key, {
        cfi: selection.cfi,
        text: selection.text.trim() ? selection.text : selectedText,
      });
      if (key === "highlight") {
        send({ type: "clearSelection" });
      }
    },
    [send],
  );

  const onShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest) => {
    const { url } = request;
    const current = latest.current;
    if (url === "about:blank") {
      return true;
    }
    const normalized = normalizeFileUrl(url);
    if (current.documentUri && normalized === normalizeFileUrl(current.documentUri)) {
      return true; // this document, including in-page #fragment links
    }
    if (/^file:/i.test(url)) {
      const index = current.spineUris.indexOf(normalized);
      if (index >= 0) {
        const fragment = fragmentOf(url);
        current.onNavigate?.(index, fragment ? { kind: "fragment", id: fragment } : { kind: "start" });
      }
      return false;
    }
    if (/^(https?|mailto):/i.test(url)) {
      void Linking.openURL(url).catch(() => undefined);
    }
    return false;
  }, []);

  const recover = useCallback(() => {
    const start = lastVisibleStartRef.current;
    setReloadKey((key) => {
      const next = key + 1;
      if (start) {
        const nextLoadId = `${latest.current.documentUri ?? ""}|${String(next)}`;
        recoveryRef.current = { loadId: nextLoadId, target: { kind: "address", address: start } };
      }
      return next;
    });
  }, []);

  if (!documentUri) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        key={reloadKey}
        ref={webViewRef}
        style={styles.webView}
        source={{ uri: documentUri }}
        originWhitelist={["*"]}
        injectedJavaScriptBeforeContentLoaded={injection}
        injectedJavaScript={injection}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        // Local files only, and only this book's directory (iOS); no cross-file script access.
        allowFileAccess
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        allowingReadAccessToURL={rootUri}
        javaScriptCanOpenWindowsAutomatically={false}
        setSupportMultipleWindows={false}
        mixedContentMode="never"
        allowsLinkPreview={false}
        // Our font-size tiers own text size; ignore the Android system font scale.
        textZoom={100}
        overScrollMode="never"
        menuItems={menuItems}
        onCustomMenuSelection={onCustomMenuSelection}
        onContentProcessDidTerminate={recover}
        onRenderProcessGone={recover}
        onError={(event) => latest.current.onError?.(event.nativeEvent.description)}
        webviewDebuggingEnabled={__DEV__}
      />
      {!ready ? (
        <View style={styles.cover} pointerEvents="none">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cover: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
