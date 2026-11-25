import { useCallback, useEffect, useRef, useState } from "react";

import { setLastOpenedBookId } from "@/db/readerSettings";
import { parseCfiLocation } from "@/services/epub";

import { openReaderBook, type ReaderBook } from "./openReaderBook";
import { saveStoredProgressCfi } from "./progressStorage";
import type { ReaderLocation, ReaderTarget } from "./ReaderSurface";

const DEBOUNCE_MS = 500;

type SessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; book: ReaderBook }
  | { status: "error"; message: string };

function initialLocation(book: ReaderBook, initialCfi: string | undefined): ReaderLocation {
  const parsed = initialCfi ? parseCfiLocation(initialCfi) : null;
  const spineCount = book.epub.spine.itemref.length;
  if (parsed && parsed.spineIndex < spineCount) {
    return { spineIndex: parsed.spineIndex, target: { kind: "address", address: parsed.start }, nonce: 0 };
  }
  return { spineIndex: 0, target: { kind: "start" }, nonce: 0 };
}

/**
 * Opens a book for reading, tracks which spine document is shown, and persists the reading
 * position (a point CFI) with a debounce.
 */
export function useReaderBookSession(bookId: string | undefined) {
  const [state, setState] = useState<SessionState>({ status: "idle" });
  const [location, setLocation] = useState<ReaderLocation | null>(null);
  const pendingCfiRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeBookIdRef = useRef(bookId);

  useEffect(() => {
    activeBookIdRef.current = bookId;
  }, [bookId]);

  const flushProgress = useCallback(async (id: string, cfi: string) => {
    try {
      await saveStoredProgressCfi(id, cfi);
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

  const onLocationChange = useCallback(
    (cfi: string) => {
      const id = activeBookIdRef.current;
      if (!id) {
        return;
      }
      pendingCfiRef.current = cfi;
      clearTimer();
      timerRef.current = setTimeout(() => {
        const pending = pendingCfiRef.current;
        pendingCfiRef.current = null;
        timerRef.current = null;
        if (pending) {
          void flushProgress(id, pending);
        }
      }, DEBOUNCE_MS);
    },
    [clearTimer, flushProgress],
  );

  useEffect(() => {
    if (!bookId) {
      setState({ status: "idle" });
      setLocation(null);
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });
    setLocation(null);

    openReaderBook(bookId)
      .then(({ book, initialCfi }) => {
        if (!cancelled) {
          setLocation(initialLocation(book, initialCfi));
          setState({ status: "ready", book });
          void setLastOpenedBookId(bookId).catch((error) => {
            console.warn("Failed to record last opened book", error);
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.warn("Failed to open book", error);
          const message = error instanceof Error ? error.message : "Could not open this book.";
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
      clearTimer();
      const pending = pendingCfiRef.current;
      pendingCfiRef.current = null;
      if (pending) {
        void flushProgress(bookId, pending);
      }
    };
  }, [bookId, clearTimer, flushProgress]);

  const spineCount = state.status === "ready" ? state.book.epub.spine.itemref.length : 0;

  const goTo = useCallback(
    (spineIndex: number, target: ReaderTarget) => {
      if (spineIndex < 0 || spineIndex >= spineCount) {
        return;
      }
      setLocation((previous) => ({ spineIndex, target, nonce: (previous?.nonce ?? 0) + 1 }));
    },
    [spineCount],
  );

  const goToNextSection = useCallback(() => {
    if (location) {
      goTo(location.spineIndex + 1, { kind: "start" });
    }
  }, [goTo, location]);

  const goToPreviousSection = useCallback(() => {
    if (location) {
      goTo(location.spineIndex - 1, { kind: "start" });
    }
  }, [goTo, location]);

  const onError = useCallback((message: string) => {
    setState({ status: "error", message: message || "The reader could not display this book." });
  }, []);

  return {
    state,
    location,
    spineCount,
    goTo,
    goToNextSection,
    goToPreviousSection,
    onLocationChange,
    onError,
  };
}
