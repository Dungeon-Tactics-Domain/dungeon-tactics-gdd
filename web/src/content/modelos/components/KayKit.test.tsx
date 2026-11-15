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
    // the viewer comes before the options (left column; on top when stacked)
    const opcoes = screen.getByRole('group', { name: '🧍 Personagem' });
    expect(
      screen.getByTitle('Personagem KayKit 3D').compareDocumentPosition(opcoes) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

  it('plays the game scenes (walk, jump, reactions, water) with the parts and weapons', async () => {
    bancada(Response.json(LISTA));
    render(<KayKit />);
    await screen.findByTitle('Personagem KayKit 3D');
    await userEvent.click(screen.getAllByRole('button', { name: 'Bárbaro' })[0]!); // the base character
    const cabeca = screen.getByRole('group', { name: '🙂 Cabeça' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Mago' }).find((b) => cabeca.contains(b))!);
    await userEvent.click(screen.getByRole('button', { name: 'Machado grande' }));

    await userEvent.click(screen.getByRole('button', { name: 'Por cima de uma casa vazia' }));
    expect(Object.fromEntries(params())).toMatchObject({
      glb: '/models/barbarian.glb',
      kaykit: '1',
      jump: 'over',
      zoom: '2.6',
      head: 'mage',
      weapon: 'axe_2handed',
    });
    expect(params().has('anim')).toBe(false);
    expect(screen.getByText('Tocando: Por cima de uma casa vazia')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Andando numa rampa' }));
    expect(params().get('walk')).toBe('ramp');
    await userEvent.click(screen.getByRole('button', { name: 'Cena: batendo na parede' }));
    expect(params().get('act')).toBe('wall');
    await userEvent.click(screen.getByRole('button', { name: /nadando/ }));
    expect(params().get('act')).toBe('swim');

    // back to a clip: the scene leaves the URL and the zoom closes in again
    await userEvent.click(screen.getByRole('button', { name: 'Idle' }));
    expect([params().get('anim'), params().has('act'), params().get('zoom')]).toEqual(['Idle', false, '1.2']);
  });

  it('says the bench did not answer when the clip list does not load', async () => {
    bancada(new Response(null, { status: 200 }));
    render(<KayKit />);
    expect(await screen.findByText(/não respondeu/)).toBeInTheDocument();
  });
});
