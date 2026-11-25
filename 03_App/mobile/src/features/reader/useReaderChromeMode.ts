import { useCallback, useState, type RefObject } from "react";

export type ReaderChromeMode = "read" | "nav";

type UseReaderChromeModeOptions = {
  editingQuoteId: string | null;
  textSelectionActiveRef: RefObject<boolean>;
};

export function useReaderChromeMode(bookId: string | undefined, options: UseReaderChromeModeOptions) {
  const [chromeMode, setChromeMode] = useState<ReaderChromeMode>("read");
  const [sessionBookId, setSessionBookId] = useState(bookId);

  if (bookId !== sessionBookId) {
    setSessionBookId(bookId);
    setChromeMode("read");
  }

  const toggleChromeMode = useCallback(() => {
    if (options.editingQuoteId !== null) {
      return;
    }
    if (options.textSelectionActiveRef.current) {
      return;
    }
    setChromeMode((mode) => (mode === "read" ? "nav" : "read"));
  }, [options.editingQuoteId, options.textSelectionActiveRef]);

  return { chromeMode, setChromeMode, toggleChromeMode };
}