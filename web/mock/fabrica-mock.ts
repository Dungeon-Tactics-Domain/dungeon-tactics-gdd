// Dev-only fake of the Rust API (docs/CONTRATO-FABRICA.md), so the UI runs on `npm run dev:mock` without crates/labs-server.
// It goes through the same GET + EventSource path as the real server; one station flips state every 8 s to show live updates.
import type { ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { Estado, Fabrica } from '../src/types/fabrica.ts';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function board(tick: number): Fabrica {
  const mecanicas: Estado = tick % 2 ? 'aguardando-voce' : 'rodando';
  return {
    // MOCK_STALE=1 dates the board 20 min back to show the stale warning
    atualizado: minutesAgo(process.env.MOCK_STALE ? 20 : 0),
    estacoes: [
      {
        id: 'labs',
        nome: 'Orquestrador dos labs',
        emoji: '🧭',
        papel: 'Coordena as sessões',
        estado: 'rodando',
        tarefa: 'Migrando a plataforma para React',
        sessao: 'mock-1',
      },
      {
        id: 'design',
        nome: 'Design system e UX',
        emoji: '🎨',
        papel: 'Interface',
        estado: 'aguardando-voce',
        tarefa: 'Paleta da tela de batalha',
        pergunta: 'Qual das três paletas fica para a batalha?',
        sessao: 'mock-2',
      },
      {
        id: 'mecanicas',
        nome: 'Mecânicas',
        emoji: '⚙️',
        papel: 'Regras e game feel',
        estado: mecanicas,
        tarefa: 'Testando o salto por classe',
        sessao: 'mock-3',
      },
      {
        id: 'narrativa',
        nome: 'Narrativa',
        emoji: '📖',
        papel: 'Tom e loop',
        estado: 'espera',
        tarefa: 'Esperando a decisão do tom do ato 2',
        sessao: 'mock-4',
      },
      {
        id: 'modelos',
        nome: 'Modelos 3D',
        emoji: '🌳',
        papel: 'Árvores e objetos',
        estado: 'ocioso',
        tarefa: 'Lote de árvores entregue',
        sessao: 'mock-5',
      },
      {
        id: 'testes',
        nome: 'Testes de batalha',
        emoji: '🧪',
        papel: 'Lab novo sem cidade',
        estado: 'rodando',
        tarefa: 'Rodando partidas de teste',
        sessao: 'mock-6',
      },
    ],
    subagentes: [
      {
        id: 's1',
        nome: 'Porta do mapa',
        modelo: 'sonnet',
        estacao: 'labs',
        estado: 'rodando',
        tarefa: 'Mapa do reino em React',
        inicio: minutesAgo(12),
      },
      {
        id: 's2',
        nome: 'Árvores lote 3',
        modelo: 'fable',
        estacao: 'modelos',
        estado: 'terminado',
        tarefa: 'Doze árvores',
        inicio: minutesAgo(40),
        fim: minutesAgo(5),
      },
      {
        id: 's3',
        nome: 'Salto do arqueiro',
        modelo: 'opus',
        estacao: 'mecanicas',
        estado: 'rodando',
        tarefa: 'Medir alcance com altura',
        inicio: minutesAgo(3),
      },
    ],
  };
}

export function fabricaMock(): Plugin {
  return {
    name: 'fabrica-mock',
    configureServer(server) {
      let tick = 0;
      const clients = new Set<ServerResponse>();
      const send = (res: ServerResponse) => res.write(`event: fabrica\ndata: ${JSON.stringify(board(tick))}\n\n`);
      const flip = setInterval(() => {
        tick++;
        clients.forEach(send);
      }, 8000);
      const ping = setInterval(() => clients.forEach((res) => res.write('event: ping\ndata: {}\n\n')), 15000);
      server.httpServer?.on('close', () => {
        clearInterval(flip);
        clearInterval(ping);
      });
      server.middlewares.use('/api/fabrica', (req, res) => {
        if (req.url === '/stream') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });
          clients.add(res);
          send(res);
          req.on('close', () => clients.delete(res));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(board(tick)));
      });
    },
  };
}
