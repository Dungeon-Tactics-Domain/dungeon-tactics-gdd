// Demo of the pages pattern. Every word here is fictional and marked EXEMPLO: it only proves the navigation.
/* eslint-disable react-refresh/only-export-components -- demo data module; Selo and Texto are local helpers, never hot-reloaded alone */
import type { Pagina, Sumario } from './types';

const Selo = () => (
  <p>
    <span className="bg-aviso-suave px-2 py-0.5 text-sm font-bold text-aviso">EXEMPLO</span>
  </p>
);

function Texto({ assunto }: { assunto: string }) {
  return (
    <>
      <Selo />
      <p className="max-w-[72ch]">
        Texto fictício sobre <b>{assunto}</b>. Aqui entra o que hoje é uma seção de um lab: um parágrafo curto de
        contexto.
      </p>
      <div className="border border-borda bg-folha px-5 py-4">
        <h2 className="m-0 mb-2 text-[21px]">Ficha de exemplo</h2>
        <ul>
          <li>Primeiro ponto inventado.</li>
          <li>Segundo ponto inventado.</li>
        </ul>
      </div>
    </>
  );
}

const p = (id: string, titulo: string, icone: string, resumo: string, extra: Partial<Pagina> = {}): Pagina => ({
  id,
  titulo,
  icone,
  resumo,
  conteudo: () => <Texto assunto={titulo} />,
  ...extra,
});

export const EXEMPLO: Sumario = {
  lab: 'exemplo-paginas',
  titulo: 'Exemplo de sumário',
  resumo: 'EXEMPLO: um lab fictício com 3 grupos e 10 páginas, para testar o padrão de navegação.',
  inicio: () => (
    <p className="m-0 border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4">
      Agora estamos decidindo: nada (é só um exemplo). Escolha um grupo abaixo ou use o menu.
    </p>
  ),
  // old anchors of a scrolling page, now routes
  linksAntigos: { pedidos: 'decisoes/pedidos', ogre: 'referencias/ogre' },
  grupos: [
    {
      id: 'decisoes',
      titulo: 'Decisões',
      icone: '🧭',
      resumo:
        'O que está aberto, o que foi decidido e os pedidos, com dono e estado. Este resumo é longo de propósito para mostrar que o cartão do grupo não corta o texto em três linhas.',
      paginas: [
        p('agora', 'Agora estamos decidindo', '❓', 'A pergunta aberta da vez.'),
        p('pedidos', 'Pedidos', '📋', 'Lista de pedidos com dono e estado.'),
        p('grill', 'Decisões do grill', '🔥', 'As decisões tomadas, uma por subpágina.', {
          conteudo: () => (
            <>
              <Selo />
              <p>Página com subpáginas: o terceiro nível aparece no menu só quando esta página está aberta.</p>
            </>
          ),
          subpaginas: [
            p('camera', 'Câmera', '🎥', 'Quantos ângulos.'),
            p('turnos', 'Turnos', '⏳', 'Fila de CT.'),
            p('agua', 'Água', '🌊', 'Rasa e funda.'),
          ],
        }),
      ],
    },
    {
      id: 'referencias',
      titulo: 'Referências',
      icone: '📚',
      resumo: 'Jogos e materiais estudados.',
      paginas: [
        p('fft', 'Final Fantasy Tactics', '⚔️', 'Ritmo e interface.'),
        p('ogre', 'Tactics Ogre', '🛡️', 'Trajetória de tiro.'),
        p('vandal', 'Vandal Hearts', '🗡️', 'Armadilhas no mapa.'),
        p('capturas', 'Capturas de tela', '🖼️', 'Telas lado a lado.'),
      ],
    },
    {
      id: 'pecas',
      titulo: 'Peças',
      icone: '🧩',
      resumo: 'Componentes e testes.',
      paginas: [
        p('botoes', 'Botões', '🔘', 'Estados de cada botão.'),
        p('paineis', 'Painéis', '🗂️', 'Painéis de pergaminho.'),
        p('icones', 'Ícones', '✨', 'Conjunto de ícones.'),
      ],
    },
  ],
};
