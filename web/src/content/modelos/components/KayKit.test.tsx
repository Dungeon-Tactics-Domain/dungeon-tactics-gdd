import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KayKit, type ListaDeClipes } from './KayKit';

const LISTA: ListaDeClipes = {
  jogo: [
    { name: 'Idle', dur: 1.07 },
    { name: 'Walking_A', dur: 1.07 },
  ],
  pacote: [
    { categoria: 'MovementBasic', clipes: [{ name: 'Walking_A', dur: 1.07 }] },
    { categoria: 'Tools', clipes: [{ name: 'Chop', dur: 1.5 }] },
  ],
};

function bancada(resposta: Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(resposta)),
  );
}
const params = () => new URL(screen.getByTitle('Personagem KayKit 3D').getAttribute('src')!).searchParams;

afterEach(() => vi.unstubAllGlobals());

describe('KayKit', () => {
  it('opens the knight playing Idle from the game model, by parts, at game scale', async () => {
    bancada(Response.json(LISTA));
    render(<KayKit />);
    await screen.findByTitle('Personagem KayKit 3D');
    const q = params();
    expect(Object.fromEntries(q)).toMatchObject({
      glb: '/models/knight.glb',
      char: 'knight',
      kaykit: '1',
      solo: '1',
      anim: 'Idle',
      zoom: '1.2',
    });
    expect(q.has('head')).toBe(false);
  });

  it('swaps characters, parts, pack clips and weapons', async () => {
    bancada(Response.json(LISTA));
    render(<KayKit />);
    await screen.findByTitle('Personagem KayKit 3D');

    await userEvent.click(screen.getByRole('button', { name: 'Esqueleto mago' }));
    expect([params().get('glb'), params().get('char')]).toEqual(['/models/skeleton_mage.glb', 'skeleton_mage']);

    // a part from another class, or none; "Do personagem" brings the base one back
    const cabeca = screen.getByRole('group', { name: '🙂 Cabeça' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Mago' }).find((b) => cabeca.contains(b))!);
    await userEvent.click(screen.getAllByRole('button', { name: 'Nenhum' })[5]!); // cape
    expect([params().get('head'), params().get('cape')]).toEqual(['mage', 'none']);
    await userEvent.click(screen.getAllByRole('button', { name: 'Do personagem' }).find((b) => cabeca.contains(b))!);
    expect(params().has('head')).toBe(false);

    // pack clips go by "<category>/<clip>"; the game ones are starred
    await userEvent.click(screen.getByRole('button', { name: 'Chop' }));
    expect(params().get('anim')).toBe('Tools/Chop');
    expect(screen.getByRole('button', { name: 'Walking A ★' })).toBeInTheDocument();
    expect(screen.getByText(/Tocando: Chop \(1,5 s\)/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Espada do cavaleiro' }));
    await userEvent.click(screen.getByRole('button', { name: 'Escudo de cravos' }));
    expect([params().get('weapon'), params().get('off')]).toEqual(['sword_1handed', 'shield_spikes']);
    await userEvent.click(screen.getByRole('button', { name: 'Espadão' }));
    expect([params().get('weapon'), params().get('off')]).toEqual(['sword_2handed', null]);
  });

  it('says the bench did not answer when the clip list does not load', async () => {
    bancada(new Response(null, { status: 200 }));
    render(<KayKit />);
    expect(await screen.findByText(/não respondeu/)).toBeInTheDocument();
  });
});
