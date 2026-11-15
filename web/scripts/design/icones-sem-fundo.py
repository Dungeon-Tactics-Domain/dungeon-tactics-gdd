# Tira o fundo azul-marinho dos ícones de 32 px (atlas-32.png, 6x4): o que é fundo ligado à borda do quadro fica transparente
# e a franja de antialias vira opacidade parcial (cor desmisturada do azul), para o ícone se misturar com qualquer fundo.
import numpy as np
from PIL import Image
from scipy import ndimage

D = 'public/content/design/ia/icones'
import sys
SUAVE = len(sys.argv) > 1 and sys.argv[1] == 'suave'
im = np.asarray(Image.open(f'{D}/atlas-32.png').convert('RGB')).astype(float)
C, COLS, ROWS = 32, 6, 4
out = np.zeros((C * ROWS, C * COLS, 4))
# onda sombria (índice 16): o roxo escuro do interior é parecido com o fundo, então o limite é mais apertado
APERTA = {16: (24, 48)}  # (distância máxima, azul menos vermelho mínimo)
for r in range(ROWS):
    for c in range(COLS):
        q = im[r * C:(r + 1) * C, c * C:(c + 1) * C]
        # fundo = degradê vertical: mediana de cada linha nas colunas de borda (sem o 1º pixel, que é a moldura clara)
        # fundo = superfície quadrática (x, y) ajustada nos pixels da faixa de 4 px junto à borda, só os que parecem azul-marinho (descarta o ícone que encosta na borda)
        yy, xx = np.mgrid[0:C, 0:C]; u, v = xx / C - .5, yy / C - .5
        A = np.stack([np.ones_like(u), u, v, u * v, u * u, v * v], -1).reshape(-1, 6)
        anel = ((xx >= 1) & (yy >= 1) & ((xx < 5) | (yy < 5) | (xx >= C - 5) | (yy >= C - 5)) & (xx < C - 1) & (yy < C - 1)).ravel()
        azul = (q[..., 2] > q[..., 0] + 25).ravel() & (q.reshape(-1, 3).max(1) < 150)
        pts = anel & azul
        bg = np.stack([A @ np.linalg.lstsq(A[pts], q.reshape(-1, 3)[pts, k], rcond=None)[0] for k in range(3)], -1).reshape(C, C, 3)
        dist = np.linalg.norm(q - bg, axis=2)
        dmax, azmin = APERTA.get(r * COLS + c, (40, 28))
        lab, n = ndimage.label((dist < dmax) & (q[..., 2] - q[..., 0] > azmin))
        borda = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        fundo = np.isin(lab, list(borda))
        # miolo azul-marinho fechado por um traço claro (machado): fundo também, se for grande e bem próximo do degradê
        l2, n2 = ndimage.label((dist < 22) & (q[..., 2] - q[..., 0] > 28) & ~fundo)
        for k in range(1, n2 + 1):
            if (l2 == k).sum() >= 30: fundo |= l2 == k
        fundo[[0, -1], :] = True; fundo[:, [0, -1]] = True  # moldura de 1 px
        # franja: pixel vizinho do fundo com cor ainda misturada ganha opacidade parcial
        perto = ndimage.binary_dilation(fundo, iterations=2 if SUAVE else 1) & ~fundo
        a = np.ones((C, C))
        a[fundo] = 0
        a[perto] = np.clip((dist[perto] - (4 if SUAVE else 14)) / (70 if SUAVE else 40), 0, 1) ** (1.0 if SUAVE else 1.0)
        a = np.maximum(a, 0)
        # desmistura: cor = (pixel - (1-a)*fundo) / a
        cor = np.where(a[..., None] > .05, (q - (1 - a[..., None]) * bg) / np.maximum(a[..., None], .05), q)
        out[r * C:(r + 1) * C, c * C:(c + 1) * C] = np.dstack([np.clip(cor, 0, 255), a * 255])
res = Image.fromarray(out.astype(np.uint8), 'RGBA')
SUF = '-suave' if SUAVE else '-sem-fundo'
res.save(f'{D}/atlas-32{SUF}.png')
# prévia em 4x sobre claro e escuro
for nome, cor in [('claro', (236, 226, 196, 255)), ('escuro', (40, 40, 48, 255))]:
    fundo = Image.new('RGBA', res.size, cor); fundo.alpha_composite(res)
    fundo.resize((res.width * 4, res.height * 4), Image.NEAREST).save(f'{D}/atlas-32{SUF}-{nome}.png')
