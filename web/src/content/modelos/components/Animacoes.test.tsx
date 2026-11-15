import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Animacoes, urlDaAnimacao } from './Animacoes';

const GLB = 'http://localhost:5205/eval/anim-fable/char.glb';
const B = 'http://localhost:5205/eval.html';

function bancadaNoAr(headers: HeadersInit = { 'content-type': 'model/gltf-binary' }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(null, { status: 200, headers }))),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('urlDaAnimacao', () => {
  it('uses the clip zoom, the scene zoom and the fable effects', () => {
    const q = (u: string) => new URL(u).searchParams;
    expect(q(urlDaAnimacao('opus', GLB, 'clip:Idle', '', '', '')).get('anim')).toBe('Idle');
    expect(q(urlDaAnimacao('opus', GLB, 'clip:Idle', '', '', '')).get('zoom')).toBe('1.6');
    const cena = q(urlDaAnimacao('fable-leve', GLB, 'jump:over', '', '', ''));
    expect([cena.get('jump'), cena.get('zoom'), cena.get('fx')]).toEqual(['over', '3.4', '1']);
  });
});

describe('Animacoes', () => {
  it('plays a clip and combines weapons like the old lab', async () => {
    bancadaNoAr();
    render(<Animacoes modelo="fable">intro</Animacoes>);
    const iframe = await screen.findByTitle('Animação 3D');
    expect(iframe).toHaveAttribute(
      'src',
      `${B}?${new URLSearchParams({ glb: GLB, zoom: '1.6', anim: 'Idle', fx: '1' })}`,
    );
    expect(screen.getByText('intro')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Soco' }));
    expect(new URL(iframe.getAttribute('src')!).searchParams.get('anim')).toBe('Melee_Unarmed_Attack_Punch_A');

    await userEvent.click(screen.getByRole('button', { name: 'Espada' }));
    await userEvent.click(screen.getByRole('button', { name: 'Escudo' }));
    let q = new URL(iframe.getAttribute('src')!).searchParams;
    expect([q.get('weapon'), q.get('off')]).toEqual(['sword_A', 'shield_A']);

    // two hands clear the others; the bow goes to the off hand
    await userEvent.click(screen.getByRole('button', { name: 'Arco' }));
    q = new URL(iframe.getAttribute('src')!).searchParams;
    expect([q.get('weapon'), q.get('off')]).toEqual([null, 'bow_A_withString']);

    // clicking the active weapon removes it
    await userEvent.click(screen.getByRole('button', { name: 'Arco' }));
    expect(new URL(iframe.getAttribute('src')!).searchParams.has('off')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Andando numa rampa' }));
    q = new URL(iframe.getAttribute('src')!).searchParams;
    expect([q.get('walk'), q.get('zoom')]).toEqual(['ramp', '3.4']);
    expect(screen.getByRole('button', { name: 'Andando numa rampa' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('says it is in progress when the file is missing or the server answers with the page', async () => {
    bancadaNoAr({ 'content-type': 'text/html' });
    render(<Animacoes modelo="sonnet">intro</Animacoes>);
    expect(await screen.findByText(/Em andamento/)).toBeInTheDocument();
    expect(screen.queryByText('intro')).toBeNull();
  });
});
