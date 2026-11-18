// "Ouro e couro": the tokens of the labs site's next look (Fernando's decision of 15/11: light parchment shell, leather
// header and sidebar, gold borders and titles). The tokens file is the only source: this page injects it scoped to .oc,
// so every example below runs on the new tokens while the shell around it keeps the current ones.
import './ouro-e-couro.css';
import { type ReactNode, useEffect, useState } from 'react';
import { DECISOES_COR, LABS } from '@/lib/labs';
import { ASSETS, carregarFonte } from '../dados';
import {
  contraste,
  cor,
  CORES,
  FAIXAS_TOKENS,
  FONTES,
  MAPA,
  MEDIDAS,
  PARES,
  TOKENS_CSS,
  tokensEm,
} from '../ouro-e-couro';

const ESCOPO = tokensEm('.oc');
const IMAGENS = ['copilot-ui-ouro-aplicado.png', 'chatgpt-ui-ouro.png'];
const MEDIDOS = new Set(MEDIDAS.map((m) => m[5]));
const FAIXAS_NOMES = [
  'Celular 390',
  'Tablet 820 (≥ 640)',
  'Tablet deitado 1180 (≥ 1024)',
  'Desktop 1920 (≥ 1440)',
  'Ultrawide 3440 (≥ 2560)',
];
const ESCALA = [4, 8, 12, 16, 24, 32, 48, 64];

const razao = (r: number) => r.toFixed(2).replace('.', ',') + ':1';

const SECOES: Record<string, string> = {
  referencia: '1. Paleta medida na referência',
  tokens: '2. Tokens semânticos',
  contraste: '3. Contraste WCAG de cada par',
  bordas: '4. Bordas, cantos, sombras e foco',
  tipografia: '5. Tipografia e espaço por faixa',
  exemplos: '6. Exemplos vivos',
  bloco: '7. Bloco pronto para colar',
  mapa: '8. Mapa: token atual → token novo',
};

function Secao({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`oc-${id}`}>
      <h2 id={`oc-${id}`}>{SECOES[id]}</h2>
      {children}
    </section>
  );
}

function Contraste({ frente, fundo, minimo, uso }: { frente: string; fundo: string; minimo: number; uso: string }) {
  const r = contraste(cor(frente), cor(fundo));
  return (
    <tr>
      <td>
        <span style={{ background: cor(fundo), color: cor(frente), padding: '2px 8px', border: '1px solid' }}>Aa</span>
      </td>
      <td>
        {frente} sobre {fundo}
      </td>
      <td>{uso}</td>
      <td>{razao(r)}</td>
      <td>{minimo === 3 ? '3:1 elemento' : '4,5:1 texto'}</td>
      <td className={r >= minimo ? 'oc-passa' : 'oc-falha'}>{r >= minimo ? 'passa' : 'falha'}</td>
    </tr>
  );
}

// a 32 px ability icon from the game's atlas (same sheet as "Em uso: ícones 32 px")
function Icone({ i, escala }: { i: number; escala: number }) {
  const lado = 32 * escala;
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width: lado,
        height: lado,
        background: `url(${ASSETS}/ia/icones/atlas-32-suave.png) -${(i % 6) * lado}px -${Math.floor(i / 6) * lado}px/${6 * lado}px ${4 * lado}px no-repeat`,
      }}
    />
  );
}

export function OuroECouro() {
  useEffect(() => carregarFonte(FONTES), []);
  const [aba, setAba] = useState('Mecânicas');
  const [lupa, setLupa] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const falhas = PARES.filter(([f, b, m]) => contraste(cor(f), cor(b)) < m).length;

  return (
    <div className="oc">
      <style>{ESCOPO}</style>
      <p>
        Casca em pergaminho claro, cabeçalho e barra lateral em couro escuro, bordas e títulos em ouro. Só modo claro.
        Esta área inteira já roda com os tokens novos; a casca em volta continua com os atuais. {PARES.length} pares de
        contraste calculados, {falhas === 0 ? 'todos passam' : `${falhas} falham`}.
      </p>
      <nav aria-label="Índice da página">
        <ol className="oc-indice">
          {Object.entries(SECOES).map(([id, titulo]) => (
            <li key={id}>
              <a href={`#oc-${id}`}>{titulo}</a>
            </li>
          ))}
        </ol>
      </nav>

      <Secao id="referencia">
        <p>
          Cores tiradas dos pixels das duas imagens de IA (pasta <code>public/content/design/ia</code>), com a caixa
          medida (x,y em pixels da imagem) e o método. Pergaminho, folha, tinta, apagado, link e os estados não estão na
          referência: foram derivados para dar contraste e estão marcados como derivados na seção 2.
        </p>
        <div className="oc-grade">
          {IMAGENS.map((f) => (
            <figure key={f} className="oc-folha" style={{ margin: 0 }}>
              <img src={`${ASSETS}/ia/${f}`} alt={`Referência ${f}`} style={{ width: '100%', display: 'block' }} />
              <figcaption className="oc-apagado">{f}</figcaption>
            </figure>
          ))}
        </div>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Cor</th>
                <th>O que é</th>
                <th>Imagem e caixa</th>
                <th>Método</th>
                <th>Virou</th>
              </tr>
            </thead>
            <tbody>
              {MEDIDAS.map(([hex, img, caixa, metodo, oQue, token]) => (
                <tr key={hex + caixa}>
                  <td>
                    <span className="oc-amostra" style={{ background: hex }} />
                    {hex}
                  </td>
                  <td>{oQue}</td>
                  <td>
                    {img.split('-')[0]} {caixa}
                  </td>
                  <td>{metodo}</td>
                  <td>{token}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao id="tokens">
        <div className="oc-grade">
          {Object.entries(CORES).map(([nome, hex]) => (
            <div key={nome} className="oc-cor">
              <span style={{ background: hex }} />
              <strong>{nome}</strong>
              <span className="oc-apagado">
                {hex} · {MEDIDOS.has(nome) ? 'medido' : nome === 'mar' ? 'atual, sem mudança' : 'derivado'}
              </span>
            </div>
          ))}
        </div>
        <p className="oc-apagado">
          O ouro nunca leva texto no pergaminho (3,61:1): lá é só borda. Título no pergaminho usa ouro-escuro; no couro,
          ouro-claro. borda, traco e sobre-tinta mantêm o nome antigo e apontam para ouro, ouro-escuro e creme.
        </p>
      </Secao>

      <Secao id="contraste">
        <p>
          Razão calculada pela luminância relativa do WCAG 2.x a partir dos hex do arquivo de tokens. Mínimo 4,5:1 para
          texto e 3:1 para borda e foco. O botão desligado (apagado sobre pergaminho-escuro) é isento pelo WCAG, mas
          passa assim mesmo.
        </p>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Amostra</th>
                <th>Par</th>
                <th>Uso</th>
                <th>Razão</th>
                <th>Mínimo</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {PARES.map(([frente, fundo, minimo, uso]) => (
                <Contraste key={frente + fundo + minimo} frente={frente} fundo={fundo} minimo={minimo} uso={uso} />
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao id="bordas">
        <div className="oc-grade">
          <div className="oc-folha">
            <h3>Borda fina</h3>
            <p className="oc-apagado">
              <code>--borda-fina</code>: 1 px ouro. Card, campo, tabela. Sombra <code>shadow-folha</code>.
            </p>
          </div>
          <div className="oc-folha oc-dupla">
            <h3>Borda dupla</h3>
            <p className="oc-apagado">
              <code>--borda-dupla</code>: 3 px double ouro. Moldura da casca e do cabeçalho.
            </p>
          </div>
          <div className="oc-couro">
            <h3>Couro com cantos</h3>
            <p className="oc-apagado">
              <code>--cantos</code>: cantoneiras de 12 px em ouro-claro. Sombra <code>shadow-couro</code>.
            </p>
          </div>
          <div className="oc-folha oc-brilho">
            <h3>Brilho</h3>
            <p className="oc-apagado">
              <code>shadow-brilho</code>: o item ativo, como o botão laranja aceso da folha do ChatGPT.
            </p>
          </div>
        </div>
        <h3>Foco visível (duas cores)</h3>
        <p>
          Contorno couro-escuro de 2 px afastado 2 px, com anel ouro-claro de 2 px colado ao elemento: o contorno
          aparece no pergaminho (15,16:1), o anel no couro (7,70:1). Aperte Tab nos botões abaixo; o primeiro de cada
          fundo mostra o foco parado.
        </p>
        <div className="oc-grade">
          <div className="oc-folha oc-fila">
            <button type="button" className="oc-botao oc-foco">
              Foco no pergaminho
            </button>
            <button type="button" className="oc-botao">
              Tab aqui
            </button>
          </div>
          <div className="oc-couro oc-fila">
            <button type="button" className="oc-botao oc-foco">
              Foco no couro
            </button>
            <button type="button" className="oc-botao">
              Tab aqui
            </button>
          </div>
        </div>
      </Secao>

      <Secao id="tipografia">
        <p>
          Títulos em <strong>Cinzel</strong> (serifa romana, só maiúsculas e versaletes; reserva Cormorant Garamond e
          Georgia). Corpo em <strong>Alegreya Sans</strong> (humanista, boa em português; reserva system-ui). As duas
          vêm do Google Fonts.
        </p>
        <div className="oc-folha" style={{ display: 'grid', gap: 8 }}>
          <span className="oc-t1">Ação no coração da batalha</span>
          <h2 style={{ border: 0, padding: 0 }}>Decisões já tomadas, à espera</h2>
          <h3>Ícones de habilidade: poção, espírito, fôlego</h3>
          <p>
            Corpo em Alegreya Sans: a missão começa às três horas; você escolhe a formação, o líder e até quem fica na
            retaguarda. Acentos: á à â ã é ê í ó ô õ ú ç. <em>Itálico para nota</em>,{' '}
            <strong>negrito para ênfase</strong>, <a href="#oc-tipografia">link no pergaminho</a>.
          </p>
          <p className="oc-apagado">Legenda e texto secundário no tamanho --legenda.</p>
        </div>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Faixa</th>
                <th>--texto</th>
                <th>--h1</th>
                <th>--h2</th>
                <th>--h3</th>
                <th>--legenda</th>
                <th>--margem</th>
                <th>--respiro</th>
              </tr>
            </thead>
            <tbody>
              {FAIXAS_TOKENS.map((f, i) => (
                <tr key={FAIXAS_NOMES[i]}>
                  <td>{FAIXAS_NOMES[i]}</td>
                  {['texto', 'h1', 'h2', 'h3', 'legenda', 'margem', 'respiro'].map((k) => (
                    <td key={k}>{f[k]} px</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="oc-apagado">
          Mesmos números das faixas do redesign responsivo. Esta área usa a faixa da sua tela agora. Escala de espaço (a
          do Tailwind, passo de 4 px):
        </p>
        <div className="oc-fila">
          {ESCALA.map((n) => (
            <span key={n} className="oc-apagado" style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
              <span style={{ width: n, height: n, background: 'var(--color-ouro)' }} />
              {n}
            </span>
          ))}
        </div>
      </Secao>

      <Secao id="exemplos">
        <h3>Cabeçalho, barra lateral e card</h3>
        <div className="oc-casca">
          <header className="oc-cab">
            <strong>GDD Dungeon Tactics</strong>
            <a href="#oc-exemplos">Mapa dos labs</a>
            <span style={{ color: 'var(--color-creme-apagado)' }}>Laboratório de design</span>
          </header>
          <div className="oc-corpo">
            <nav className="oc-lado" aria-label="Exemplo de barra lateral">
              <span className="oc-apagado">Interface</span>
              <a href="#oc-exemplos" aria-current="page">
                Ouro e couro
              </a>
              <a href="#oc-exemplos">Ícones 32 px</a>
              <a href="#oc-exemplos">Telas</a>
              <span className="oc-apagado">Personagens</span>
              <a href="#oc-exemplos">Rostos</a>
            </nav>
            <div className="oc-meio">
              <h2 style={{ border: 0, padding: 0 }}>Ouro e couro</h2>
              <div className="oc-folha">
                <h3>Card na folha</h3>
                <p>
                  Texto em tinta, <span className="oc-apagado">secundário em apagado</span> e{' '}
                  <a href="#oc-exemplos">um link</a>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <h3>Botão em 4 estados</h3>
        <div className="oc-fila">
          <button type="button" className="oc-botao">
            Normal
          </button>
          <button type="button" className="oc-botao oc-hover">
            Mouse em cima
          </button>
          <button type="button" className="oc-botao" aria-pressed="true">
            Pressionado
          </button>
          <button type="button" className="oc-botao" aria-disabled="true">
            Desligado
          </button>
        </div>

        <h3>Campo</h3>
        <div className="oc-grade">
          <div className="oc-campo">
            <label htmlFor="oc-nome">Nome da página</label>
            <input id="oc-nome" defaultValue="Ouro e couro" aria-describedby="oc-nome-ajuda" />
            <span id="oc-nome-ajuda" className="oc-apagado">
              Aparece no menu e no título da aba.
            </span>
          </div>
          <div className="oc-campo">
            <label htmlFor="oc-ouro">Ouro da vitória</label>
            <input id="oc-ouro" defaultValue="-150" aria-invalid="true" aria-describedby="oc-ouro-erro" />
            <span id="oc-ouro-erro" className="oc-erro">
              Use um número de 0 a 999.
            </span>
          </div>
        </div>

        <h3>Abas</h3>
        <div className="oc-folha" style={{ display: 'grid', gap: 12 }}>
          <div className="oc-abas" role="tablist" aria-label="Exemplo de abas">
            {['Mecânicas', 'Narrativa', 'Música'].map((a) => (
              <button key={a} type="button" role="tab" aria-selected={aba === a} onClick={() => setAba(a)}>
                {a}
              </button>
            ))}
          </div>
          <p role="tabpanel" aria-label={aba}>
            Conteúdo da aba {aba}.
          </p>
        </div>

        <h3>Tabela</h3>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Classe</th>
                <th>Mov.</th>
                <th>Salto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cavaleiro</td>
                <td>3</td>
                <td>1</td>
                <td className="oc-passa">pronto</td>
              </tr>
              <tr>
                <td>Lanceiro</td>
                <td>4</td>
                <td>3</td>
                <td style={{ color: 'var(--color-aviso)' }}>esperando</td>
              </tr>
              <tr>
                <td>Maga</td>
                <td>3</td>
                <td>2</td>
                <td className="oc-falha">ferida</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Avisos</h3>
        <div className="oc-grade">
          {(
            [
              ['sucesso', 'Publicado', 'O site público já mostra a versão nova.'],
              ['aviso', 'Atenção', 'Esta página ainda não foi conferida no celular.'],
              ['erro', 'Falhou', 'O build parou: confira o console.'],
            ] as const
          ).map(([tom, titulo, texto]) => (
            <div
              key={tom}
              className="oc-aviso"
              role={tom === 'erro' ? 'alert' : 'status'}
              style={{
                background: `var(--color-${tom}-suave)`,
                color: `var(--color-${tom})`,
                borderColor: `var(--color-${tom})`,
              }}
            >
              <strong>{titulo}</strong>
              {texto}
            </div>
          ))}
        </div>

        <h3>Card de ícone</h3>
        <div className="oc-fila" style={{ alignItems: 'start' }}>
          {(
            [
              [0, 'Golpe'],
              [15, 'Cura'],
            ] as const
          ).map(([i, nome]) => (
            <div key={nome} className="oc-icone">
              <h3>{nome}</h3>
              <div>
                <Icone i={i} escala={1} />
                <Icone i={i} escala={1.5} />
                <Icone i={i} escala={2} />
              </div>
              {lupa && (
                <div>
                  <Icone i={i} escala={4} />
                </div>
              )}
              <button type="button" className="oc-botao" aria-pressed={lupa} onClick={() => setLupa(!lupa)}>
                Lupa 4x
              </button>
            </div>
          ))}
        </div>
      </Secao>

      <Secao id="bloco">
        <p>
          Arquivo <code>web/src/content/design/ouro-e-couro.tokens.css</code>, não ligado ao app. Substitui os blocos{' '}
          <code>@theme</code> e <code>:root</code> de <code>src/index.css</code>; o link das fontes vai no{' '}
          <code>index.html</code>.
        </p>
        <div className="oc-fila">
          <button
            type="button"
            className="oc-botao"
            onClick={() => navigator.clipboard.writeText(TOKENS_CSS).then(() => setCopiado(true))}
          >
            {copiado ? 'Copiado' : 'Copiar o bloco'}
          </button>
        </div>
        <pre>
          <code>{TOKENS_CSS}</code>
        </pre>
      </Secao>

      <Secao id="mapa">
        <p>
          Cada token de <code>src/index.css</code>. “Mesmo nome” troca só o valor: as classes continuam valendo.
          “Renomear” pede trocar as classes (busca e troca). Usos: contagem aproximada por busca em <code>src</code> em
          15/11.
        </p>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Atual</th>
                <th>Novo</th>
                <th>Como</th>
                <th>Usos</th>
              </tr>
            </thead>
            <tbody>
              {MAPA.map(([atual, novo, como, usos]) => (
                <tr key={atual + novo}>
                  <td>{atual}</td>
                  <td>{novo}</td>
                  <td>{como}</td>
                  <td>{usos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Cores dos labs (lib/labs.ts) nos fundos novos</h3>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Lab</th>
                <th>cor no pergaminho</th>
                <th>cor na folha</th>
                <th>cor no corSuave</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...LABS.map((l) => [l.curto, l.cor, l.corSuave]),
                ['Decisões', DECISOES_COR.cor, DECISOES_COR.corSuave],
              ].map(([nome, c, suave]) => (
                <tr key={nome}>
                  <td>
                    <span className="oc-amostra" style={{ background: c }} />
                    {nome}
                  </td>
                  {[CORES.pergaminho!, CORES.folha!, suave!].map((fundo) => {
                    const r = contraste(c!, fundo);
                    return (
                      <td key={fundo} className={r >= 4.5 ? 'oc-passa' : 'oc-falha'}>
                        {razao(r)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>
    </div>
  );
}
