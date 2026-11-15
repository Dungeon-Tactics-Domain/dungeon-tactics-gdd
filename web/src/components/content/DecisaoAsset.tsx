// Fernando's decision on one asset (use, discard, redo, maybe, plus a note), saved on the server in data/decisoes.json
// so the lab sessions can read it. A choice saves at once; the note saves with its own button. Nothing is kept only in
// the browser: when the server does not answer, the box says so and the buttons stay off.
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuadro } from '@/lib/fabrica-context';
import {
  COR_ESCOLHA,
  carregarDecisoes,
  type Decisao,
  ESCOLHAS,
  type Escolha,
  NOTA_MAX,
  nomeEscolha,
  quando,
  salvarDecisao,
} from '@/lib/decisoes';

/** `id` is the stable asset id, `<lab>/<path>` (e.g. "musica/batalha-c"); `rotulo` names the asset for screen readers. */
export function DecisaoAsset({ id, rotulo }: { id: string; rotulo: string }) {
  const [salva, setSalva] = useState<Decisao>();
  const [nota, setNota] = useState('');
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'salvando' | 'fora'>('carregando');
  const [aviso, setAviso] = useState('');

  const semApi = useQuadro().conexao === 'sem-api';

  useEffect(() => {
    if (semApi) return;
    let vivo = true;
    carregarDecisoes()
      .then((todas) => {
        if (!vivo) return;
        const d = todas.find((x) => x.id === id);
        setSalva(d);
        setNota(d?.nota ?? '');
        setEstado('pronto');
      })
      .catch(() => vivo && setEstado('fora'));
    return () => {
      vivo = false;
    };
  }, [id, semApi]);

  const salvar = async (escolha: Escolha) => {
    setEstado('salvando');
    setAviso('');
    try {
      const d = await salvarDecisao(id, escolha, nota);
      setSalva(d);
      setNota(d.nota);
      setAviso(`Salvo às ${quando(d.atualizadoEm)}.`);
    } catch (e) {
      // the typed note stays in the field, so nothing is lost
      setAviso(`Não salvou: ${e instanceof Error ? e.message : String(e)}`);
    }
    setEstado('pronto');
  };

  if (semApi) return <p className="m-0 text-[15px] text-apagado">Decisões só na rede local.</p>;

  const parado = estado !== 'pronto';
  const notaMudou = nota.trim() !== (salva?.nota ?? '');
  return (
    <section aria-label={`Decisão sobre ${rotulo}`} className="grid gap-2 border border-borda bg-folha px-4 py-3">
      <p className="m-0 flex flex-wrap items-center gap-2 font-bold">
        Decisão
        {salva ? (
          <Badge estado={COR_ESCOLHA[salva.escolha]}>{nomeEscolha(salva.escolha)}</Badge>
        ) : (
          <Badge>sem decisão</Badge>
        )}
      </p>
      <div role="group" aria-label={`Escolha para ${rotulo}`} className="flex flex-wrap gap-1.5">
        {ESCOLHAS.map(([e, nome]) => (
          <Button
            key={e}
            variant={salva?.escolha === e ? 'lab' : 'outline'}
            aria-pressed={salva?.escolha === e}
            disabled={parado}
            onClick={() => void salvar(e)}
          >
            {nome}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Input
          aria-label={`Nota sobre ${rotulo}`}
          placeholder="Nota (opcional)"
          value={nota}
          maxLength={NOTA_MAX}
          onChange={(ev) => setNota(ev.target.value)}
          disabled={estado === 'fora' || estado === 'carregando'}
          className="min-w-0 flex-1 basis-56"
        />
        <Button
          variant="outline"
          disabled={parado || !salva || !notaMudou}
          title={salva ? undefined : 'Escolha uma opção primeiro'}
          onClick={() => salva && void salvar(salva.escolha)}
        >
          Salvar nota
        </Button>
      </div>
      <p className="m-0 text-[15px] text-apagado" aria-live="polite">
        {estado === 'carregando' && 'Carregando a decisão…'}
        {estado === 'fora' && 'Decisões fora do ar: o servidor dos labs não respondeu, nada pode ser salvo agora.'}
        {estado !== 'carregando' &&
          estado !== 'fora' &&
          (aviso || (salva ? `Salvo em ${quando(salva.atualizadoEm)}.` : 'Sem decisão ainda.'))}
      </p>
    </section>
  );
}
