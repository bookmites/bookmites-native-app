import { useCallback, useEffect, useState } from "react";

import { listAllBookQuotes, type BookQuoteWithBookTitle } from "@/services";

export function useNotebookQuotes() {
  const [quotes, setQuotes] = useState<BookQuoteWithBookTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAllBookQuotes();
      setQuotes(rows);
    } catch {
      setError("Could not load notebook.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { quotes, loading, error, reload };
}