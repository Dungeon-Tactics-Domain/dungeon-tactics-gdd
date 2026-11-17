// Vagrant Story study (Nov 17, Fernando's request: "put it inside a web page, like the others"): frames the static
// viewers published under /content/vagrant (his own disc, extracted for study and remodelling).
import { useState } from 'react';
import { Botoes } from './Visualizador';

const BASE = '/content/vagrant/';
const PAGINAS = [
  ['viewer.html', '🎬 Visualizador com animações'],
  ['animacoes.html?z=Z001U00.ZUD', '🏃 Todas as animações'],
  ['animacao-mock.html?z=Z001U00.ZUD', '🎭 Mock de gestos'],
  ['cena-batalha.html', '🏰 Cena de batalha'],
  ['lado.html','🔀 Original × subdividido'],
  ['folha-zud.html?n=24', '🧍 Folha de personagens'],
  ['mapa.html?z=001&m=001', '🗺️ Mapa (zona 1)'],
  ['mapas.html?de=1&ate=40', '🧭 Folha de mapas'],
] as const;

export function VagrantStory() {
  const [pagina, setPagina] = useState<string>(PAGINAS[0][0]);
  return (
    <div className="grid gap-3">
      <Botoes rotulo="Ferramenta" itens={PAGINAS} atual={pagina} escolher={setPagina} />
      <iframe
        key={pagina}
        src={BASE + pagina}
        title="Vagrant Story"
        className="block h-[min(75vh,780px)] w-full rounded-lg border-0 bg-pergaminho-escuro"
      />
      <p className="m-0 text-apagado">
        Para abrir em tela cheia:{' '}
        <a href={BASE + pagina} target="_blank" rel="noreferrer">
          {BASE + pagina}
        </a>
        .
      </p>
    </div>
  );
}
