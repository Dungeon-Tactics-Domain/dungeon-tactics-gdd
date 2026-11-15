import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DECISOES_ATIVAS } from '@/lib/recursos';
import { DecisaoAsset } from './DecisaoAsset';
import { Stars } from './Stars';

describe('decision UI paused (DECISOES_ATIVAS = false)', () => {
  it('renders nothing and never calls the API', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { container } = render(
      <>
        <DecisaoAsset id="musica/a" rotulo="Faixa" />
        <Stars chave="t:nota" rotulo="Faixa" />
      </>,
    );
    expect(DECISOES_ATIVAS).toBe(false);
    expect(container).toBeEmptyDOMElement();
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
