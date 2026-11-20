import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DecorationActivatedEvent,
  SelectionActionEvent,
  SelectionEvent,
} from "react-native-readium";

import type { BookQuoteRow } from "@/db/schema";
import {
  createBookQuote,
  listBookQuotesByBook,
  updateBookQuote,
} from "@/services/bookQuotes";

import {
  READER_HIGHLIGHT_ACTION_ID,
  bookQuotesToDecorationGroup,
  readerHighlightSelectionActions,
} from "./bookQuoteDecorations";

type UseReaderBookQuotesOptions = {
  enabled: boolean;
};

export function useReaderBookQuotes(
  bookId: string | undefined,
  { enabled }: UseReaderBookQuotesOptions,
) {
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
      const rows = await listBookQuotesByBook(bookId);
      setQuotes(rows);
    } catch (error) {
      console.warn("Failed to load BookQuotes", error);
      setQuoteError("Could not load highlights for this book.");
    }
  }, [bookId]);

  useEffect(() => {
    if (!enabled || !bookId) {
      setQuotes([]);
      setEditingQuoteId(null);
      textSelectionActiveRef.current = false;
      return;
    }
    void reloadQuotes();
  }, [bookId, enabled, reloadQuotes]);

  const onSelectionChange = useCallback((event: SelectionEvent) => {
    const active = Boolean(event.locator);
    textSelectionActiveRef.current = active;
    // Ref only — avoid re-rendering ReaderSurface during handle drag.
  }, []);

  const decorations = useMemo(() => {
    if (!enabled || quotes.length === 0) {
      return undefined;
    }
    return [bookQuotesToDecorationGroup(quotes, editingQuoteId)];
  }, [editingQuoteId, enabled, quotes]);

  const onDecorationActivated = useCallback((event: DecorationActivatedEvent) => {
    setEditingQuoteId(event.decoration.id);
    setQuoteError(null);
  }, []);

  const onSelectionAction = useCallback(
    async (event: SelectionActionEvent) => {
      if (!bookId || event.actionId !== READER_HIGHLIGHT_ACTION_ID) {
        return;
      }

      const snippet = event.selectedText?.trim();
      if (!snippet) {
        setQuoteError("Could not read selected text. Try selecting again.");
        return;
      }

      const locatorJson = JSON.stringify(event.locator);

      try {
        if (editingQuoteId) {
          await updateBookQuote({
            quoteId: editingQuoteId,
            locatorJson,
            snippet,
          });
          setEditingQuoteId(null);
        } else {
          await createBookQuote({ bookId, locatorJson, snippet });
        }
        setQuoteError(null);
        await reloadQuotes();
      } catch (error) {
        console.warn("Failed to save BookQuote", error);
        setQuoteError("Could not save highlight.");
      }
    },
    [bookId, editingQuoteId, reloadQuotes],
  );

  const cancelHighlightEdit = useCallback(() => {
    setEditingQuoteId(null);
    setQuoteError(null);
  }, []);

  return {
    decorations,
    editingQuoteId,
    quoteError,
    textSelectionActiveRef,
    selectionActions: readerHighlightSelectionActions,
    onDecorationActivated,
    onSelectionAction,
    onSelectionChange,
    cancelHighlightEdit,
    reloadQuotes,
  };
}