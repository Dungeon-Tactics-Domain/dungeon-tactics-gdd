// "Teste de skills de design" (17/11): three finalist rule sets applied to copies of two pieces of the labs (the
// magnifier button of the icons page, an icon card), side by side with the piece as it is today. Nothing
// here is the real component: every style hangs on a ts-* class
// (teste-skills.css). A = Jakub + Emil, B = Google Modern Web Guidance, C = Impeccable's anti-slop catalogue.
/* eslint-disable react-refresh/only-export-components -- COLUNAS is exported for the test; a comparison page */
import './teste-skills.css';
import { type ReactNode, useState } from 'react';
import { Callout } from '@/components/content/Callout';
import { Icone } from '@/components/layout/Icone';
import { ASSETS } from '../dados';

type Col = 'atual' | 'a' | 'b' | 'c';
type Trecho = 'botao' | 'cartao';

export const COLUNAS: { id: Col; titulo: string }[] = [
  { id: 'atual', titulo: 'Atual' },
  { id: 'a', titulo: 'A · Jakub + Emil' },
  { id: 'b', titulo: 'B · Google Modern Web Guidance' },
  { id: 'c', titulo: 'C · Impeccable (anti-slop)' },
];

// what each rule set changed in each piece, with the rule's origin
const NOTAS: Record<Trecho, Record<Col, string[]>> = {
  botao: {
    atual: [
      'Cópia de Icones.tsx:67-68 e :107-109: sem ícone, raio 3px, a lupa troca sem transição.',
      'Sem ícone (fere a regra "ícone em todo botão" de 16/11).',
    ],
    a: [
      'Ícone lupa no botão.',
      'Botão repetido: só a cor muda, 150 ms, nunca "transition: all" (regras 1, 7).',
      'A lupa cresce do botão a partir de 0,95 + opacidade: entra em 200 ms, sai em 150 ms, ease-out (regras 2-6).',
      'Sem "press scale" 0,97: briga com o bisel afundado do jogo (conflito anotado).',
    ],
    b: [
      'Ícone lupa no botão.',
      'Hover, pressionar e foco diferentes: sombra, escala 0,97 só sem movimento reduzido, anel de foco (natural-interactions).',
      'Lupa só com fade; entrada por @starting-style, saída por display allow-discrete (animate-to-from-top-layer).',
    ],
    c: [
      'Ícone lupa no botão.',
      'Raio do token --radius (2px) no lugar do 3px solto; hover no pergaminho-escuro, sem cor de lab fora do DESIGN.',
      'Ativo em couro e creme, sem a cor do lab (sem cor fora do tema).',
    ],
  },
  cartao: {
    atual: ['Cópia de Icones.tsx:89-110: fundos em hex soltos, dica "32, 48 e 64 px" só no title.'],
    a: [
      'Nome com text-wrap: balance, legenda com pretty (regra 9).',
      'Sem contorno de 10% nas imagens: suja o pixel art (conflito anotado).',
    ],
    b: ['Igual ao atual mais o botão com ícone e foco: as regras do Google não tocam no cartão.'],
    c: [
      'Hierarquia: nome no título do tema (serifa, --h3) e legenda em --legenda, não 15/14 px soltos.',
      'O "32, 48 e 64 px" sai do title e vira legenda visível.',
      'Raio do token. Fundos de teste mantidos: são amostras de fundo, não cor de interface.',
    ],
  },
};

/** One 32 px cell of the soft atlas, scaled. */
function Atlas({ i, escala }: { i: number; escala: number }) {
  const lado = 32 * escala;
  return (
    <div
      style={{
        width: lado,
        height: lado,
        background: `url(${ASSETS}/ia/icones/atlas-32-suave.png) -${(i % 6) * lado}px -${Math.floor(i / 6) * lado}px/${6 * lado}px ${4 * lado}px no-repeat`,
      }}
    />
  );
}

function Botao({ col }: { col: Col }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div>
      <button type="button" aria-pressed={aberto} className="ts-botao" onClick={() => setAberto(!aberto)}>
        {col !== 'atual' && <Icone id="lupa" />}
        Lupa 8x
      </button>
      {/* today's page swaps the magnifier without motion; the copy mounts it the same way */}
      {(col !== 'atual' || aberto) && (
        <div className="ts-lupa" data-aberto={aberto || undefined} aria-label="Lupa de Explosão" role="img">
          <Atlas i={13} escala={4} />
        </div>
      )}
    </div>
  );
}

const FUNDOS = ['#ece2c4', '#282830'];

function Cartao({ col }: { col: Col }) {
  const [sel, setSel] = useState(false);
  const c = col === 'c';
  return (
    <div className="ts-cartao flex flex-col gap-1.5 border border-borda bg-folha p-2">
      {c ? (
        <h4 className="m-0 font-serif text-(length:--h3) text-ouro-escuro">Explosão</h4>
      ) : (
        <strong className="text-[15px]">Explosão</strong>
      )}
      <div className="flex items-end gap-1.5">
        <Atlas i={13} escala={1} />
        <span className={c ? 'text-(length:--legenda) text-apagado' : 'text-[14px] text-apagado'}>original</span>
      </div>
      <div
        className="flex items-end gap-3 p-1.5"
        style={{ background: 'linear-gradient(#1c3a78,#0b1a3e)' }}
        title={c ? undefined : '32, 48 e 64 px'}
      >
        {[1, 1.5, 2].map((e) => (
          <Atlas key={e} i={13} escala={e} />
        ))}
      </div>
      {c && <p className="m-0 text-(length:--legenda) text-apagado">32, 48 e 64 px no painel azul do jogo</p>}
      <div className="flex">
        {FUNDOS.map((cor) => (
          <div key={cor} className="flex flex-1 justify-center p-1" style={{ background: cor }}>
            <Atlas i={13} escala={1} />
          </div>
        ))}
      </div>
      {col === 'a' && <p className="m-0 text-[14px] text-apagado">Raio de área que fere quem estiver em volta.</p>}
      <button type="button" aria-pressed={sel} className="ts-botao" onClick={() => setSel(!sel)}>
        {col !== 'atual' && <Icone id="lupa" />}
        Lupa 8x
      </button>
    </div>
  );
}

const TRECHOS: { id: Trecho; titulo: string; Peca: (p: { col: Col }) => ReactNode }[] = [
  { id: 'botao', titulo: '1. Botão e lupa de ícone', Peca: Botao },
  { id: 'cartao', titulo: '2. Cartão de ícone', Peca: Cartao },
];

export function TesteSkills() {
  return (
    <div className="grid gap-8">
      <p className="m-0 max-w-[70ch]">
        Mesmas duas peças, hoje e com as regras de cada finalista. Clique nos botões para ver a lupa abrindo e fechando.
        O site desliga toda animação com movimento reduzido (index.css:214), então lá todas as colunas ficam iguais
        nesse ponto.
      </p>
      {TRECHOS.map(({ id, titulo, Peca }) => (
        <section key={id} aria-labelledby={`ts-${id}`} className="grid gap-3">
          <h2 id={`ts-${id}`} className="m-0">
            {titulo}
          </h2>
          <div className="ts-colunas">
            {COLUNAS.map((c) => (
              <div key={c.id} className={`ts-col ts-${c.id}`}>
                <h3 className="m-0 text-(length:--h3)">{c.titulo}</h3>
                <div className="ts-palco">
                  <Peca col={c.id} />
                </div>
                <ul className="m-0 grid gap-1 pl-5 text-(length:--legenda)">
                  {NOTAS[id][c.id].map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
      <section aria-labelledby="ts-decidindo" className="grid gap-3">
        <h2 id="ts-decidindo" className="m-0">
          Agora estamos decidindo
        </h2>
        <Callout>
          <p className="m-0">
            <strong>Qual conjunto de regras as peças dos labs seguem: A, B ou C?</strong>
          </p>
          <ul className="m-0 grid list-disc gap-1 pl-6">
            {COLUNAS.filter((c) => c.id !== 'atual').map((c) => (
              <li key={c.id}>{c.titulo}</li>
            ))}
          </ul>
          <p className="m-0">
            <strong>Recomendação: A (Jakub + Emil).</strong> Ordem do ranking: A (Jakub + Emil), depois C (Impeccable) e
            por último B (Google).
          </p>
          <p className="m-0">
            Para responder no chat: <strong>«Teste de skills: A»</strong> (troque a letra se preferir outra).
          </p>
        </Callout>
      </section>
    </div>
  );
}
