// Index of the Arquivo: local copies of the claude.ai artifacts, read on 14/11/2026. The copies themselves stay in the old
// lab (5190/arquivo/<slug>/): they hold captures of other games that cannot go into a public repository.

export interface ItemArquivo {
  /** folder in the old lab; undefined = not copied */
  slug?: string;
  titulo: string;
  data: string;
  resumo: string;
  /** what the copy kept and lost */
  copia: string;
  historico?: boolean;
}

export interface SecaoArquivo {
  id: string;
  titulo: string;
  itens: ItemArquivo[];
}

export const ARQUIVO: SecaoArquivo[] = [
  {
    id: 'labs',
    titulo: 'Artefatos dos labs',
    itens: [
      {
        slug: 'home-dos-labs',
        titulo: 'Home dos Labs',
        data: '14/11',
        historico: true,
        resumo: 'As 3 direções para a home e a barra desta plataforma; a B (mapa do reino) foi a escolhida.',
        copia: 'Tudo preservado.',
      },
      {
        slug: 'labs-hub',
        titulo: 'Labs Dungeon Tactics (hub)',
        data: '14/11',
        historico: true,
        resumo: 'Um cartão por lab: estado, o que faz, o que precisa de você.',
        copia: 'Os 6 cartões, fixados como retrato de 14/11; perdeu a atualização ao vivo.',
      },
      {
        slug: 'maquetes-de-batalha',
        titulo: 'Maquetes de batalha',
        data: '14/11',
        resumo: 'Três pranchas da tela de batalha: Vitral, Ferro e cinza, Carta de campo.',
        copia: 'As 3 pranchas e os fontes; perdeu o editor do tipo Design.',
      },
      {
        slug: 'narrativa-e-loop',
        titulo: 'Narrativa e Loop',
        data: '14/11',
        resumo: 'Grill do lab de narrativa: quanto de Darkest Dungeon e XCOM entra.',
        copia: 'Tudo preservado.',
      },
      {
        slug: 'referencias-de-interface',
        titulo: 'Referências de Interface Tactics',
        data: '14/11',
        resumo: 'Pesquisa da interface de FFT, Tactics Ogre: Reborn e mais 8 jogos, com fontes.',
        copia: 'Tudo preservado, links das fontes externos.',
      },
      {
        slug: 'esforco-modelos-3d',
        titulo: 'Esforço nos modelos 3D',
        data: '14/11',
        resumo: 'Eval do Fable em 4 esforços: árvores e carroças, juízes às cegas, custo por peça.',
        copia: 'Tudo preservado; o veredito de 14/11 está na memória do projeto.',
      },
      {
        slug: 'design-system',
        titulo: 'Design System',
        data: '14/11',
        historico: true,
        resumo: 'Cópia de leitura do design system do jogo, com os tokens.',
        copia: 'README e tokens; perdeu o visualizador do tipo Design System.',
      },
      {
        slug: 'portfolio-de-assets',
        titulo: 'Portfólio de assets',
        data: '12/11',
        resumo: 'Miniaturas dos 24 pacotes KayKit, heróis, 3D grátis e pixel art.',
        copia: 'A página e as 54 imagens.',
      },
    ],
  },
  {
    id: 'orquestracao',
    titulo: 'Material da orquestração',
    itens: [
      {
        slug: 'orquestracao-grill',
        titulo: 'Orquestração (grill)',
        data: '14/11',
        resumo: 'Como as sessões trabalham juntas: fatos medidos, modelo e esforço por sessão.',
        copia: 'A página inteira; a pergunta 7 continua sem resposta.',
      },
      {
        slug: 'central-viva',
        titulo: 'Central (viva)',
        data: '14/11',
        historico: true,
        resumo: 'Quadro de sessões e subagentes por estado; hoje o quadro vivo é a Fábrica.',
        copia: 'Congelada em 14/11 18:25; perdeu a atualização ao vivo.',
      },
      {
        slug: 'engines',
        titulo: 'Engines: opções, prós e contras',
        data: '11/11',
        historico: true,
        resumo: 'Sete engines comparadas e a prova de conceito em Bevy.',
        copia: 'Só a seção de engines; o resto da Central de 11/11 não veio, por decisão.',
      },
    ],
  },
  {
    id: 'fora',
    titulo: 'Não migrado',
    itens: [
      {
        titulo: 'Central de decisões',
        data: '12/11',
        resumo: 'É do Orquestrador Geral, não do jogo.',
        copia: 'Não copiada e não deve ser apagada por esta migração.',
      },
      {
        titulo: 'Central antiga, Dashboard vazio, Checklist de 13/11',
        data: '11 a 13/11',
        resumo: 'Candidatos a apagar sem migrar.',
        copia: 'Da Central de 11/11 só a comparação de engines veio.',
      },
      {
        titulo: 'Música (evals da trilha)',
        data: '14/11',
        resumo: 'Ficam com a sessão da música.',
        copia: 'Links na página da Música.',
      },
    ],
  },
];
