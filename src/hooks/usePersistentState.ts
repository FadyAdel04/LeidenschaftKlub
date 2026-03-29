import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, initialState: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialState;
    } catch (e) {
      console.error('Error loading persistent state:', e);
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving persistent state:', e);
    }
  }, [key, state]);

  return [state, setState] as const;
}
