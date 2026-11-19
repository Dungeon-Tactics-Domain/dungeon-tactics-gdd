// Study of the original WoW human model (Nov 16, Fernando's request: "no lab"). The model is Blizzard art taken from his
// own install, only to be remodelled over: it must NEVER be published, so the viewer is a page served on his machine
// (D:\Projetos\_estudo-wow\serve.mjs, port 5377) and this page only frames it. Elsewhere the frame stays empty.
const VIEWER = 'http://127.0.0.1:5377/ver.html';

export function EstudoWow() {
  return (
    <div className="grid gap-3">
      <p className="m-0 border-2 border-dashed border-apagado bg-folha px-4 py-3 text-apagado">
        Arte da Blizzard, só para estudo no PC do Fernando: o modelo não está no site e nunca entra no jogo. A janela
        abaixo só mostra algo no computador dele, com o servidor local ligado.
      </p>
      <iframe
        src={VIEWER}
        title="Modelo humano do WoW (só local)"
        className="block h-[min(70vh,720px)] w-full rounded-lg border-0 bg-pergaminho-escuro"
      />
      <p className="m-0 text-apagado">
        Servidor: <code>node D:\Projetos\_estudo-wow\serve.mjs</code> (porta 5377). Para abrir em tela cheia:{' '}
        <a href={VIEWER} target="_blank" rel="noreferrer">
          127.0.0.1:5377/ver.html
        </a>
        .
      </p>
    </div>
  );
}
