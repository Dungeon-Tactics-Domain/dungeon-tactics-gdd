// The kingdom map: 1000 x 600 painted SVG, one town per lab (flag + sign) placed from lib/labs.ts, roads from the port
// computed from the data, and one boat per running subagent. Below 700px the art becomes a backdrop behind a town grid.
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { stateLabel, type Town } from '@/lib/fabrica';
import { PORT } from '@/lib/labs';
import { cn } from '@/lib/utils';
import './mapa.css';

const W = 1000;
const H = 600;
const WAVES = [
  [90, 545],
  [250, 575],
  [700, 560],
  [860, 540],
  [380, 585],
  [560, 590],
  [930, 585],
  [40, 470],
] as const;

function Arte({ towns, ativo }: { towns: Town[]; ativo: boolean }) {
  const px = (PORT.x / 100) * W;
  const py = (PORT.y / 100) * H;
  // a few boats at most, so the bay never jams
  const subs = towns.flatMap((t) => t.subs).slice(0, 8);
  return (
    <svg
      className={cn('mapa-arte', ativo && 'porto-ativo')}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width={W} height={H} fill="var(--color-mar)" />
      <g className="ondas">
        {WAVES.map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q8 -6 16 0 q8 6 16 0`} style={{ animationDelay: `${(i * 0.7).toFixed(1)}s` }} />
        ))}
      </g>
      <path
        className="terra"
        d="M30 90 C150 30 330 60 470 80 C620 100 760 40 900 70 C990 90 990 220 975 320 C960 420 990 470 900 500 C800 530 680 470 600 485 C560 492 540 505 500 505 C450 505 430 488 390 488 C300 490 200 540 110 505 C30 475 15 380 22 280 C28 190 0 130 30 90 Z"
      />
      <path className="rio" d="M640 120 C600 190 660 250 610 320 S520 420 520 500" />
      <g className="montes">
        <path d="M590 130 l34 -60 34 60z" />
        <path d="M630 140 l28 -48 28 48z" />
        <path d="M300 330 l30 -54 30 54z" />
        <path d="M335 340 l24 -42 24 42z" />
        <path d="M870 360 l30 -52 30 52z" />
      </g>
      <g className="matas">
        {[
          [250, 250, 16],
          [275, 265, 12],
          [228, 268, 12],
          [720, 300, 15],
          [745, 318, 11],
          [420, 400, 13],
          [110, 420, 13],
          [930, 160, 12],
        ].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g className="estradas">
        {towns
          .filter((t) => t.place.id !== PORT.id)
          .map((t) => {
            const x = (t.place.x / 100) * W;
            const y = (t.place.y / 100) * H;
            const cx = ((px + x) / 2 + (y - py) * 0.25).toFixed(0);
            const cy = ((py + y) / 2 - (x - px) * 0.12).toFixed(0);
            return <path key={t.place.id} d={`M${px} ${py} Q${cx} ${cy} ${x} ${y}`} />;
          })}
      </g>
      <g className="porto">
        <path className="cais" d="M470 505 v28 M530 505 v28 M462 533 h76" />
        <rect className="galpao" x="476" y="470" width="48" height="30" />
        <path className="telhado" d="M470 472 l30 -20 30 20z" />
        <rect className="chamine" x="512" y="446" width="8" height="18" />
        <g className="fumaca">
          <circle cx="516" cy="438" r="6" />
          <circle cx="520" cy="430" r="8" style={{ animationDelay: '.8s' }} />
          <circle cx="514" cy="424" r="7" style={{ animationDelay: '1.6s' }} />
        </g>
      </g>
      <g className="barcos">
        {subs.map((d, i) => (
          <g key={d.id} transform={`translate(${180 + ((i * 97) % 640)} ${548 + (i % 3) * 16})`}>
            <g className="barco-vai" style={{ animationDelay: `-${(i * 1.3).toFixed(1)}s` }}>
              <title>{`${d.nome || d.id} (${d.modelo || 'modelo não informado'})`}</title>
              <path className="casco" d="M-16 0 h32 l-6 9 h-20z" />
              <path className="mastro" d="M0 0 v-22" />
              <path className="vela" d="M1 -21 l13 17 h-13z" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}

const Bandeira = () => (
  <svg className="bandeira" viewBox="0 0 40 44" aria-hidden="true" focusable="false">
    <path className="mastro" d="M6 42 V3" />
    <path className="pano" d="M7 4 h26 l-6 8 l6 8 h-26z" />
    <circle className="ponta" cx="6" cy="3" r="2.5" />
  </svg>
);

function Cidade({ t, mudou }: { t: Town; mudou: boolean }) {
  const isPort = t.place.id === PORT.id;
  const s = t.stations[0];
  // the port sums up its sessions; a town shows its session's task, or the lab's fixed description
  const linha = isPort ? `${t.stations.length} sessão(ões) de orquestração` : s?.tarefa || t.place.descricao;
  const n = t.subs.length;
  const corpo = (
    <>
      <Bandeira />
      <span className="placa">
        <b className="nome">{t.place.curto}</b>
        <Badge estado={t.estado ?? 'nenhum'}>{t.estado ? stateLabel(t.estado) : 'Sem sessão'}</Badge>
        <span className="linha">{linha}</span>
        {n > 0 && <span className="barcos-txt">⛵ {`${n} subagente${n > 1 ? 's' : ''} rodando`}</span>}
        {!t.place.href && <span className="linha">{t.generic ? 'Lab novo, sem página' : 'Ainda sem página'}</span>}
      </span>
    </>
  );
  const props = {
    className: cn('cidade', isPort && 'porto-cidade', t.generic && 'generica', mudou && 'mudou'),
    'data-estado': t.estado ?? 'nenhum',
    style: { '--c': t.place.cor, '--x': `${t.place.x}%`, '--y': `${t.place.y}%` } as CSSProperties,
  };
  return (
    <li>
      {t.place.href ? (
        <Link to={t.place.href} {...props}>
          {corpo}
        </Link>
      ) : (
        <div {...props}>{corpo}</div>
      )}
    </li>
  );
}

export function Mapa({ towns }: { towns: Town[] }) {
  // towns whose state changed since the last reading pulse once and are announced politely
  const antes = useRef<Map<string, string> | null>(null);
  const [mudancas, setMudancas] = useState<{ ids: Set<string>; texto: string }>({ ids: new Set(), texto: '' });
  const chave = towns.map((t) => `${t.place.id}:${t.estado ?? ''}`).join('|');
  useEffect(() => {
    const agora = new Map(towns.map((t) => [t.place.id, t.estado ?? '']));
    const prev = antes.current;
    antes.current = agora;
    // the empty map before the first reading does not count as a change
    if (!prev || [...prev.values()].every((v) => !v)) return;
    const ids = new Set([...agora].filter(([id, e]) => prev.has(id) && prev.get(id) !== e).map(([id]) => id));
    if (!ids.size) return;
    const texto = towns
      .filter((t) => ids.has(t.place.id))
      .map((t) => `${t.place.curto}: ${t.estado ? stateLabel(t.estado) : 'sem sessão'}.`)
      .join(' ');
    // a state change arrives from the stream, outside React; the announcement has to follow it
    setMudancas({ ids, texto });
    // keyed on the states only, not on the array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  const port = towns.find((t) => t.place.id === PORT.id);
  const ativo = towns.some((t) => t.estado === 'rodando') || !!port?.subs.length;
  return (
    <div className="mapa-palco">
      <Arte towns={towns} ativo={ativo} />
      <ul className="cidades" aria-label="Cidades do reino">
        {towns.map((t) => (
          <Cidade key={t.place.id} t={t} mudou={mudancas.ids.has(t.place.id)} />
        ))}
      </ul>
      <div className="sr-only" aria-live="polite">
        {mudancas.texto}
      </div>
    </div>
  );
}
