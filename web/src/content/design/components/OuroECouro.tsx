// "Ouro e couro": the showcase of the site's own "Noite" scheme. Nothing is scoped or overridden here: every colour is a
// var(--color-*) of src/index.css, so this page follows the theme switch, and the tables list each token's light and dark
// value side by side (read from that same file, see ../ouro-e-couro.ts).
import './ouro-e-couro.css';
import { type ReactNode, useState } from 'react';
import { DECISOES_COR, LABS } from '@/lib/labs';
import { ASSETS } from '../dados';
import { contraste, CORES, FAIXAS_TOKENS, misturar, PARES } from '../ouro-e-couro';

const TEMAS = ['claro', 'escuro'] as const;
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
  cores: '1. Cores nos dois temas',
  contraste: '2. Contraste WCAG de cada par',
  bordas: '3. Bordas, cantos, sombras e foco',
  tipografia: '4. Tipografia e espaço por faixa',
  exemplos: '5. Exemplos vivos',
  labs: '6. Cores dos labs nos dois temas',
};

function Secao({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`oc-${id}`}>
      <h2 id={`oc-${id}`}>{SECOES[id]}</h2>
      {children}
    </section>
  );
}

const par = (frente: string, fundo: string) => TEMAS.map((t) => contraste(CORES[t][frente]!, CORES[t][fundo]!));
const falhas = (minimo: number, rs: number[]) => rs.some((r) => r < minimo);

function Contraste({ frente, fundo, minimo, uso }: { frente: string; fundo: string; minimo: number; uso: string }) {
  const rs = par(frente, fundo);
  return (
    <tr>
      <td>
        {TEMAS.map((t) => (
          <span
            key={t}
            className="oc-aa"
            style={{ background: CORES[t][fundo], color: CORES[t][frente] }}
            title={`tema ${t}`}
          >
            Aa
          </span>
        ))}
      </td>
      <td>
        {frente} sobre {fundo}
      </td>
      <td>{uso}</td>
      {rs.map((r, i) => (
        <td key={TEMAS[i]} className={r >= minimo ? 'oc-passa' : 'oc-falha'}>
          {razao(r)}
        </td>
      ))}
      <td>{minimo === 3 ? '3:1 elemento' : '4,5:1 texto'}</td>
      <td className={falhas(minimo, rs) ? 'oc-falha' : 'oc-passa'}>{falhas(minimo, rs) ? 'falha' : 'passa'}</td>
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
  const [aba, setAba] = useState('Mecânicas');
  const [lupa, setLupa] = useState(false);
  const reprovados = PARES.filter(([f, b, m]) => falhas(m, par(f, b))).length;

  return (
    <div className="oc">
      <p>
        Esquema "Noite" do site: cinza-azulado, couro azul-marinho e ouro quente. Esta página usa os tokens reais de{' '}
        <code>src/index.css</code>, sem cores próprias: troque o tema no cabeçalho e tudo muda junto. No escuro cada par
        se inverte em vez de só escurecer: o pergaminho vira azul-noite com tinta clara, e o couro vira claro com creme
        escuro por cima. {PARES.length} pares de contraste calculados nos dois temas,{' '}
        {reprovados === 0 ? 'todos passam' : `${reprovados} falham`}.
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

      <Secao id="cores">
        <p>
          Valor de cada token no tema claro (bloco <code>@theme</code>) e no escuro (bloco{' '}
          <code>[data-theme='dark']</code>, igual ao do sistema). borda, traco e sobre-tinta são apelidos de ouro,
          ouro-escuro e creme.
        </p>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Token</th>
                <th>Claro</th>
                <th>Escuro</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(CORES.claro).map((nome) => (
                <tr key={nome}>
                  <td>
                    <code>--color-{nome}</code>
                  </td>
                  {TEMAS.map((t) => (
                    <td key={t}>
                      <span className="oc-amostra" style={{ background: CORES[t][nome] }} />
                      {CORES[t][nome]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="oc-apagado">
          O ouro leva borda; texto no pergaminho usa ouro-escuro, e no couro, ouro-claro (no escuro os dois trocam de
          lado junto com o couro).
        </p>
      </Secao>

      <Secao id="contraste">
        <p>
          Razão calculada pela luminância relativa do WCAG 2.x a partir dos hex de cada tema. Mínimo 4,5:1 para texto e
          3:1 para borda e foco. O botão desligado (apagado sobre pergaminho-escuro) é isento pelo WCAG, mas é medido
          assim mesmo.
        </p>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Amostra (claro, escuro)</th>
                <th>Par</th>
                <th>Uso</th>
                <th>Claro</th>
                <th>Escuro</th>
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
          aparece no pergaminho ({razao(par('couro-escuro', 'pergaminho')[0]!)} no claro,{' '}
          {razao(par('couro-escuro', 'pergaminho')[1]!)} no escuro), o anel no couro (
          {razao(par('ouro-claro', 'couro')[0]!)} e {razao(par('ouro-claro', 'couro')[1]!)}). Aperte Tab nos botões
          abaixo; o primeiro de cada fundo mostra o foco parado.
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
          Títulos em <strong>Palatino</strong> (serifa do menu 3D do jogo; reserva Book Antiqua e Georgia, fontes do
          sistema, sem arquivo). Corpo em <strong>Alegreya Sans</strong> (humanista, boa em português; reserva
          system-ui).
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
          Faixas de tela do lab. Esta área usa a faixa da sua tela agora. Escala de espaço (a do Tailwind, passo de 4
          px):
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

      <Secao id="labs">
        <p>
          A cor de cada lab (<code>lib/labs.ts</code>) sobre os fundos do tema. No escuro o site clareia a cor (45% dela
          com branco, para texto) e escurece o fundo suave (30% dela com a folha), como em <code>--lab-tom</code> e{' '}
          <code>--lab-soft-tom</code>; os números abaixo seguem essa conta.
        </p>
        <div className="oc-rolar">
          <table className="oc-tabela">
            <thead>
              <tr>
                <th>Lab</th>
                <th>claro: no pergaminho</th>
                <th>claro: no corSuave</th>
                <th>escuro: no pergaminho</th>
                <th>escuro: no fundo suave</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...LABS.map((l) => [l.curto, l.cor, l.corSuave]),
                ['Decisões', DECISOES_COR.cor, DECISOES_COR.corSuave],
              ].map(([nome, c, suave]) => {
                const tom = misturar(c!, 0.45, '#ffffff');
                const fundoSuave = misturar(c!, 0.3, CORES.escuro.folha!);
                return (
                  <tr key={nome}>
                    <td>
                      <span className="oc-amostra" style={{ background: c }} />
                      {nome}
                    </td>
                    {[
                      contraste(c!, CORES.claro.pergaminho!),
                      contraste(c!, suave!),
                      contraste(tom, CORES.escuro.pergaminho!),
                      contraste(tom, fundoSuave),
                    ].map((r, i) => (
                      <td key={i} className={r >= 4.5 ? 'oc-passa' : 'oc-falha'}>
                        {razao(r)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Secao>
    </div>
  );
}
