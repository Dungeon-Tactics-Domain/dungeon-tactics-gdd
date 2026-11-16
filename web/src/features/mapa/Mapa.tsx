// The kingdom map: 1000 x 600 painted SVG, one town per lab (flag + sign) placed from lib/labs.ts, roads from the harbour
// computed from the data. Below 700px the art becomes a backdrop behind a town grid.
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { CONTEUDO } from '@/content/registry';
import { HUB, type Place } from '@/lib/labs';
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

function Arte({ labs }: { labs: Place[] }) {
  const px = (HUB.x / 100) * W;
  const py = (HUB.y / 100) * H;
  return (
    <svg
      className="mapa-arte"
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
        {labs.map((p) => {
          const x = (p.x / 100) * W;
          const y = (p.y / 100) * H;
          const cx = ((px + x) / 2 + (y - py) * 0.25).toFixed(0);
          const cy = ((py + y) / 2 - (x - px) * 0.12).toFixed(0);
          return <path key={p.id} d={`M${px} ${py} Q${cx} ${cy} ${x} ${y}`} />;
        })}
      </g>
      <g className="porto">
        <path className="cais" d="M470 505 v28 M530 505 v28 M462 533 h76" />
        <rect className="galpao" x="476" y="470" width="48" height="30" />
        <path className="telhado" d="M470 472 l30 -20 30 20z" />
        <rect className="chamine" x="512" y="446" width="8" height="18" />
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

function Cidade({ p }: { p: Place }) {
  const corpo = (
    <>
      <Bandeira />
      <span className="placa">
        <b className="nome">{p.curto}</b>
        <span className="linha">{p.descricao}</span>
        {!p.href && <span className="linha">Ainda sem página</span>}
        {/* labs still served by the old lab (no folder in src/content yet) */}
        {p.antigo && !CONTEUDO[p.id] && <span className="linha">Ainda não migrado</span>}
      </span>
    </>
  );
  const props = {
    className: 'cidade',
    style: { '--c': p.cor, '--x': `${p.x}%`, '--y': `${p.y}%` } as CSSProperties,
  };
  return (
    <li>
      {p.href ? (
        <Link to={p.href} {...props}>
          {corpo}
        </Link>
      ) : (
        <div {...props}>{corpo}</div>
      )}
    </li>
  );
}

export function Mapa({ labs }: { labs: Place[] }) {
  return (
    <div className="mapa-palco">
      <Arte labs={labs} />
      <ul className="cidades" aria-label="Cidades do reino">
        {labs.map((p) => (
          <Cidade key={p.id} p={p} />
        ))}
      </ul>
    </div>
  );
}
