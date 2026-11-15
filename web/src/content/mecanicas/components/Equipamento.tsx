// Equipment group (Nov 15 grill): stats come only from equipment and buffs, no XP. Each table is one list of
// equipamento.json; the columns follow the list, so a new field shows up without touching this file.
import { Callout } from '@/components/content/Callout';
import equipamento from '../equipamento.json';
import { Tabela } from './Descida';

type Secao = 'formulas' | 'classes' | 'inimigos' | 'habilidades' | 'raridade' | 'pecas' | 'buffs';
const TITULO: Record<string, string> = {
  regra: 'Regra',
  valor: 'Valor',
  origem: 'Origem',
  nome: 'Nome',
  vida: 'Vida',
  stamina: 'Stamina',
  regenStamina: 'Regen stamina',
  mana: 'Mana',
  regenMana: 'Regen mana',
  resFisica: 'Física %',
  resMagica: 'Mágica %',
  esquiva: 'Esquiva %',
  elementos: 'Elementos %',
  habilidade: 'Habilidade (dano x5)',
  classe: 'Quem usa',
  tipo: 'Tipo',
  custo: 'Custo',
  elemento: 'Elemento',
  espaco: 'Espaço',
  raridade: 'Raridade',
  atributos: 'Atributos',
  fonte: 'De onde vem',
  efeito: 'Efeito',
  duracao: 'Duração',
};

export function Lista({ de }: { de: Secao }) {
  const linhas: Record<string, string | number>[] = equipamento[de];
  const chaves = Object.keys(linhas[0] ?? {});
  return <Tabela colunas={chaves.map((k) => TITULO[k] ?? k)} linhas={linhas.map((l) => chaves.map((k) => l[k]))} />;
}

export function Fonte() {
  return (
    <Callout tom="simples">
      <p className="m-0">{equipamento.fonte}</p>
    </Callout>
  );
}

export function Perguntas() {
  return (
    <Callout tom="simples">
      <ul className="m-0 grid list-disc gap-1 pl-6">
        {equipamento.perguntas.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </Callout>
  );
}
