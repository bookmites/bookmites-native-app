import { useCallback, useEffect, useState } from "react";

import { getDb } from "@/db";
import { bookQuotes, books, readerGlobalSettings, readingProgress } from "@/db/schema";

export type StoredDataDump = {
  books: (typeof books.$inferSelect)[];
  readingProgress: (typeof readingProgress.$inferSelect)[];
  bookQuotes: (typeof bookQuotes.$inferSelect)[];
  readerGlobalSettings: (typeof readerGlobalSettings.$inferSelect)[];
};

export function useStoredData() {
  const [data, setData] = useState<StoredDataDump | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getDb();
      const [bookRows, progressRows, quoteRows, settingsRows] = await Promise.all([
        db.select().from(books),
        db.select().from(readingProgress),
        db.select().from(bookQuotes),
        db.select().from(readerGlobalSettings),
      ]);

      setData({
        books: bookRows,
        readingProgress: progressRows,
        bookQuotes: quoteRows,
        readerGlobalSettings: settingsRows,
      });
    } catch {
      setError("Could not load stored data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}