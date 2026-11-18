// JSX typing for the midi-studio-player element; React 19 hands `catalog` to it as a property, not an attribute.
import type { Catalog } from 'midi-studio-player';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'dt-music-app': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        catalog?: Catalog;
        theme?: string;
      };
    }
  }
}
