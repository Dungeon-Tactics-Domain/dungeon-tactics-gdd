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

// The shell's bands (design lab, 15/11). Written as max-width so jsdom, whose matchMedia never matches, gets the
// widest layout. Below 1024: bottom menu and a sheet; below 1440: the sidebar starts as an icon rail; from 1440 it can
// be dragged wider; from 2560 it opens wider.
export const ESTREITO = '(max-width: 1023px)';
export const SEM_DESKTOP = '(max-width: 1439px)';
export const SEM_ULTRA = '(max-width: 2559px)';
