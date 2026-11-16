import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// localStorage may be missing or throw (private window, blocked site data): reading gives null, writing is skipped
export const ler = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
export const gravar = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // no storage: the choice lasts until reload
  }
};
