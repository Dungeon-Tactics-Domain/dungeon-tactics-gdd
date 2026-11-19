// Route skeleton of a lab whose content has not moved to this app yet: points to its live page on the old lab (5190).
import { useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { ehLocal, OLD_LAB, type Place, SITE } from '@/lib/labs';
import { useLabAccent } from '@/lib/useLabAccent';

export function NaoMigrado({ lab }: { lab?: Place }) {
  useLabAccent(lab?.cor ?? '#5e5a48', lab?.corSuave ?? '#ecebe3');
  const titulo = lab?.nome ?? 'Página não encontrada';
  useEffect(() => {
    document.title = `${titulo} · ${SITE}`;
  }, [titulo]);
  return (
    <main className="mx-auto grid max-w-[760px] gap-4 px-4 py-10">
      <h1 className="m-0 border-l-8 border-lab pl-4 text-[34px] leading-tight">{titulo}</h1>
      {lab ? (
        <>
          <p className="m-0 text-[17px]">{lab.descricao}.</p>
          <p className="m-0 border border-dashed border-traco bg-folha px-4 py-3">
            Ainda não migrado para esta plataforma. O conteúdo continua na página atual do lab.
          </p>
          <p className="m-0 flex flex-wrap gap-2">
            {ehLocal() && (
              <Button asChild variant="lab">
                <a href={`${OLD_LAB}${lab.antigo ?? '/'}`} target="_blank" rel="noreferrer">
                  Abrir a página atual ↗
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </p>
        </>
      ) : (
        <p className="m-0">
          Não existe página neste endereço. <Link to="/">Voltar ao início</Link>
        </p>
      )}
    </main>
  );
}
