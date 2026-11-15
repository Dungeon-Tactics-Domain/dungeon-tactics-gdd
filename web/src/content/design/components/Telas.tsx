// Mock-ups of three game screens in the FFT Clássico kit (Fernando's request of 15/11): end of battle, world map with a
// town, title with options. They are the reference the game's orchestrator rebuilds these screens from, so they only use
// the kit's pieces (KitFft.tsx) and its tokens; names, towns, items and prices are the game's (src/content).
import './fft-kit.css';
import './telas.css';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { ASSETS, carregarFonte, FONTE_FFT, ROSTO, rostoFim } from '../dados';
import { Botao, Choice, Counter, Gauge, Menu, type Row, Scene, Slider } from './KitFft';

type Tr = (pt: string, en: string) => string;
const css = (v: Record<string, string>) => v as CSSProperties;

// AI face sheets, 8 frames of 256 px; 128 px is exactly half a frame (sharp), 64 px a quarter
function Rosto({
  id,
  q,
  rotulo,
  lado = 128,
  caido,
}: {
  id: string;
  q: number;
  rotulo: string;
  lado?: number;
  caido?: boolean;
}) {
  return (
    <span
      className={`tl-face${caido ? ' caido' : ''}`}
      role="img"
      aria-label={rotulo}
      style={css({
        '--sheet': `url(${ASSETS}/chars/ia-alinhado-rosto/${id}.png)`,
        '--lado': `${lado}px`,
        backgroundPositionX: `${(q * 100) / 7}%`,
      })}
    />
  );
}

// the game's story party and first recruit (src/content/party.ts); the face is the class's model (warrior = knight)
interface Membro {
  id: string;
  nome: string;
  cls: [string, string];
  nv: number;
  hp: [number, number];
  mp: [number, number];
}
const GRUPO: Membro[] = [
  { id: 'knight', nome: 'Bran', cls: ['Guerreiro', 'Warrior'], nv: 5, hp: [46, 52], mp: [6, 10] },
  { id: 'ranger', nome: 'Tess', cls: ['Arqueira', 'Archer'], nv: 5, hp: [34, 38], mp: [8, 12] },
  { id: 'mage', nome: 'Odo', cls: ['Mago', 'Mage'], nv: 4, hp: [30, 30], mp: [20, 24] },
  { id: 'rogue_hooded', nome: 'Lia', cls: ['Ladina', 'Rogue'], nv: 4, hp: [36, 36], mp: [5, 10] },
  { id: 'lancer', nome: 'Ivo', cls: ['Lanceiro', 'Lancer'], nv: 2, hp: [40, 44], mp: [4, 8] },
];
// life of the 4 who fought, at the end: the victory covers smiling, hurt (below 30%) and fallen; the defeat, fallen and standing
const VIDA_FIM = { vitoria: [46, 9, 0, 30], derrota: [0, 0, 0, 20] };

const expressao = (t: Tr, q: number, caido: boolean) =>
  caido
    ? t('caído, rosto ferido', 'fallen, hurt face')
    : q === ROSTO.sorrindo
      ? t('sorrindo', 'smiling')
      : q === ROSTO.ferido
        ? t('ferido', 'hurt')
        : t('neutro', 'neutral');

function FimDeBatalha({ t, vitoria }: { t: Tr; vitoria: boolean }) {
  const vida = vitoria ? VIDA_FIM.vitoria : VIDA_FIM.derrota;
  const vivos = vida.filter((v) => v > 0).length;
  return (
    <div className="tl-fim">
      <strong className={`panel tl-banner${vitoria ? '' : ' derrota'}`}>
        {vitoria ? t('Vitória!', 'Victory!') : t('Derrota', 'Defeat')}
      </strong>
      <ul className="tl-herois">
        {GRUPO.slice(0, 4).map((m, i) => {
          const hp = vida[i]!;
          const caido = hp <= 0;
          const q = rostoFim(hp, m.hp[1], vitoria);
          return (
            <li key={m.id} className="panel tl-heroi">
              <Rosto id={m.id} q={q} caido={caido} rotulo={`${m.nome}: ${expressao(t, q, caido)}`} />
              <strong className="unit-name">
                {m.nome}
                <span className="tl-nv">
                  {t('Nv.', 'Lv.')} {m.nv}
                </span>
              </strong>
              <span className="unit-class">{t(...m.cls)}</span>
              <Gauge cls="hp" label={t('VIDA', 'HP')} value={hp} max={m.hp[1]} />
              <span className={caido ? 'tl-caido' : 'tl-ganho'}>
                {caido ? t('Caído · sem EXP', 'Fallen · no EXP') : vitoria ? '+40 EXP' : '+0 EXP'}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="panel tl-espolio">
        <div className="panel-head">{t('Resultado', 'Results')}</div>
        <dl>
          <dt>{t('Ouro', 'Gold')}</dt>
          <dd>{vitoria ? '+150' : '+0'}</dd>
          <dt>{t('Experiência', 'Experience')}</dt>
          <dd>{vitoria ? t(`+${40 * vivos} (40 por vivo)`, `+${40 * vivos} (40 each standing)`) : '+0'}</dd>
          <dt>{t('Itens', 'Items')}</dt>
          <dd>{vitoria ? t('Poção ×2, Lâmina de ferro', 'Potion ×2, Iron blade') : '—'}</dd>
        </dl>
        <div className="tl-acoes">
          <Botao cls="primary" label={t('Continuar', 'Continue')} k="Enter" />
        </div>
      </div>
    </div>
  );
}

// ---------- world map and towns ----------

// the game's world nodes and road order (src/content/world.ts), x and y in % of the map
const NOS: { id: string; nome: [string, string]; x: number; y: number; cidade?: boolean }[] = [
  { id: 'vauclair', nome: ['Vila de Vauclair', 'Vauclair Village'], x: 14, y: 80, cidade: true },
  { id: 'road', nome: ['Estrada de Cinzas', 'Ash Road'], x: 27, y: 64 },
  { id: 'hill', nome: ['Colina do Farol', 'Beacon Hill'], x: 42, y: 70 },
  { id: 'lake', nome: ['Margem do Lago Escuro', 'Dark Lake Shore'], x: 52, y: 52 },
  { id: 'crypt', nome: ['Cripta Alagada', 'Flooded Crypt'], x: 62, y: 60 },
  { id: 'heart', nome: ['Coração da Cripta', 'Heart of the Crypt'], x: 70, y: 46 },
  { id: 'beacon', nome: ['O Último Farol', 'The Last Beacon'], x: 56, y: 34 },
  { id: 'camp', nome: ['Acampamento na Neve', 'Snow Camp'], x: 70, y: 24, cidade: true },
  { id: 'pass', nome: ['Passo Gelado', 'Frost Pass'], x: 80, y: 32 },
  { id: 'summit', nome: ['O Cume', 'The Summit'], x: 88, y: 14 },
];
const ANDADO = 4; // nodes already reached: the road up to here is solid, the rest dashed
const pontos = (n: typeof NOS) => n.map((p) => `${p.x},${p.y}`).join(' ');
const OURO = 200; // in the chest: buys some items, not all (shows the "N short" line), and pays one recruit

// the game's shop list (src/content/items.ts)
const LOJA: [pt: string, en: string, tipoPt: string, tipoEn: string, preco: number][] = [
  ['Lâmina de ferro', 'Iron blade', 'arma', 'weapon', 120],
  ['Arco de caça', 'Hunter bow', 'arma', 'weapon', 140],
  ['Cajado de freixo', 'Ash staff', 'arma', 'weapon', 150],
  ['Gibão de couro', 'Leather vest', 'armadura', 'armor', 100],
  ['Cota de malha', 'Chain mail', 'armadura', 'armor', 220],
  ['Manto guardado', 'Warded robe', 'armadura', 'armor', 160],
  ['Botas ligeiras', 'Swift boots', 'acessório', 'accessory', 200],
  ['Grevas de mola', 'Spring greaves', 'acessório', 'accessory', 180],
  ['Amuleto ligeiro', 'Quick charm', 'acessório', 'accessory', 240],
];
const RECRUTA = 200; // RECRUIT_COST in the game's group.ts

const ESTADOS_MAPA = ['mapa', 'cidade', 'loja', 'taverna', 'ficha'] as const;
type EstadoMapa = (typeof ESTADOS_MAPA)[number];

const Preco = ({ v }: { v: number }) => (
  <span className="counter gold tl-preco">
    <strong>{v}</strong>
  </span>
);

function Loja({ t }: { t: Tr }) {
  return (
    <div className="panel tl-janela" role="region" aria-label={t('Loja', 'Shop')}>
      <div className="panel-head">
        {t('Loja', 'Shop')}
        <span className="item-cost">{t(`Ouro no baú: ${OURO}`, `Gold in chest: ${OURO}`)}</span>
      </div>
      {LOJA.map(([pt, en, tPt, tEn, preco]) => {
        const falta = preco - OURO;
        return (
          <div key={pt} className="tl-linha">
            <span className="tl-item">
              {t(pt, en)} <small>{t(tPt, tEn)}</small>
            </span>
            <Preco v={preco} />
            <span className="tl-acao">
              <button type="button" className="secondary" disabled={falta > 0}>
                {t('Comprar', 'Buy')}
              </button>
              {falta > 0 && <span className="item-why">{t(`faltam ${falta}`, `${falta} short`)}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Taverna({ t }: { t: Tr }) {
  return (
    <div className="panel tl-janela" role="region" aria-label={t('Taverna', 'Tavern')}>
      <div className="panel-head">
        {t('Taverna', 'Tavern')}
        <span className="item-cost">
          {t(`Grupo ${GRUPO.length} de 8 · ouro ${OURO}`, `Party ${GRUPO.length} of 8 · gold ${OURO}`)}
        </span>
      </div>
      <p className="tl-boato">
        {t(
          '“Dizem que a luz do farol foi vista de novo no Passo Gelado.” (boato de exemplo)',
          '“They say the beacon light was seen again at Frost Pass.” (sample rumor)',
        )}
      </p>
      {GRUPO.map((m) => (
        <div key={m.id} className="tl-linha com-rosto">
          <Rosto id={m.id} q={ROSTO.neutro} lado={64} rotulo={t(...m.cls)} />
          <span className="tl-item">
            {t(`Recrutar ${m.cls[0].toLowerCase()}`, `Recruit a ${m.cls[1].toLowerCase()}`)}
          </span>
          <Preco v={RECRUTA} />
          <span className="tl-acao">
            <button type="button" className="secondary">
              {t('Recrutar', 'Recruit')}
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

function FichaDoGrupo({ t }: { t: Tr }) {
  return (
    <div className="panel tl-janela" role="region" aria-label={t('Ficha do grupo', 'Party')}>
      <div className="panel-head">
        {t('Ficha do grupo', 'Party')}
        <span className="item-cost">{t(`${GRUPO.length} de 8`, `${GRUPO.length} of 8`)}</span>
      </div>
      <ul className="tl-fichas">
        {GRUPO.map((m) => (
          <li key={m.id} className="tl-ficha">
            <Rosto id={m.id} q={ROSTO.neutro} rotulo={`${m.nome}: ${t('neutro', 'neutral')}`} />
            <div>
              <strong className="unit-name">
                {m.nome}
                <span className="tl-nv">
                  {t('Nv.', 'Lv.')} {m.nv}
                </span>
              </strong>
              <span className="unit-class">{t(...m.cls)}</span>
              <Gauge cls="hp" label={t('VIDA', 'HP')} value={m.hp[0]} max={m.hp[1]} />
              <Gauge cls="mp" label="MP" value={m.mp[0]} max={m.mp[1]} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mapa({ t, estado, lang }: { t: Tr; estado: EstadoMapa; lang: string }) {
  const cidade = NOS[0]!;
  const linha = (id: EstadoMapa, label: string, orb: Row['orb']): Row => ({
    label,
    orb,
    state: estado === id ? 'picked' : estado === 'cidade' && id === 'loja' ? 'focus' : undefined,
  });
  return (
    <div className="tl-mapa">
      {/* drawing, not interface: sea, land, highlands, river and lake in the spirit of the game's .world-art */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect className="tl-mar" width="100" height="100" />
        <path className="tl-terra" d="M4 96 C2 80, 6 62, 14 52 C20 40, 30 30, 44 22 C56 12, 70 4, 98 3 L98 97 Z" />
        <path className="tl-alto" d="M58 3 C72 2, 92 1, 98 3 L98 50 C90 46, 84 38, 76 36 C68 32, 62 24, 58 14 Z" />
        <ellipse className="tl-neve" cx="86" cy="10" rx="13" ry="8" />
        <ellipse className="tl-mata" cx="34" cy="58" rx="8" ry="6" />
        <ellipse className="tl-mata" cx="64" cy="70" rx="9" ry="7" />
        <path className="tl-rio" d="M90 30 C84 38, 76 40, 70 46 S62 52, 60 54" />
        <ellipse className="tl-lago" cx="56" cy="56" rx="5" ry="4" />
        <polyline className="tl-estrada" points={pontos(NOS)} />
        <polyline className="tl-estrada andada" points={pontos(NOS.slice(0, ANDADO))} />
      </svg>
      {NOS.map((n, i) => (
        <span
          key={n.id}
          className={`tl-no${n.cidade ? ' vila' : ''}${n === cidade ? ' atual' : ''}`}
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <span className={`orb ${n.cidade ? 'gold' : i < ANDADO ? 'blue' : 'off'}`} aria-hidden="true" />
          <span className="tl-no-nome">{t(...n.nome)}</span>
        </span>
      ))}
      <Counter cls="gold" label={t('Ouro', 'Gold')} value={String(OURO)} />
      {estado === 'mapa' ? (
        <div className="panel tl-info">
          <strong className="unit-name">{t(...cidade.nome)}</strong>
          <span className="unit-class">{t('Cidade: loja, taverna e grupo', 'Town: shop, tavern and party')}</span>
          <span className="tl-dica">
            {t('Enter entra · setas movem · Esc volta', 'Enter goes in · arrows move · Esc back')}
          </span>
        </div>
      ) : (
        <div className="tl-cidade">
          <Menu
            key={`${estado}-${lang}`}
            cls="commands"
            title={t(...cidade.nome)}
            rows={[
              linha('loja', t('Loja', 'Shop'), 'gold'),
              linha('taverna', t('Taverna', 'Tavern'), 'blue'),
              linha('ficha', t('Ficha do grupo', 'Party'), 'blue'),
              { label: t('Sair', 'Leave'), orb: 'bronze' },
            ]}
          />
        </div>
      )}
      {estado === 'loja' && <Loja t={t} />}
      {estado === 'taverna' && <Taverna t={t} />}
      {estado === 'ficha' && <FichaDoGrupo t={t} />}
    </div>
  );
}

// ---------- title and options ----------

function Titulo({ t, opcoes, lang }: { t: Tr; opcoes: boolean; lang: string }) {
  return (
    <div className={`tl-titulo${opcoes ? ' opcoes' : ''}`}>
      {opcoes ? (
        // keyed by language: choice() and slider() keep their own state, as in the game
        <div key={lang} className="panel tl-opcoes" role="region" aria-label={t('Opções', 'Options')}>
          <div className="panel-head">{t('Opções', 'Options')}</div>
          <div className="tl-opcoes-corpo">
            <Choice
              label={t('Idioma', 'Language')}
              options={[
                ['pt', 'Português'],
                ['en', 'English'],
              ]}
              value={lang}
            />
            <Choice
              label={t('Ângulo da câmera', 'Camera angle')}
              options={[
                ['alto', t('Alto', 'High')],
                ['medio', t('Médio', 'Medium')],
                ['baixo', t('Baixo', 'Low')],
              ]}
              value="medio"
            />
            <Choice
              label={t('Velocidade do texto das conversas', 'Dialogue text speed')}
              options={[
                ['normal', 'Normal'],
                ['fast', t('Rápida', 'Fast')],
                ['instant', t('Instantânea', 'Instant')],
              ]}
              value="normal"
            />
            <Slider label={t('Música', 'Music')} value={40} />
            <Slider label={t('Efeitos', 'Effects')} value={70} />
          </div>
          <div className="tl-acoes">
            <Botao cls="secondary" label={t('Voltar', 'Back')} k="Esc" />
          </div>
        </div>
      ) : (
        <>
          <strong className="tl-nome">Dungeon Tactics</strong>
          <Menu
            key={lang}
            cls="commands"
            title={t('Menu', 'Menu')}
            rows={[
              { label: t('Novo jogo', 'New game'), orb: 'gold', state: 'focus' },
              { label: t('Continuar', 'Continue'), orb: 'blue' },
              { label: t('Opções', 'Options'), orb: 'bronze' },
            ]}
          />
          <span className="tl-dica">{t('Setas escolhem · Enter confirma', 'Arrows choose · Enter confirms')}</span>
        </>
      )}
    </div>
  );
}

// ---------- page ----------

// lab control (not part of the mock-up): one pressed button per group
function Opcoes<T extends string>({
  rotulo,
  itens,
  valor,
  onPick,
}: {
  rotulo: string;
  itens: [T, string][];
  valor: T;
  onPick: (v: T) => void;
}) {
  return (
    <div className="tl-bar" role="group" aria-label={rotulo}>
      <span className="tl-rot">{rotulo}</span>
      {itens.map(([v, texto]) => (
        <button key={v} type="button" aria-pressed={v === valor} onClick={() => onPick(v)}>
          {texto}
        </button>
      ))}
    </div>
  );
}

function Maquete({
  titulo,
  nota,
  controles,
  legenda,
  w,
  h,
  children,
}: {
  titulo: string;
  nota: string;
  controles: ReactNode;
  legenda: [kit: string, novas: string, obrigatorio: string, opcional: string, jogoHoje: string];
  w: number;
  h: number;
  children: ReactNode;
}) {
  return (
    <section className="fft-piece tl-maquete" aria-label={titulo}>
      <h3>{titulo}</h3>
      <p className="fft-note">{nota}</p>
      <div className="tl-controles">{controles}</div>
      <div className="fft">
        <Scene w={w} h={h}>
          {children}
        </Scene>
      </div>
      <ul className="tl-legenda">
        <li>
          <b>Peças do kit:</b> {legenda[0]}
        </li>
        <li>
          <b>Peças novas (entram no design system do jogo):</b> {legenda[1]}
        </li>
        <li>
          <b>Obrigatório:</b> {legenda[2]}
        </li>
        <li>
          <b>Opcional:</b> {legenda[3]}
        </li>
        <li>
          <b>Diferente do jogo hoje:</b> {legenda[4]}
        </li>
      </ul>
    </section>
  );
}

const ROTULO_MAPA: Record<EstadoMapa, string> = {
  mapa: 'Mapa',
  cidade: 'Cidade',
  loja: 'Loja',
  taverna: 'Taverna',
  ficha: 'Ficha do grupo',
};

export function Telas() {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [tam, setTam] = useState<'1920' | '1280'>('1920');
  const [fim, setFim] = useState<'vitoria' | 'derrota'>('vitoria');
  const [mapa, setMapa] = useState<EstadoMapa>('cidade');
  const [titulo, setTitulo] = useState<'titulo' | 'opcoes'>('titulo');
  useEffect(() => carregarFonte(FONTE_FFT), []);
  const t: Tr = (pt, en) => (lang === 'pt' ? pt : en);
  const [w, h] = tam === '1920' ? [1920, 1080] : [1280, 720];
  // language and size are shared by the three mock-ups; each one repeats them so the switch is next to what it changes
  const comuns = (
    <>
      <Opcoes
        rotulo="Idioma"
        itens={[
          ['pt', 'Português'],
          ['en', 'English'],
        ]}
        valor={lang}
        onPick={setLang}
      />
      <Opcoes
        rotulo="Tela"
        itens={[
          ['1920', '1920×1080'],
          ['1280', '1280×720'],
        ]}
        valor={tam}
        onPick={setTam}
      />
    </>
  );
  return (
    <div className="tl min-w-0">
      <p className="fft-note">
        Maquetes para o orquestrador do jogo refazer estas telas, com as peças do kit FFT Clássico e seus tokens; o que
        o kit não tinha está em "Peças novas" na legenda de cada uma. Nomes, cidades, itens e preços vêm do jogo. Em
        1280×720 as peças mantêm o tamanho em pixels do kit e a tela fica mais cheia, como no jogo.
      </p>
      <Maquete
        titulo="1. Fim de batalha"
        nota="Vitória: quem está de pé sorri; abaixo de 30% de vida, quadro ferido; caído, ferido em cinza. Derrota: caídos feridos, quem ficou de pé neutro."
        controles={
          <>
            {comuns}
            <Opcoes
              rotulo="Resultado"
              itens={[
                ['vitoria', 'Vitória'],
                ['derrota', 'Derrota'],
              ]}
              valor={fim}
              onPick={setFim}
            />
          </>
        }
        legenda={[
          'painel com cabeçalho (.panel, .panel-head), barra de VIDA (gauge), nome e classe da ficha (.unit-name, .unit-class), botão primário com tecla (Enter).',
          'rosto pintado de 128 px fora da janela de conversa (quadros 6 sorrindo, 5 ferido, 0 neutro; hoje o design system só o usa na conversa), cartão de herói do resultado, faixa de título Vitória/Derrota, painel de resultado em colunas.',
          'título Vitória/Derrota, um cartão por quem lutou (rosto, nome, classe, VIDA), regra do rosto (sorrindo / ferido abaixo de 30% / caído), painel de resultado com ouro, experiência e itens, botão Continuar.',
          'nível no cartão, EXP por pessoa, rosto caído em cinza, faixa vinho na derrota, fundo da batalha escurecido.',
          'o jogo não tem experiência nem nível (números de exemplo, pedidos para esta tela); o fim de batalha de hoje (game/end-screens.ts) tem uma frase e os botões "Voltar ao mapa" ou "Tentar de novo" + "Mapa", não "Continuar".',
        ]}
        w={w}
        h={h}
      >
        <FimDeBatalha t={t} vitoria={fim === 'vitoria'} />
      </Maquete>
      <Maquete
        titulo="2. Mapa-múndi e cidades"
        nota="Mapa com caminho andado (cheio) e por andar (tracejado); cidade é marcador quadrado dourado, batalha é redondo. Selecionar a cidade abre o menu dela; Loja, Taverna e Ficha abrem ao lado com o comando marcado."
        controles={
          <>
            {comuns}
            <Opcoes
              rotulo="Estado"
              itens={ESTADOS_MAPA.map((e) => [e, ROTULO_MAPA[e]])}
              valor={mapa}
              onPick={setMapa}
            />
          </>
        }
        legenda={[
          'menu de comandos (Menu: foco ▶, selecionado ▸), painel com cabeçalho, contador de ouro (.counter.gold), linhas de lista (.item-cost, .item-why), botão secundário (desativado apagado + motivo), barras VIDA e MP, bola .orb.',
          'marcador de lugar no mapa (bola + nome; cidade quadrada, batalha redonda) com cursor ▼, linha de loja/taverna (nome, preço com moeda, botão à direita), cartão da ficha (rosto pintado 128 px + barras), rosto pintado 64 px na taverna, janela da cidade ao lado do menu.',
          'marcadores de cidade e de batalha com nome, caminho, cursor na escolhida, menu da cidade (Loja, Taverna, Ficha do grupo, Sair), ouro sempre visível; Loja com preço, Comprar e "faltam N" quando o ouro não dá; Taverna com preço e Recrutar; Ficha com rosto, nome, classe, nível, VIDA e MP.',
          'desenho do mapa (mar, terra, neve, rio), boato na Taverna, tipo do item (arma, armadura, acessório), painel de dica no mapa.',
          'o mapa do jogo (world-ui.ts) tem desenho próprio, bússola e ícones de lugar; a cidade abre um diálogo com botões (Loja, Bar, Grupo), não um menu de comandos; a Taverna de hoje também tem missões; o jogo não tem nível. Lugares, ordem do caminho, itens, preços e custo de recruta (200) são os do jogo.',
        ]}
        w={w}
        h={h}
      >
        <Mapa t={t} estado={mapa} lang={lang} />
      </Maquete>
      <Maquete
        titulo="3. Título e opções"
        nota="Título sobre a Colina com o menu do kit; Opções com escolhas (choice) e controles deslizantes (slider) do jogo."
        controles={
          <>
            {comuns}
            <Opcoes
              rotulo="Estado"
              itens={[
                ['titulo', 'Título'],
                ['opcoes', 'Opções'],
              ]}
              valor={titulo}
              onPick={setTitulo}
            />
          </>
        }
        legenda={[
          'menu de comandos (Menu), painel com cabeçalho, choice() com ✓ no escolhido, slider() com valor em %, botão secundário com tecla (Esc), cena da Colina ao fundo.',
          'nome do jogo em 96 px sobre a cena (o jogo usa 64 px).',
          'nome do jogo, Novo jogo / Continuar / Opções com foco no primeiro; em Opções: idioma, ângulo da câmera, velocidade do texto, música e efeitos, e Voltar.',
          'dica de teclas no rodapé, escurecimento do fundo, Continuar apagado com motivo quando não há jogo salvo.',
          'o título do jogo (game/title.ts) põe Continuar antes de Novo jogo e tem também Batalha avulsa, Como jogar, Créditos e Desenvolvedor; as Opções do jogo (game/options.ts) têm seções Jogo, Som, Vídeo e efeitos, Controles e Idioma e não têm ângulo da câmera (a câmera gira com R; as opções Alto/Médio/Baixo são de exemplo).',
        ]}
        w={w}
        h={h}
      >
        <Titulo t={t} opcoes={titulo === 'opcoes'} lang={lang} />
      </Maquete>
    </div>
  );
}
