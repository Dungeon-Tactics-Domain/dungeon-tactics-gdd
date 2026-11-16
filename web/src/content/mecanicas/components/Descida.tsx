// Descent group (Nov 15, dungeon crawler loop MVP): the numbers the descent needs, from descida.json. Rooms show the enemy
// life summed from the game's units and the hero turns it should take, so a changed number shows its effect here.
import type { ReactNode } from 'react';
import { Callout } from '@/components/content/Callout';
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { descida, turnosDe, vidaDe } from '../dados';

type Secao = 'sala' | 'chefe' | 'ferido' | 'mapa';
const NOME: Record<string, string> = {
  minion: 'Lacaio esqueleto',
  acolyte: 'Acólito do Véu',
  dark_mage: 'Mago sombrio',
  skeleton_archer: 'Arqueiro esqueleto',
  veil_knight: 'Cavaleiro do Véu',
  soldier: 'Soldado',
  brute: 'Bruto',
};

// Few columns on an ultrawide screen would stretch each text cell past 200 characters per line; wide tables keep the full width.
export const LIMITE_TEXTO = 'max-w-[150ch]';

export function Tabela({ colunas, linhas }: { colunas: string[]; linhas: ReactNode[][] }) {
  return (
    <div className={colunas.length <= 5 ? LIMITE_TEXTO : undefined}>
      <Rolagem>
        <table className={TABELA}>
          <thead>
            <tr>
              {colunas.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i}>
                {l.map((c, j) => (
                  <td key={j}>{j === 0 ? <strong>{c}</strong> : c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Rolagem>
    </div>
  );
}

export function Regras({ de }: { de: Secao }) {
  return (
    <Tabela colunas={['Regra', 'Valor', 'Origem']} linhas={descida[de].map((r) => [r.regra, r.valor, r.origem])} />
  );
}

export function Salas() {
  return (
    <Tabela
      colunas={['Sala', 'Andar', 'Inimigos', 'Vida somada', 'Turnos de herói', 'O que pede']}
      linhas={descida.salas.map((s) => {
        const vida = vidaDe(s.inimigos);
        return [
          s.nome,
          s.andar,
          s.inimigos.map((i) => NOME[i]).join(', '),
          vida,
          `~${turnosDe(vida).toLocaleString('pt-BR')}`,
          s.papel,
        ];
      })}
    />
  );
}

export function Fonte() {
  return (
    <Callout tom="simples">
      <p className="m-0 max-w-[72ch]">{descida.fonte}</p>
    </Callout>
  );
}

export function Perguntas() {
  return (
    <Callout tom="simples">
      <ul className="m-0 grid list-disc gap-1 gap-x-10 pl-6 wide:grid-cols-2 ultra:grid-cols-3">
        {descida.perguntas.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </Callout>
  );
}
