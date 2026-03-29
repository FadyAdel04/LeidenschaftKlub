import { useState, useEffect } from 'react';

export function useOnceAnimation(id: string) {
  const [hasAnimated, setHasAnimated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`has_animated_${id}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (!hasAnimated) {
      localStorage.setItem(`has_animated_${id}`, 'true');
      setHasAnimated(true);
    }
  }, [id, hasAnimated]);

  return hasAnimated;
}
