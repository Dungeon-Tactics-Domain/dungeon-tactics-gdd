// "Board updated N min ago" plus the connection and staleness warnings, shared by the home and the Fábrica.
import { useQuadro } from '@/lib/fabrica-context';
import { since } from '@/lib/fabrica';

export function Relogio() {
  const { fabrica, conexao, idadeMs, velho, lidoEm } = useQuadro();
  const avisos: string[] = [];
  if (conexao === 'caiu')
    avisos.push(
      fabrica
        ? 'Sem conexão com o servidor da Fábrica; mostrando a última leitura boa e tentando de novo.'
        : 'Sem conexão com o servidor da Fábrica (porta 5191); tentando de novo.',
    );
  if (velho && idadeMs !== null)
    avisos.push(`O quadro não muda há ${since(idadeMs)}: as sessões podem ter parado de atualizá-lo.`);
  if (fabrica?.aviso) avisos.push(fabrica.aviso);
  return (
    <>
      <p className="m-0 text-[15px] text-apagado">
        {!fabrica
          ? 'Lendo o quadro da Fábrica…'
          : idadeMs === null
            ? 'Quadro da Fábrica sem data legível.'
            : `Quadro da Fábrica atualizado há ${since(idadeMs)}.`}
        {lidoEm && ` Lido às ${new Date(lidoEm).toLocaleTimeString('pt-BR')}.`}
        {conexao === 'ao-vivo' && ' Ao vivo.'}
      </p>
      <p role="status" className="m-0 empty:hidden">
        {avisos.length > 0 && (
          <span className="block border-l-[6px] border-warn bg-warn-soft px-3.5 py-2.5 font-bold text-warn">
            {avisos.join(' ')}
          </span>
        )}
      </p>
    </>
  );
}
