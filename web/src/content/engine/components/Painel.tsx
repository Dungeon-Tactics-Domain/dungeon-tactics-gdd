// The Godot x Three.js decision dashboard: every block reads dados.json / pendencias.json (copied on 17/11, with origin)
// and draws with the shared dashboard components. Colours follow the engine, never the rank.
import type { ReactNode } from 'react';
import { Callout } from '@/components/content/Callout';
import { DataTable } from '@/components/content/DataTable';
import { BarrasComparativas, Legenda } from '@/components/dashboard/BarrasComparativas';
import { CartaoMetrica } from '@/components/dashboard/CartaoMetrica';
import { ListaPendencias, type Pendencia } from '@/components/dashboard/ListaPendencias';
import { SeloOrigem, type TipoOrigem } from '@/components/dashboard/SeloOrigem';
import { numero, type Serie } from '@/components/dashboard/series';
import { type CriterioPontuado, pontuar, TabelaPontuacao } from '@/components/dashboard/TabelaPontuacao';
import dados from '../dados.json';
import pendencias from '../pendencias.json';

// validated palette (dataviz validator, light, on #fbf5e6): all checks pass
export const GODOT: Serie = { id: 'godot', nome: 'Godot', cor: '#2f6aa8' };
export const THREE: Serie = { id: 'threejs', nome: 'Three.js', cor: '#b8561c' };
const CHROME: Serie = { id: 'chrome', nome: 'Three.js no Chrome', cor: THREE.cor };
const ELECTRON: Serie = { id: 'electron', nome: 'Three.js no Electron', cor: '#7a5aa8' };
const TAURI: Serie = { id: 'tauri', nome: 'Three.js no Tauri', cor: '#2a8450' };
const MOTORES = [GODOT, THREE];
const QUATRO = [GODOT, CHROME, ELECTRON, TAURI];
const DOIS = [GODOT, CHROME];

export const CRITERIOS: (CriterioPontuado & (typeof dados.criterios)[number])[] = dados.criterios.map((c) => ({
  ...c,
  notas: { godot: c.godot, threejs: c.threejs },
}));
export const TOTAL = pontuar(CRITERIOS, MOTORES);
export const TOTAL_SEM_MIGRACAO = pontuar(CRITERIOS, MOTORES, 5, 'migracao');
const ITENS = pendencias.itens as Pendencia[];

const semRotulo = (o: { rotulo: string }) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'rotulo')) as unknown as Record<string, number>;

const Secao = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="grid gap-3">
    <h2 className="m-0 text-[24px] leading-tight">{titulo}</h2>
    {children}
  </section>
);

function OrigemCopia() {
  return (
    <p className="m-0 text-[14px] text-apagado">
      Dados copiados em {dados.copia.em.split('-').reverse().join('/')} da {dados.copia.de}. PC das medições:{' '}
      {dados.copia.pc}.
    </p>
  );
}

/** The question on the table, the options and the current recommendation (under evaluation, with its triggers). */
export function AgoraDecidindo() {
  const d = dados.decisao;
  return (
    <div className="grid gap-4">
      <Callout titulo="Agora estamos decidindo">
        <p className="m-0 text-[18px] font-bold">{d.pergunta}</p>
        <p className="m-0">
          <b>Por que importa:</b> {d.porQue}
        </p>
        <p className="m-0">
          <b>Exemplo:</b> {d.exemplo}
        </p>
      </Callout>
      <div className="grid gap-3 lg:grid-cols-3">
        {d.opcoes.map((o) => (
          <article
            key={o.titulo}
            className={`grid content-start gap-2 border bg-folha px-4 py-3 text-[15px] ${o.recomendada ? 'border-2 border-lab' : 'border-borda'}`}
          >
            <h3 className="m-0 text-[18px] leading-tight">
              {o.titulo}
              {o.recomendada && (
                <span className="ml-2 inline-block rounded-sm bg-lab px-2 py-0.5 align-middle text-[14px] font-bold text-white">
                  Recomendação atual
                </span>
              )}
            </h3>
            <p className="m-0">{o.embasamento}</p>
            <p className="m-0">
              <b>A favor:</b> {o.pros}
            </p>
            <p className="m-0">
              <b>Contra:</b> {o.contras}
            </p>
            <p className="m-0">
              <b>Na prática:</b> {o.consequencia}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Recomendacao() {
  const d = dados.decisao;
  return (
    <div className="grid gap-4">
      <Callout titulo="Recomendação atual, em avaliação">
        <p className="m-0">{d.recomendacao}</p>
        <p className="m-0 text-[15px] text-apagado">
          Não é um veredito final: a conclusão depende de console ser obrigatório ou só desejável, e muda se um dos
          gatilhos abaixo acontecer.
        </p>
        <ul className="m-0 grid list-disc gap-1 pl-6">
          {d.porQueRecomendacao.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Callout>
      <Secao titulo="O que mudaria a conclusão">
        <ul className="m-0 grid max-w-[110ch] list-disc gap-1 pl-6">
          {d.gatilhos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Secao>
    </div>
  );
}

/** Totals with and without the migration cost, recomputed from weights and scores. */
export function Totais() {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <CartaoMetrica rotulo="Godot, total" cor={GODOT.cor} valor={TOTAL.godot} detalhe="de 100 pontos" />
        <CartaoMetrica rotulo="Three.js, total" cor={THREE.cor} valor={TOTAL.threejs} detalhe="de 100 pontos" />
        <CartaoMetrica
          rotulo="Godot, sem migração"
          cor={GODOT.cor}
          valor={TOTAL_SEM_MIGRACAO.godot}
          detalhe="pesos refeitos para base 100"
        />
        <CartaoMetrica
          rotulo="Three.js, sem migração"
          cor={THREE.cor}
          valor={TOTAL_SEM_MIGRACAO.threejs}
          detalhe="pesos refeitos para base 100"
        />
      </div>
      <p className="m-0 max-w-[110ch]">
        <b>Empate técnico.</b> As duas diferenças ({numero(TOTAL.godot! - TOTAL.threejs!)} e{' '}
        {numero(TOTAL_SEM_MIGRACAO.godot! - TOTAL_SEM_MIGRACAO.threejs!)} pontos) ficam abaixo da margem de{' '}
        {dados.margem} pontos que o plano de testes trata como ruído.{' '}
        <SeloOrigem
          tipo="deducao"
          texto="Cálculo sobre a tabela de notas e pesos; a margem vem do plano de testes. O total sem migração existe porque, em 16/11, ficou decidido que o orçamento de migração não pesa na decisão."
        />
      </p>
    </div>
  );
}

export function Matriz() {
  return (
    <div className="grid gap-4">
      <TabelaPontuacao
        criterios={CRITERIOS}
        series={MOTORES}
        legenda="Nota de 0 a 5 por motor; pontos = peso x nota / 5; os pesos somam 100 e podem ser mudados."
      />
      <BarrasComparativas
        titulo="Pontos por critério (peso x nota / 5)"
        series={MOTORES}
        linhas={CRITERIOS.map((c) => ({
          rotulo: `${c.nome} (peso ${c.peso})`,
          valores: { godot: (c.peso * c.godot) / 5, threejs: (c.peso * c.threejs) / 5 },
        }))}
        unidade=" pts"
        maximo={20}
      />
    </div>
  );
}

export function Criterios() {
  return (
    <div className="grid max-w-[110ch] gap-3">
      {CRITERIOS.map((c) => (
        <article key={c.id} className="grid gap-2 border border-borda bg-folha px-4 py-3 text-[15px]">
          <h3 className="m-0 text-[19px] leading-tight">
            {c.nome}{' '}
            <span className="text-[15px] font-normal text-apagado">
              (peso {c.peso}; Godot {c.godot} e Three.js {c.threejs}, de 5)
            </span>
          </h3>
          <p className="m-0">
            <b>Godot:</b> {c.brutoGodot}
          </p>
          <p className="m-0">
            <b>Three.js:</b> {c.brutoThreejs}
          </p>
          <p className="m-0">
            <b>Por que essas notas:</b> {c.porQue}
          </p>
          <SeloOrigem tipo={c.origem.tipo as TipoOrigem} texto={c.origem.texto} />
        </article>
      ))}
    </div>
  );
}

export function Ressalvas() {
  return (
    <div className="grid gap-4">
      <Callout tom="aviso" titulo="Ressalvas de medição (valem para todos os números de desempenho)">
        <ul className="m-0 grid list-disc gap-1 pl-6">
          {dados.ressalvas.map((r) => (
            <li key={r.texto}>{r.texto}</li>
          ))}
        </ul>
      </Callout>
      <Secao titulo="Onde o Godot perde">
        <p className="m-0 max-w-[110ch]">{dados.godotPerde}</p>
      </Secao>
      <Secao titulo="Onde os dados são fracos">
        <ul className="m-0 grid max-w-[110ch] list-disc gap-1 pl-6">
          {dados.fracos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Secao>
      <Secao titulo="Não confirmado">
        <ul className="m-0 grid max-w-[110ch] list-none gap-2 p-0">
          {dados.naoConfirmado.map((n) => (
            <li key={n.texto} className="flex flex-wrap items-start gap-2">
              <SeloOrigem tipo="nao-confirmado" />
              <span className="min-w-0 flex-1">
                {n.texto}{' '}
                {'link' in n && n.link && (
                  <a href={n.link} target="_blank" rel="noreferrer" className="text-link underline underline-offset-2">
                    fonte ↗
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Secao>
    </div>
  );
}

export function Pendencias() {
  return (
    <div className="grid gap-3">
      <p className="m-0 max-w-[110ch]">
        Lista atualizada em {pendencias.atualizadoEm.split('-').reverse().join('/')}. Alguns destes testes serão rodados
        depois; o estado de cada um muda aqui.
      </p>
      <ListaPendencias itens={ITENS} />
    </div>
  );
}

const medido = (texto: string) => <SeloOrigem tipo="medido" texto={texto} />;

export function Desempenho() {
  const { cpu, gpu } = dados;
  return (
    <div className="grid gap-5">
      <Callout tom="aviso" titulo="Como ler">
        <p className="m-0">
          Os números são da bancada nativa (Godot executável e Three.js no Chrome, Electron e Tauri), em série, 3
          rodadas por caso, mediana, sem vsync, janela de 1280 x 720 fora da tela. Eles são os números oficiais da
          decisão; as cenas ao vivo deste lab mostram outra coisa (o Godot rodando no navegador).
        </p>
      </Callout>
      {(['noite', 'limpo'] as const).map((quando) => (
        <BarrasComparativas
          key={quando}
          titulo={`${cpu.titulo}, ${quando === 'noite' ? 'bancada da noite (16 e 17/11)' : 'PC limpo (17/11)'}`}
          series={QUATRO}
          unidade=" fps"
          linhas={cpu.casos.map((c) => ({ rotulo: c.rotulo, valores: c[quando] }))}
          nota={
            <>
              {cpu.nota} {medido('Mediana de 3 rodadas por caso, recalculada dos arquivos de resultado.')}
            </>
          }
        />
      ))}
      <BarrasComparativas
        titulo={`${gpu.titulo} (queda em %)`}
        series={DOIS}
        unidade="% de queda"
        linhas={gpu.casos.map((c) => ({ rotulo: c.rotulo, valores: { godot: -c.godot, chrome: -c.chrome } }))}
        maximo={100}
        nota={
          <>
            {gpu.nota} Base: Godot {numero(gpu.base.godot)} fps, Chrome {numero(gpu.base.chrome)} chamadas por segundo.{' '}
            {medido('Bancada da noite, blocos de cargas de GPU e de física e partículas, modo otimizado.')}
          </>
        }
      />
    </div>
  );
}

export function FisicaPersonagens() {
  const { fisica, personagens } = dados;
  return (
    <div className="grid gap-5">
      <BarrasComparativas
        titulo={fisica.titulo}
        series={DOIS}
        unidade=" fps"
        linhas={fisica.casos.map((c) => ({ rotulo: c.rotulo, valores: semRotulo(c) }))}
        nota={
          <>
            {fisica.nota} Com 100 corpos o Chrome passa de 1.000 e conta chamadas de requestAnimationFrame.{' '}
            {medido('Bancada da noite, bloco de física e partículas.')}
          </>
        }
      />
      <BarrasComparativas
        titulo={personagens.titulo}
        series={DOIS}
        unidade=" fps"
        linhas={personagens.casos.map((c) => ({ rotulo: c.rotulo, valores: semRotulo(c) }))}
        nota={medido('Bancada da noite, bloco de mapa, prédios e personagens.')}
      />
      <BarrasComparativas
        titulo={personagens.ossos.titulo}
        series={QUATRO}
        unidade=" fps"
        linhas={personagens.ossos.casos.map((c) => ({ rotulo: c.rotulo, valores: semRotulo(c) }))}
        nota={
          <>
            Com a animação guardada numa textura de ossos o Three.js passa o Godot (1,4 vez); sem ela, é o contrário.{' '}
            {medido('Repetição com o PC limpo, banco de personagens.')}
          </>
        }
      />
    </div>
  );
}

export function ModoFracoPeso() {
  const { fraco, peso } = dados;
  return (
    <div className="grid gap-5">
      <BarrasComparativas
        titulo={fraco.titulo}
        series={QUATRO}
        unidade=" fps"
        linhas={fraco.casos.map((c) => ({ rotulo: c.rotulo, valores: semRotulo(c) }))}
        nota={
          <>
            {fraco.nota} {medido('Bancada da noite, bloco de modo fraco.')}
          </>
        }
      />
      <BarrasComparativas
        titulo={peso.titulo}
        series={QUATRO}
        unidade=" MB"
        linhas={[
          { rotulo: 'RAM', valores: peso.ram },
          { rotulo: 'VRAM', valores: peso.vram },
        ]}
        nota={
          <>
            {peso.instalador} O exe exportado do Godot repetiu a RAM do editor (789 e 792 MB privados em 2 rodadas; a 1ª, a frio, deu 1.056).{' '}
            {medido('Repetição com o PC limpo; instaladores lidos do disco em 17/11.')}
          </>
        }
      />
    </div>
  );
}

export function Vibe() {
  const { vibe } = dados;
  const t = vibe.totais;
  return (
    <div className="grid gap-4">
      <p className="m-0 max-w-[110ch]">{vibe.regra}</p>
      <div className="flex flex-wrap gap-3">
        <CartaoMetrica rotulo="Godot: tarefas sem correção" cor={GODOT.cor} valor="8 de 10" />
        <CartaoMetrica rotulo="Three.js: tarefas sem correção" cor={THREE.cor} valor="6 de 10" />
        <CartaoMetrica rotulo="Godot: chamadas de ferramenta" cor={GODOT.cor} valor={t.godot.tools} />
        <CartaoMetrica rotulo="Three.js: chamadas de ferramenta" cor={THREE.cor} valor={t.threejs.tools} />
      </div>
      <BarrasComparativas
        titulo="Chamadas de ferramenta por tarefa"
        series={MOTORES}
        linhas={vibe.tarefas.map((x) => ({
          rotulo: x.nome,
          valores: { godot: x.godot.tools, threejs: x.threejs.tools },
        }))}
        nota={medido('Chamadas e rodadas de correção relatadas pelo próprio agente; tokens informados pelo sistema.')}
      />
      <DataTable
        legenda="Por tarefa: tokens, chamadas de ferramenta e rodadas de correção"
        colunas={['Tarefa', 'Tokens Godot', 'Tokens Three.js', 'Correções Godot', 'Correções Three.js']}
        linhas={[
          ...vibe.tarefas.map((x) => [
            x.nome,
            numero(x.godot.tokens),
            numero(x.threejs.tokens),
            x.godot.correcoes,
            x.threejs.correcoes,
          ]),
          ['Total', numero(t.godot.tokens), numero(t.threejs.tokens), t.godot.correcoes, t.threejs.correcoes],
        ]}
      />
      <p className="m-0 max-w-[110ch] text-[15px] text-apagado">
        A diferença de tokens (3,8%) é ruído; o que separa os lados é o número de correções e de chamadas.
      </p>
    </div>
  );
}

const CAPTURAS = [
  {
    src: '/content/engine/interface/menu.png',
    w: 1920,
    h: 1080,
    alt: 'Protótipo no Godot: menu de comandos Mover, Agir, Esperar e Status sobre o mapa, com a mão apontando para Mover.',
    legenda: 'Protótipo no Godot: menu de comandos.',
  },
  {
    src: '/content/engine/interface/submenu.png',
    w: 1920,
    h: 1080,
    alt: 'Protótipo no Godot: submenu de habilidades aberto ao lado do menu, com Atacar, Golpe Sagrado (falta mana) e Itens.',
    legenda: 'Protótipo no Godot: submenu de habilidades, com a habilidade sem mana apagada.',
  },
  {
    src: '/content/engine/interface/lado-a-lado.png',
    w: 1300,
    h: 1040,
    alt: 'Recortes dos menus lado a lado: à esquerda o protótipo no Godot, à direita o menu do jogo atual em Three.js.',
    legenda: 'Lado a lado: à esquerda o protótipo no Godot, à direita o menu do jogo atual em Three.js.',
  },
];

export function Interface3d() {
  const { interface: ui } = dados;
  return (
    <div className="grid max-w-[110ch] gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <CartaoMetrica rotulo="Godot: verificações do teste" cor={GODOT.cor} valor="78 de 78" detalhe={ui.godot} />
        <CartaoMetrica rotulo="Three.js: linhas já no jogo" cor={THREE.cor} valor={2602} detalhe={ui.threejs} />
      </div>
      <p className="m-0">{ui.falta}</p>
      <SeloOrigem
        tipo="medido"
        texto="17/11: teste do protótipo rodado sem janela; linhas contadas nos dois projetos."
      />
      {CAPTURAS.map((c) => (
        <figure key={c.src} className="m-0 grid gap-1">
          <img
            src={c.src}
            alt={c.alt}
            loading="lazy"
            width={c.w}
            height={c.h}
            className="h-auto w-full rounded-lg border border-borda"
          />
          <figcaption className="text-[15px] text-apagado">
            {c.legenda} Referência: tela de outro jogo ao fundo, só para comparação interna.
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Consoles() {
  return (
    <div className="grid gap-3">
      <Legenda series={MOTORES} />
      <DataTable
        legenda="Caminho para cada plataforma"
        colunas={['Plataforma', 'Godot', 'Three.js']}
        linhas={dados.consoles.map((c) => [c.plataforma, c.godot, c.threejs])}
      />
      <SeloOrigem
        tipo="documentacao"
        texto="Páginas lidas em 17/11. A rota de Xbox no Three.js e os preços da W4 Games continuam não confirmados (lista em Ressalvas)."
      />
      <ul className="m-0 grid list-disc gap-1 pl-6">
        {dados.consolesLinks.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="text-link underline underline-offset-2">
              {l.rotulo} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { OrigemCopia };
