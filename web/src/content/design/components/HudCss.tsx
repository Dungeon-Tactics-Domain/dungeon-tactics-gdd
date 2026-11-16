// The same combat bar as cena-hud.ts, but in HTML/CSS over the same 3D scene (the canvas has no HUD pass here).
import { ALVO, ATACANTE, type Lado } from './hud-dados';

const VIDRO = 'border border-white/15 bg-[#0c1118]/55 backdrop-blur-md';

function Barra({
  rotulo,
  v,
  m,
  cor,
  previa,
  aplicado,
}: {
  rotulo: string;
  v: number;
  m: number;
  cor: string;
  previa?: number;
  aplicado?: boolean;
}) {
  const depois = previa ? Math.max(0, v - previa) : v;
  const pct = (x: number) => `${(x / m) * 100}%`;
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white sm:text-xs">
      <span className="hidden w-5 text-[#9fb0c0] sm:inline">{rotulo}</span>
      <div className="relative h-[7px] flex-1 rounded-full bg-black/40">
        {previa ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#ef4444] transition-[width] duration-[1200ms] ease-out"
            style={{ width: aplicado ? pct(depois) : pct(v) }}
          />
        ) : null}
        <div className={`absolute inset-y-0 left-0 rounded-full ${cor}`} style={{ width: pct(depois) }} />
      </div>
      <span className="w-10 text-right tabular-nums">
        {aplicado ? depois : v}/{m}
      </span>
    </div>
  );
}

const ROSTOS = {
  'knight': { url: 'ia-alinhado-rosto/knight.png', n: 8, dano: 4, grito: 3 },
  'skeleton_mage': { url: 'ia-alinhado-rosto/skeleton_mage.png', n: 8, dano: 4, grito: 3 },
} as const;

function BlocoLado({ d, img, espelho, aplicado }: { d: Lado; img: keyof typeof ROSTOS; espelho?: boolean; aplicado?: boolean }) {
  const r = ROSTOS[img];
  const frame = aplicado ? (espelho ? r.dano : r.grito) : 0;
  const painel = (
    <div className="hidden w-[88px] shrink-0 self-center rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-[#9fb0c0] sm:block">
      <div className="flex justify-between py-1">
        Bravura <b className="text-sm text-white">{d.bravura}</b>
      </div>
      <div className="flex justify-between py-1">
        Fé <b className="text-sm text-white">{d.fe}</b>
      </div>
    </div>
  );
  return (
    <div className={`${VIDRO} flex min-w-0 flex-1 gap-2 rounded-[10px] p-2 ${espelho ? 'flex-row-reverse' : ''}`}>
      <div className="relative aspect-square h-[56px] shrink-0 overflow-hidden rounded-md border border-white/30 bg-[#1b2733] sm:h-[114px]">
        <div
          className="size-full [image-rendering:pixelated]"
          style={{
            backgroundImage: `url(/content/design/chars/${r.url})`,
            backgroundSize: `${r.n * 100}% 100%`,
            backgroundPosition: `${(frame / (r.n - 1)) * 100}% 0`,
          }}
        />
        <span className="absolute left-[3px] top-[3px] rounded bg-black/75 px-1 text-[11px] font-bold text-white">
          {d.turno}
        </span>
        <span className="absolute right-[3px] top-[3px] text-[11px] text-[#f5d36b]">★</span>
        {d.inimigo && (
          <span className="absolute inset-x-1 bottom-0.5 rounded-full bg-[#b91c1c] text-center text-[10px] font-bold text-white">
            Inimigo
          </span>
        )}
      </div>
      {espelho && painel}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-baseline justify-between text-white">
          <b className="text-[13px] sm:text-lg">{d.nome}</b>
          <span className="text-[11px] text-[#9fb0c0] sm:text-[13px]">Nv {d.nv}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Barra
            rotulo="HP"
            v={d.hp[0]}
            m={d.hp[1]}
            cor="bg-gradient-to-b from-[#4ade80] to-[#16a34a]"
            previa={d.previa}
            aplicado={aplicado}
          />
          <Barra rotulo="PM" v={d.mp[0]} m={d.mp[1]} cor="bg-gradient-to-b from-[#f87171] to-[#dc2626]" />
          <div className="hidden sm:block">
            <Barra rotulo="CT" v={d.ct[0]} m={d.ct[1]} cor="bg-gradient-to-b from-[#fde047] to-[#ca8a04]" />
          </div>
        </div>
        <div className="hidden items-baseline justify-between border-t border-white/10 pt-1 text-white sm:flex">
          <b className="text-[13px]">{d.classe}</b>
          <span className="text-xs text-[#9fb0c0]">
            Próx {d.prox} PH {d.ph}
          </span>
        </div>
      </div>
      {!espelho && painel}
    </div>
  );
}

export function HudCss({ aplicado, aoTocar }: { aplicado: boolean; aoTocar: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-stretch gap-1 sm:gap-2">
      <BlocoLado d={ATACANTE} img="knight" />
      <button
        type="button"
        onClick={aoTocar}
        className="pointer-events-auto relative flex w-[52px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-[10px] border border-white/15 bg-[#05080c]/70 text-white backdrop-blur-md sm:w-44"
      >
        <span className="mb-1 hidden gap-10 text-[11px] font-bold sm:flex">
          <span>⚔ 100%</span>
          <span>⚡ 100%</span>
        </span>
        <b className="text-[26px] leading-none sm:text-5xl">{ALVO.previa}</b>
        <span className="text-[11px] text-[#9fb0c0] sm:text-[13px]">Dano</span>
        <span className="absolute -right-[11px] top-[18%] size-0 border-y-[17px] border-l-[12px] border-y-transparent border-l-[#0c1118]/90" />
      </button>
      <BlocoLado d={ALVO} img="skeleton_mage" espelho aplicado={aplicado} />
    </div>
  );
}
