// Side by side: each element of the game's 3D interface next to its counterpart in FFT (The Ivalice Chronicles).
// Captures: game master 20b8555b, 17/11/2026 (bench scenes, 1920x1080). References: public/content/design/refs/fft-ivalice.
// The zoom comes from the shell (every content image opens the reader).
const BASE = '/content/design/3d-vs-fft';

type Azul = 'sim' | 'pouco' | 'nao';
type Item = {
  id: string;
  nome: string;
  grupo: 'batalha' | 'telas' | 'cidade';
  ref: string; // FFT image number
  semEquivalente?: string; // when the FFT has none: what is shown instead
  cor: string[]; // dominant colors of ours (hex, measured on the capture)
  corNome: string;
  azul: Azul;
  diff: string;
  extras?: string[];
};

export const ITENS: Item[] = [
  { id: 'menu', nome: 'Menu de comandos', grupo: 'batalha', ref: '12', cor: ['#e8e3d0', '#000000'], corNome: 'pergaminho bege', azul: 'nao',
    diff: 'Os dois são pergaminho bege; o nosso tem ícones redondos de bronze e 4 comandos, o FFT ícones cinza-escuros e uma linha apagada (???).' },
  { id: 'habilidades', nome: 'Submenu de habilidades e ficha de 3 páginas', grupo: 'batalha', ref: '38', cor: ['#e6e1ce', '#18140d'], corNome: 'pergaminho bege', azul: 'nao', extras: ['habilidades-p2', 'habilidades-p3'],
    diff: 'Nossa ficha tem 3 páginas (Descrição, Efeitos, Custo) com ícone vermelho e custo na lista; a do FFT mostra a Descrição, sem custo.' },
  { id: 'fila', nome: 'Fila de turnos (vida e CT)', grupo: 'batalha', ref: '10', cor: ['#0c0f1b'], corNome: 'preto azulado', azul: 'pouco',
    diff: 'Nosso: cartões escuros com retrato, Vida e CT em texto, barras e número grande colorido. FFT: só retrato pequeno e número, sem painel.' },
  { id: 'barra', nome: 'Barra de combate (quem age e o alvo)', grupo: 'batalha', ref: '18', cor: ['#0e172c', '#211621'], corNome: 'azul-marinho (herói) e ameixa (alvo)', azul: 'sim',
    diff: 'Nosso: painel azul-marinho para o herói e vinho para o alvo, dano num hexágono. FFT: painéis cinza-ardósia e marrom, dano num losango.' },
  { id: 'banner', nome: 'Banner de instrução', grupo: 'batalha', ref: '03', cor: ['#242b38', '#292e37'], corNome: 'ardósia azulada', azul: 'sim',
    diff: 'Cápsula arredondada nos dois; a nossa é ardósia azulada, a do FFT cinza translúcido e com o ícone do botão no texto.' },
  { id: 'altura', nome: 'Altura da casa', grupo: 'batalha', ref: '04', cor: ['#252933', '#48a878'], corNome: 'ardósia azulada com número verde-água', azul: 'pouco',
    diff: 'Nos dois, o número grande é verde-água; no nosso a linha da casa fica numa cápsula ardósia, no FFT é texto solto sobre o terreno.' },
  { id: 'dicas', nome: 'Dicas de botão do rodapé', grupo: 'batalha', ref: '17', cor: ['#000000', '#282222', '#b1aba5'], corNome: 'preto e cinza', azul: 'nao',
    diff: 'Nosso: teclas em caixinhas cinza (Enter, Esc, Q E R) numa faixa preta. FFT: ícones dos botões do controle, sem faixa.' },
  { id: 'executar', nome: 'Executar? (confirmação)', grupo: 'batalha', ref: '19', semEquivalente: 'o FFT não tem essa janela; a confirmação é o banner "Select a target and press ⊗ to confirm"', cor: ['#262c35', '#373b41'], corNome: 'ardósia azulada', azul: 'sim',
    diff: 'Nosso: janela ardósia ao lado do boneco, com custo, texto e botões Confirmar e Voltar. FFT: só o banner e a prévia de dano na barra.' },
  { id: 'marcacoes', nome: 'Marcações do chão (Luz)', grupo: 'batalha', ref: '25', cor: ['#52655b', '#88e8f8'], corNome: 'azul-claro e ciano', azul: 'sim',
    diff: 'Nosso: tiras azul-claras com brilho e casa branca no cursor. FFT: placas azuis com borda luminosa e placas vermelhas para o ataque.' },
  { id: 'ordem', nome: 'Número da ordem no mapa', grupo: 'batalha', ref: '25', cor: ['#3898f8', '#e8508c'], corNome: 'azul-ciano (heróis) e rosa (inimigos)', azul: 'sim',
    diff: 'Nosso: número grande azul-ciano com barrinha ao lado do boneco. FFT: número pequeno, azul para aliado e vermelho para inimigo, com barra de vida.' },
  { id: 'vitoria', nome: 'Tela de resultado: vitória', grupo: 'telas', ref: '73', cor: ['#131208', '#fdebb4'], corNome: 'preto-oliva com título bege', azul: 'nao',
    diff: 'Nosso: título bege, tabela de resultado e destaque em duas colunas. FFT: título com ornamentos, "Spoils of War" e "Greatest Contribution" em faixas.' },
  { id: 'derrota', nome: 'Tela de resultado: derrota', grupo: 'telas', ref: '73', semEquivalente: 'a referência não tem tela de derrota; mostrada a vitória do FFT', cor: ['#121107', '#9db4d6'], corNome: 'preto-oliva com título azul-acinzentado', azul: 'pouco',
    diff: 'Nosso: título azul-acinzentado e só a tabela de resultado, com Tentar de novo e Cidade.' },
  { id: 'ferramentas', nome: 'Menu de ferramentas', grupo: 'telas', ref: '26', semEquivalente: 'o FFT não tem esse menu na batalha; mostrada a batalha pausada, a mais próxima', cor: ['#e8e3d0', '#535d6c'], corNome: 'pergaminho bege (botão azulado)', azul: 'pouco',
    diff: 'Nosso: lista em pergaminho com atalhos à direita, aberta pelo botão de 3 barras. FFT: só dicas no rodapé (Status, System Menu).' },
  { id: 'status', nome: 'Janela de Status', grupo: 'telas', ref: '14', semEquivalente: 'a ficha do FFT é outra tela; mostrada a mais próxima', cor: ['#e3ddc9', '#cfc9b3'], corNome: 'pergaminho bege', azul: 'nao',
    diff: 'Nosso: janela de pergaminho com tabela de 2 colunas em texto. FFT: ficha escura com retrato, barras e ícones com números.' },
  { id: 'opcoes', nome: 'Opções', grupo: 'telas', ref: '52', cor: ['#070908', '#e8e3d0'], corNome: 'preto com campos de pergaminho', azul: 'nao',
    diff: 'Nosso: fundo preto liso, valores em caixas de pergaminho e barras de volume. FFT: painel de pergaminho com interruptores verdes e abas no topo.' },
  { id: 'titulo', nome: 'Título', grupo: 'telas', ref: '50', cor: ['#313920', '#fdebb4'], corNome: 'verde-musgo escuro, título creme', azul: 'nao',
    diff: 'Nosso: título creme em serifa sobre o mapa, com menu marrom escuro. FFT: logotipo em pedra e dourado sobre mapa antigo.' },
  { id: 'loja', nome: 'Loja', grupo: 'cidade', ref: '48', semEquivalente: 'não há imagem da loja do FFT; mostrado o inventário, a tela mais próxima', cor: ['#060807', '#e9e4d1'], corNome: 'preto com painéis de pergaminho', azul: 'nao',
    diff: 'Nosso: 3 colunas, comandos à esquerda, lista e detalhe em pergaminho. FFT (inventário): lista e detalhe em pergaminho sobre fundo texturizado.' },
  { id: 'taverna', nome: 'Taverna', grupo: 'cidade', ref: '61', cor: ['#060807', '#eae4d1'], corNome: 'preto com painéis de pergaminho', azul: 'nao',
    diff: 'Nosso: lista de recrutas e detalhe em pergaminho. FFT: cena ilustrada da taverna com diálogo e comandos em barras douradas.' },
  { id: 'grupo-status', nome: 'Grupo: página Status', grupo: 'cidade', ref: '44', cor: ['#13120c', '#eae5d2'], corNome: 'preto-oliva com pergaminho', azul: 'nao',
    diff: 'Nosso: ficha do membro no alto e barras de status em pergaminho. FFT (equipamento): ficha com ícones e números e botões laterais dourados.' },
  { id: 'grupo-classe', nome: 'Grupo: página Classe', grupo: 'cidade', ref: '02', cor: ['#13120c', '#e5e0cd'], corNome: 'preto-oliva com pergaminho', azul: 'nao',
    diff: 'Nosso: cartões de classe em pergaminho. FFT: grade de classes com os personagens sobre fundo de pedra.' },
];

const AZUL: Record<Azul, string> = { sim: 'azul: sim', pouco: 'azul: pouco', nao: 'azul: não' };
const SELO: Record<Azul, string> = {
  sim: 'border-lab bg-lab-soft text-tinta',
  pouco: 'border-borda bg-folha text-tinta',
  nao: 'border-borda bg-folha text-tinta-suave',
};

export function PaletaNosso() {
  return (
    <ul className="m-0 my-4 grid list-none gap-2 p-0 sm:grid-cols-2">
      {ITENS.map((i) => (
        <li key={i.id} className="flex items-center gap-3 rounded-md border border-borda bg-folha p-2">
          <span className="flex shrink-0 overflow-hidden rounded border border-borda" aria-hidden="true">
            {i.cor.map((c) => (
              <span key={c} className="block h-10 w-8" style={{ background: c }} />
            ))}
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold">{i.nome}</span>
            <span className="block text-tinta-suave">{i.corNome}</span>
          </span>
          <span className={`shrink-0 rounded border px-2 py-0.5 text-xs ${SELO[i.azul]}`}>{AZUL[i.azul]}</span>
        </li>
      ))}
    </ul>
  );
}

export function Pares({ grupo }: { grupo: Item['grupo'] }) {
  return (
    <div className="my-4 grid gap-8">
      {ITENS.filter((i) => i.grupo === grupo).map((i) => (
        <section key={i.id} aria-label={i.nome} className="grid gap-2">
          <h3 className="m-0 text-base font-semibold">{i.nome}</h3>
          <div className="grid items-start gap-3 sm:grid-cols-2">
            <figure className="m-0 grid gap-1">
              <img src={`${BASE}/${i.id}-nosso.webp`} alt={`${i.nome}, nosso 3D`} loading="lazy" className="block w-full rounded-md border border-borda" />
              <figcaption className="text-sm text-tinta-suave">Nosso 3D</figcaption>
            </figure>
            <figure className="m-0 grid gap-1">
              <img src={`${BASE}/${i.id}-fft.webp`} alt={`${i.nome}, FFT, imagem ${i.ref}`} loading="lazy" className="block w-full rounded-md border border-borda" />
              <figcaption className="text-sm text-tinta-suave">
                FFT, imagem {i.ref}
                {i.semEquivalente ? ` (sem equivalente na referência: ${i.semEquivalente})` : ''}
              </figcaption>
            </figure>
          </div>
          {i.extras && (
            <div className="grid grid-cols-2 gap-3 sm:max-w-[50%]">
              {i.extras.map((e, n) => (
                <figure key={e} className="m-0 grid gap-1">
                  <img src={`${BASE}/${e}.webp`} alt={`${i.nome}, nosso 3D, página ${n + 2}`} loading="lazy" className="block w-full rounded-md border border-borda" />
                  <figcaption className="text-sm text-tinta-suave">Nosso 3D, página {n + 2}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <p className="m-0 text-sm">{i.diff}</p>
        </section>
      ))}
    </div>
  );
}
