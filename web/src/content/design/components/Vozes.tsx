// Voice-acting test: the 20 lines of the script, each one with a player per model side by side. Audio lives in
// public/content/design/vozes/<model>/<id>.mp3; a file that is not there yet shows "ainda não gerado" (the audio element
// fires an error, so adding a file needs no code change). "Ouvir tudo" plays one model's lines in script order.
import './vozes.css';
import { useRef, useState } from 'react';
import { ASSETS } from '../dados';
import { FALAS, PERSONAGENS } from '../vozes-dados';

const MODELOS = [
  { id: 'qwen', nome: 'Qwen3-TTS (local)', licenca: 'Apache 2.0, uso comercial permitido' },
  { id: 'maya', nome: 'Maya1 (local)', licenca: 'Apache 2.0, uso comercial permitido' },
  { id: 'ming', nome: 'Ming-3.0-tts-0.5B (local)', licenca: 'MIT, uso comercial permitido' },
];
// Ming: 3 of 20 lines failed (odo_03 gave no audio, so it has no file and no player)
const MING_FALHAS: Record<string, string> = {
  odo_02: 'falhou: não para de falar (24,6 s para uma fala curta)',
  odo_03: 'falhou: não gerou áudio',
  vilao_03: 'falhou: o final da fala foi cortado',
};
// Ming with timbre cloning: Bran's line 04 (generated without cloning) is the reference voice
const CLONES: Record<string, string> = {
  bran_03: 'Ming clonado',
  bran_04: 'Ming, referência do timbre (sem clonar)',
  bran_05: 'Ming clonado',
  tess_03: 'Ming clonado',
};
// Qwen3 with timbre cloning (Base model): one reference line per character, the same ones listed here
const QWEN_REFERENCIAS = ['bran_04', 'tess_03', 'odo_05', 'vilao_04'];
const EM_BREVE = ['Eleven v4', 'Gemini TTS', 'Ludo.ai'];

function Jogador({ modelo, nome, id, falha }: { modelo: string; nome: string; id: string; falha?: string }) {
  const [falta, setFalta] = useState(false);
  return (
    <div className="vz-player">
      <span className="vz-apagado">{nome}</span>
      {falta || falha === 'sem áudio' ? (
        <div className="vz-breve vz-faltou">{falha ? 'falhou: não gerou áudio' : 'ainda não gerado'}</div>
      ) : (
        <audio
          controls
          preload="metadata"
          data-modelo={modelo}
          data-fala={id}
          aria-label={`${nome}, fala ${id}`}
          src={`${ASSETS}/vozes/${modelo}/${id}.mp3`}
          onError={() => setFalta(true)}
        />
      )}
      {falha && falha !== 'sem áudio' && <span className="vz-faltou">{falha}</span>}
    </div>
  );
}

export function Vozes() {
  const raiz = useRef<HTMLDivElement>(null);
  const [tocando, setTocando] = useState('');

  // plays the model's audios one after the other, skipping the ones that failed to load
  function ouvirTudo(modelo: string) {
    const todos = raiz.current?.querySelectorAll<HTMLAudioElement>('audio') ?? [];
    todos.forEach((a) => {
      a.pause();
      a.onended = null;
    });
    const lista = [...todos].filter((a) => a.dataset.modelo === modelo);
    const tocar = (i: number) => {
      const a = lista[i];
      if (!a) return setTocando('');
      setTocando(a.dataset.fala ?? '');
      a.currentTime = 0;
      a.onended = () => tocar(i + 1);
      a.play().catch(() => tocar(i + 1));
    };
    tocar(0);
  }

  return (
    <div className="vz" ref={raiz}>
      <section aria-labelledby="vz-teste">
        <h2 id="vz-teste">O teste</h2>
        <p>
          As mesmas 20 falas em inglês (5 por personagem, com emoção e direção de atuação) dubladas por modelos de TTS,
          para comparar de ouvido. Os dois modelos locais rodam no PC (RTX 5070); os de nuvem ainda não foram gerados.{' '}
          <strong>A qualidade da atuação só o seu ouvido decide</strong>: nenhuma métrica aqui diz qual soa melhor.
        </p>
        <div className="vz-modelos">
          {MODELOS.map((m) => (
            <div className="vz-card" key={m.id}>
              <h3>{m.nome}</h3>
              <p>Roda local. Licença: {m.licenca}.</p>
            </div>
          ))}
          {EM_BREVE.map((n) => (
            <div className="vz-card" key={n}>
              <h3>{n}</h3>
              <p className="vz-apagado">Nuvem. Em breve.</p>
            </div>
          ))}
        </div>
        <div className="vz-card" role="note">
          <h3>Ming-3.0-tts-0.5B: resultado</h3>
          <p>
            Licença MIT. 3 das 20 falas falharam (odo_02 não para de falar, odo_03 não gerou áudio, vilao_03 teve o
            final cortado). A clonagem de timbre mantém a voz (semelhança 0,93 a 0,94 contra 0,23 a 0,54 sem clonar), mas{' '}
            <strong>ainda não foi ouvida pelo Fernando</strong>: a semelhança é métrica, não prova de que soa bem.
          </p>
        </div>
        <div className="vz-card" role="note">
          <h3>Qwen3 clonado (timbre fixo): resultado</h3>
          <p>
            A clonagem usa 1 fala-referência por personagem (bran_04, tess_03, odo_05 e vilao_04, marcadas como
            referência do timbre) para manter o mesmo timbre nas 5 falas. A semelhança de timbre medida entre as falas do
            mesmo personagem subiu: Bran 0,62 para 0,77; Tess 0,45 para 0,66; Odo 0,53 para 0,82; Vilão 0,56 para 0,74.
            Sem direção de emoção (o modelo Base não aceita). Os três homens ficaram mais parecidos entre si.{' '}
            <strong>Ainda não foi ouvido pelo Fernando</strong>: a semelhança é métrica, não prova de que soa bem.
          </p>
        </div>
        <div className="vz-botoes">
          {MODELOS.map((m) => (
            <button key={m.id} type="button" onClick={() => ouvirTudo(m.id)}>
              Ouvir tudo: {m.nome}
            </button>
          ))}
          <button type="button" onClick={() => ouvirTudo('qwen-clone')}>
            Ouvir tudo: Qwen3 clonado (timbre fixo)
          </button>
        </div>
        <p className="vz-apagado" role="status">
          {tocando ? `Tocando: ${tocando}` : ''}
        </p>
      </section>

      {PERSONAGENS.map((p) => (
        <section key={p.id} aria-labelledby={`vz-${p.id}`}>
          <h2 id={`vz-${p.id}`}>{p.nome}</h2>
          <p className="vz-apagado">Voz pedida: {p.voz}</p>
          {FALAS.filter((f) => f.personagem === p.id).map((f) => (
            <article className="vz-fala" key={f.id}>
              <p className="vz-texto">“{f.texto}”</p>
              <p>
                <span className="vz-tag">{f.emocao}</span>
                <span className="vz-apagado">{f.direcao}</span>
              </p>
              <div className="vz-players">
                {MODELOS.map((m) => (
                  <Jogador
                    key={m.id}
                    modelo={m.id}
                    nome={m.nome}
                    id={f.id}
                    falha={m.id === 'ming' ? (f.id === 'odo_03' ? 'sem áudio' : MING_FALHAS[f.id]) : undefined}
                  />
                ))}
                <Jogador
                  modelo="qwen-clone"
                  nome={QWEN_REFERENCIAS.includes(f.id) ? 'Qwen3 clonado, referência do timbre' : 'Qwen3 clonado (timbre fixo)'}
                  id={f.id}
                />
                {CLONES[f.id] && <Jogador modelo="ming-clone" nome={CLONES[f.id]} id={f.id} />}
                {EM_BREVE.map((n) => (
                  <div className="vz-player" key={n}>
                    <span className="vz-apagado">{n}</span>
                    <div className="vz-breve">em breve</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ))}

      <section aria-labelledby="vz-jogo">
        <h2 id="vz-jogo">No jogo</h2>
        <p>
          Próximo passo: embutir aqui a bancada do jogo (iframe, como o <code>MenuJogo</code> faz) com a voz escolhida
          tocando nas falas dos personagens. Ainda não implementado.
        </p>
      </section>
    </div>
  );
}
