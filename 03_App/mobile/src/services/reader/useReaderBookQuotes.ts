import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import type { BookQuoteRow } from "@/db/schema";
import {
  createBookQuote,
  listBookQuotesByBook,
  updateBookQuote,
} from "@/services/bookQuotes";
import { refCodeFromCFI, startCfiOf, type Epub } from "@/services/epub";

import type {
  ReaderHighlight,
  ReaderSelection,
  ReaderSelectionAction,
  ReaderSurfaceHandle,
} from "./ReaderSurface";

/** Light yellow; painted with `mix-blend-mode: multiply` over the text. */
const HIGHLIGHT_COLOR = "rgba(255, 214, 102, 0.55)";
/** The quote being edited in the reader. */
const ACTIVE_HIGHLIGHT_COLOR = "rgba(255, 176, 32, 0.6)";

type UseReaderBookQuotesOptions = {
  epub: Epub | null;
  surfaceRef: RefObject<ReaderSurfaceHandle | null>;
};

/** Selected text as a snippet: markup whitespace collapsed to single spaces. */
function snippetFromSelection(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Sortable reading-order key for a quote; null if the spine document can't be resolved. */
async function refcodeForCfi(epub: Epub, cfi: string): Promise<number | null> {
  const start = startCfiOf(cfi);
  if (!start) {
    return null;
  }
  try {
    return (await refCodeFromCFI(start, epub)) ?? null;
  } catch (error) {
    console.warn("Could not compute refcode for quote", error);
    return null;
  }
}

export function useReaderBookQuotes(
  bookId: string | undefined,
  { epub, surfaceRef }: UseReaderBookQuotesOptions,
) {
  const enabled = Boolean(bookId && epub);
  const [quotes, setQuotes] = useState<BookQuoteRow[]>([]);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const textSelectionActiveRef = useRef(false);

  const reloadQuotes = useCallback(async () => {
    if (!bookId) {
      setQuotes([]);
      return;
    }
    try {
      setQuotes(await listBookQuotesByBook(bookId));
    } catch (error) {
      console.warn("Failed to load BookQuotes", error);
      setQuoteError("Could not load highlights for this book.");
    }
  }, [bookId]);

  useEffect(() => {
    if (!enabled) {
      setQuotes([]);
      setEditingQuoteId(null);
      textSelectionActiveRef.current = false;
      return;
    }
    void reloadQuotes();
  }, [enabled, reloadQuotes]);

  const highlights = useMemo<ReaderHighlight[]>(
    () =>
      quotes.map((quote) => ({
        id: quote.quoteId,
        cfi: quote.cfi,
        color: quote.quoteId === editingQuoteId ? ACTIVE_HIGHLIGHT_COLOR : HIGHLIGHT_COLOR,
      })),
    [editingQuoteId, quotes],
  );

  const onSelectionChange = useCallback((selection: ReaderSelection | null) => {
    // Ref only: no re-render while selection handles are dragged.
    textSelectionActiveRef.current = selection !== null;
  }, []);

  const onHighlightTap = useCallback(
    (quoteId: string) => {
      const quote = quotes.find((row) => row.quoteId === quoteId);
      if (!quote) {
        return;
      }
      setEditingQuoteId(quoteId);
      setQuoteError(null);
      // Pre-select the quote so its range can be adjusted with the native handles.
      surfaceRef.current?.selectCfi(quote.cfi);
    },
    [quotes, surfaceRef],
  );

  const onSelectionAction = useCallback(
    async (action: ReaderSelectionAction, selection: ReaderSelection) => {
      if (action === "copy") {
        try {
          await Clipboard.setStringAsync(snippetFromSelection(selection.text));
        } catch (error) {
          console.warn("Copy failed", error);
        }
        return;
      }

      if (!bookId || !epub) {
        return;
      }
      const snippet = snippetFromSelection(selection.text);
      if (!snippet || !selection.cfi) {
        setQuoteError("Could not read selected text. Try selecting again.");
        return;
      }

      try {
        const refcode = await refcodeForCfi(epub, selection.cfi);
        if (editingQuoteId) {
          await updateBookQuote({ quoteId: editingQuoteId, cfi: selection.cfi, refcode, snippet });
          setEditingQuoteId(null);
        } else {
          await createBookQuote({ bookId, cfi: selection.cfi, refcode, snippet });
        }
        setQuoteError(null);
        await reloadQuotes();
      } catch (error) {
        console.warn("Failed to save BookQuote", error);
        setQuoteError("Could not save highlight.");
      }
    },
    [bookId, editingQuoteId, epub, reloadQuotes],
  );

  const cancelHighlightEdit = useCallback(() => {
    setEditingQuoteId(null);
    setQuoteError(null);
    surfaceRef.current?.clearSelection();
  }, [surfaceRef]);

  return {
    highlights,
    editingQuoteId,
    quoteError,
    textSelectionActiveRef,
    onHighlightTap,
    onSelectionAction,
    onSelectionChange,
    cancelHighlightEdit,
    reloadQuotes,
  };
}
