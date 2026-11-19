import { useEffect, useState } from 'react';
import type { DbState } from '../types/database';
import { emptyDatabase } from '../utils/database';

const STORAGE_KEY = 'access-simulator-state-v1';

export function useDatabase() {
  const [db, setDb] = useState<DbState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) as DbState : emptyDatabase();
    } catch { return emptyDatabase(); }
  });
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }, [db]);
  return { db, setDb };
}
