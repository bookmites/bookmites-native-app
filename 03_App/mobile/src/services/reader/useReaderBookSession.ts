import { useCallback, useEffect, useRef, useState } from "react";
import type { Locator } from "react-native-readium";

import { resolveBookFile, type ResolvedBookFile } from "./resolveBookFile";
import { saveStoredLocator } from "./locatorStorage";

const DEBOUNCE_MS = 500;

type SessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; bookId: string; title: string; file: ResolvedBookFile }
  | { status: "error"; message: string };

export function useReaderBookSession(bookId: string | undefined) {
  const [state, setState] = useState<SessionState>({ status: "idle" });
  const pendingLocatorRef = useRef<Locator | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeBookIdRef = useRef(bookId);

  useEffect(() => {
    activeBookIdRef.current = bookId;
  }, [bookId]);

  const flushProgress = useCallback(async (id: string, locator: Locator) => {
    try {
      await saveStoredLocator(id, locator);
    } catch (error) {
      console.warn("Failed to save reading progress", error);
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleSave = useCallback(
    (id: string, locator: Locator) => {
      pendingLocatorRef.current = locator;
      clearTimer();
      timerRef.current = setTimeout(() => {
        const pending = pendingLocatorRef.current;
        pendingLocatorRef.current = null;
        timerRef.current = null;
        if (pending) {
          void flushProgress(id, pending);
        }
      }, DEBOUNCE_MS);
    },
    [clearTimer, flushProgress],
  );

  const onLocationChange = useCallback(
    (locator: Locator) => {
      const id = activeBookIdRef.current;
      if (!id) {
        return;
      }
      scheduleSave(id, locator);
    },
    [scheduleSave],
  );

  useEffect(() => {
    if (!bookId) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    resolveBookFile(bookId)
      .then((file) => {
        if (!cancelled) {
          setState({ status: "ready", bookId, title: file.title, file });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Could not open this book.";
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
      clearTimer();
      const id = activeBookIdRef.current;
      const pending = pendingLocatorRef.current;
      if (id && pending) {
        void flushProgress(id, pending);
      }
    };
  }, [bookId, clearTimer, flushProgress]);

  const onPublicationError = useCallback((event: { message?: string }) => {
    setState({
      status: "error",
      message: event.message ?? "Readium could not open this publication.",
    });
  }, []);

  return { state, onLocationChange, onPublicationError };
}