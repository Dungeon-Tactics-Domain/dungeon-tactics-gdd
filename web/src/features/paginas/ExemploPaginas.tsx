// Demo route of the pages pattern; the fictional data is in exemplo.tsx.
import { useLabAccent } from '@/lib/useLabAccent';
import { EXEMPLO } from './exemplo';
import { Paginas } from './Paginas';

export function ExemploPaginas() {
  useLabAccent('#5e5a48', '#ecebe3');
  return <Paginas sumario={EXEMPLO} base="/exemplo-paginas" />;
}
