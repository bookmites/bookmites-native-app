import { useCallback, useEffect, useState } from "react";

import type { BookRow } from "@/db/schema";
import { listLibraryBooks, pickAndImportBook } from "@/services/library";

export function useHomeBooks() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const rows = await listLibraryBooks();
    setBooks(rows);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const rows = await listLibraryBooks();
        if (active) {
          setBooks(rows);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const importBook = useCallback(async () => {
    setImporting(true);
    setError(null);
    try {
      const result = await pickAndImportBook();
      if (result.status === "error") {
        setError(result.message);
      }
      if (result.status === "success") {
        await refresh();
      }
    } finally {
      setImporting(false);
    }
  }, [refresh]);

  return {
    books,
    loading,
    importing,
    error,
    importBook,
    clearError: () => setError(null),
  };
}