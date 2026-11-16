// Narrative lab: references of games, anime and books for the story and the loop. Same tree as the old lab after its
// conversion to pages (dungeon-tactics-lab/narrativa/src/main.ts): the per-work pages come from dados.ts.
import { DECISOES_ATIVAS } from '@/lib/recursos';
import type { Manifesto, PaginaManifesto } from '../types';
import { type Game, IMAGENS, JOGOS, OBRAS, TIPOS, tipoDe } from './dados';

// menu titles up to ~28 characters; the full name and year go in the summary
const curto = (n: string) =>
  n.length <= 28 ? n : n.includes(':') ? n.split(':')[0]! : (n.match(/\(([^)]+)\)$/)?.[1] ?? n);

const porTipo = (pagina: (g: Game) => PaginaManifesto): PaginaManifesto[] =>
  [
    ...TIPOS.map((t) => ({ ...t, jogos: JOGOS.filter((g) => t.slugs.includes(g.slug)) })),
    {
      id: 'outros',
      nome: 'Outros',
      resumo: 'Jogos fora das divisões acima.',
      jogos: JOGOS.filter((g) => tipoDe(g.slug) === 'outros'),
    },
  ]
    .filter((t) => t.jogos.length)
    .map((t) => ({ id: t.id, titulo: t.nome, resumo: t.resumo, subpaginas: t.jogos.map(pagina) }));

const jogo = (g: Game): PaginaManifesto => ({ id: g.slug, titulo: curto(g.game), resumo: `${g.game} (${g.year})` });
const mood = (slug: string, nome: string): PaginaManifesto => ({
  id: slug,
  titulo: curto(nome),
  resumo: `${IMAGENS.filter((s) => s.slug === slug).length} imagens`,
});

// old in-page links (#ref-slug, #loop-slug, #decisoes...) still open the right page
const linksAntigos: Record<string, string> = {
  decisoes: 'decisoes/agora',
  ...(DECISOES_ATIVAS ? { moodboard: 'moodboard/quero', marcas: 'marcas/minhas' } : {}),
  loops: 'loops/nosso-loop',
  referencias: 'jogos',
  obras: 'animes',
  ...Object.fromEntries(OBRAS.map((w) => [`ref-${w.slug}`, `animes/${w.slug}`])),
  ...Object.fromEntries(JOGOS.map((g) => [`ref-${g.slug}`, `jogos/${tipoDe(g.slug)}/${g.slug}`])),
  ...Object.fromEntries(JOGOS.map((g) => [`loop-${g.slug}`, `loops/${tipoDe(g.slug)}/${g.slug}`])),
};

export default {
  titulo: 'Laboratório de narrativa',
  resumo: 'Referências de jogos, animes e livros para a história e o loop do Dungeon Tactics.',
  origem: {
    caminho: '/narrativa/',
    fonte: 'dungeon-tactics-lab/narrativa: src/main.ts e src/data (plan.ts, refs, obras)',
    copiadoEm: '2026-11-14T23:39:31-03:00',
  },
  linksAntigos,
  grupos: [
    {
      id: 'decisoes',
      titulo: 'Decisões',
      icone: '🧭',
      resumo: 'O que está aberto, as fases, os pedidos e o que já foi decidido.',
      paginas: [
        { id: 'agora', titulo: 'Agora estamos decidindo', icone: '❓', resumo: 'A decisão aberta da vez.' },
        {
          id: 'fases',
          titulo: 'Fases e portões',
          icone: '🚦',
          resumo: 'As etapas do laboratório e o portão de cada uma.',
        },
        { id: 'pedidos', titulo: 'Pedidos', icone: '📋', resumo: 'Cada pedido seu, com dono e estado.' },
        { id: 'grill', titulo: 'Decisões tomadas', icone: '✅', resumo: 'O que o grill já fechou.' },
        {
          id: 'loop-crawler',
          titulo: 'Loop de dungeon crawler',
          icone: '🏰',
          resumo: 'As 10 decisões do grill de 15/11, as fases e o que falta decidir.',
        },
        {
          id: 'cidade',
          titulo: 'A cidade e a pena',
          icone: '🏘️',
          resumo: 'Rascunho de 15/11: a vila, a pena do prisioneiro, os moradores e os primeiros textos, para aprovar.',
        },
        {
          id: 'mapa-cidade',
          titulo: 'Mapa da cidade (layout)',
          icone: '🏘️',
          resumo: 'Zonas, níveis, escadas, rampas, praia e porto; onde fica cada instalação e morador; referências.',
        },
        {
          id: 'lugares',
          titulo: 'Lugares da cidade',
          icone: '🗺️',
          resumo: 'Brief para o mapa: instalações, moradores, o que se faz em cada lugar e a circulação.',
        },
      ],
    },
    {
      id: 'moodboard',
      titulo: 'Moodboard',
      icone: '🖼️',
      resumo: 'Imagens de cada obra; só ficam neste PC.',
      paginas: [
        ...(DECISOES_ATIVAS
          ? [{ id: 'quero', titulo: 'O que eu quero', resumo: 'As imagens que você marcou com Quero.' }]
          : []),
        {
          id: 'jogos',
          titulo: 'Jogos',
          resumo: 'Imagens de cada jogo.',
          subpaginas: JOGOS.filter((g) => g.shots.length).map((g) => mood(g.slug, g.game)),
        },
        {
          id: 'animes',
          titulo: 'Animes e livros',
          resumo: 'Imagens de cada obra.',
          subpaginas: OBRAS.filter((w) => w.shots.length).map((w) => mood(w.slug, w.work)),
        },
      ],
    },
    {
      id: 'loops',
      titulo: 'Loops',
      icone: '🔁',
      resumo: 'Cada jogo nas 4 camadas: batalha, expedição, base e arco.',
      paginas: [
        { id: 'nosso-loop', titulo: 'Nosso loop', icone: '🎯', resumo: 'O loop do Dungeon Tactics hoje.' },
        ...porTipo(jogo),
      ],
    },
    {
      id: 'jogos',
      titulo: 'Jogos',
      icone: '🎮',
      resumo: 'Ficha do loop: mecânicas que carregam a história, vídeos e imagens.',
      paginas: porTipo(jogo),
    },
    {
      id: 'animes',
      titulo: 'Animes e livros',
      icone: '📖',
      resumo: 'Ficha de tom, grupo, morte, mundo, política e progressão. Com spoiler.',
      paginas: OBRAS.map((w) => ({
        id: w.slug,
        titulo: curto(w.work),
        resumo: `${w.work} · ${w.kind} (${w.year})`,
      })),
    },
    ...(DECISOES_ATIVAS
      ? [
          {
            id: 'marcas',
            titulo: 'Minhas marcas',
            icone: '⭐',
            resumo: 'O que você marcou com Quero e Não quero.',
            paginas: [{ id: 'minhas', titulo: 'Minhas marcas' }],
          },
        ]
      : []),
  ],
} satisfies Manifesto;
