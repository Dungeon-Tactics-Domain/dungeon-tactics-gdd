import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => matchMedia(query).matches,
  );
}

/** One breakpoint for the whole shell: below it the lab links and the lab's own menu live in the single "☰ Labs" drawer. */
export const COMPACT = '(max-width: 1099px)';
