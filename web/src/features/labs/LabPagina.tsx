// A migrated lab: its pages from src/content/<lab> in the pages pattern, with the lab's colour.
import type { LabConteudo } from '@/content/registry';
import { Paginas } from '@/features/paginas/Paginas';
import type { Place } from '@/lib/labs';
import { useLabAccent } from '@/lib/useLabAccent';

export function LabPagina({ lab, conteudo }: { lab: Place; conteudo: LabConteudo }) {
  useLabAccent(lab.cor, lab.corSuave);
  return <Paginas sumario={conteudo.sumario} base={`/${lab.id}`} />;
}
