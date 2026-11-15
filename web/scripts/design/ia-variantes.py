# Variantes das folhas de expressões (8 quadros de 256 px) para atacar o tremor da fala. Cada variante vira public/content/design/chars/ia-<nome>/<id>.png com o mesmo layout.
#  boca:   quadros 1 e 2 = quadro 0 com só a boca colada do quadro novo (oval suave); os outros ficam inteiros
#  script: rostos desenhados por código (pixel-faces.mjs), 4 quadros de 64 px ampliados; só tem boca (neutro, falando1, falando2)
#  alinhado: cada quadro deslocado para casar com a silhueta do quadro 0 (correlação de fase), sem mudar o desenho
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

IDS = ['barbarian', 'knight', 'lancer', 'mage', 'ranger', 'rogue_hooded', 'skeleton_mage']
RAIZ = 'public/content/design/chars'
PX_SCRIPT = sys.argv[1]  # pasta com os sheets do pixel-faces.mjs
F = 256

def quadros(im): return [im.crop((i * F, 0, (i + 1) * F, F)) for i in range(8)]
def junta(qs):
    s = Image.new('RGBA', (F * 8, F), (0, 0, 0, 0))
    for i, q in enumerate(qs): s.paste(q, (i * F, 0))
    return s

def colar_boca(base, outro):
    m = Image.new('L', (F, F), 0)
    ImageDraw.Draw(m).ellipse((F * .30, F * .56, F * .70, F * .80), fill=255)
    return Image.composite(outro, base, m.filter(ImageFilter.GaussianBlur(8)))

def deslocamento(a, b):
    # quanto mover b para casar com a, pela correlação de fase da máscara de opacidade
    fa, fb = np.fft.fft2(np.asarray(a)[..., 3] / 255.), np.fft.fft2(np.asarray(b)[..., 3] / 255.)
    r = fa * np.conj(fb); r /= np.abs(r) + 1e-9
    c = np.fft.ifft2(r).real
    dy, dx = np.unravel_index(np.argmax(c), c.shape)
    return (dx - F if dx > F // 2 else dx, dy - F if dy > F // 2 else dy)

def mover(q, dx, dy):
    o = Image.new('RGBA', (F, F), (0, 0, 0, 0)); o.paste(q, (dx, dy)); return o

BOCA = (.30, .56, .70, .82)  # região da boca; dentro dela só entra o que mudou de verdade (o protetor de bochecha do capacete não)
def colar_rosto(base, outro, caixa=(.24, .44, .76, .88), so_maior=False):
    # alinhado + cabeça parada: do quadro novo vem só o que mudou de verdade dentro do rosto (boca, olhos, sobrancelha);
    # traços finos de capacete, cabelo e queixo que só tremem ficam do neutro (a abertura da máscara descarta linhas de 1-2 px)
    from scipy import ndimage
    d = np.abs(np.asarray(outro).astype(int)[..., :3] - np.asarray(base).astype(int)[..., :3]).sum(2)
    oval = Image.new('L', (F, F), 0)
    ImageDraw.Draw(oval).ellipse(tuple(F * c for c in caixa), fill=255)
    m = (d > 90) & (np.asarray(oval) > 0)
    m = ndimage.binary_opening(m, structure=np.ones((5, 5)))
    if so_maior:  # fala: só a boca; manchas soltas (sombra do pescoço) saem
        lab, n = ndimage.label(m)
        if n > 1: m = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    m = ndimage.binary_dilation(m, iterations=6)
    mask = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(3))
    return Image.composite(outro, base, mask)

import os
for nome in ['boca', 'script', 'alinhado', 'alinhado-rosto']: os.makedirs(f'{RAIZ}/ia-{nome}', exist_ok=True)
for id_ in IDS:
    qs = quadros(Image.open(f'{RAIZ}/ia/{id_}.png').convert('RGBA'))
    junta([qs[0], colar_boca(qs[0], qs[1]), colar_boca(qs[0], qs[2])] + qs[3:]).save(f'{RAIZ}/ia-boca/{id_}.png')
    al = [qs[0]]
    for q in qs[1:]:
        dx, dy = deslocamento(qs[0], q); al.append(mover(q, dx, dy))
    junta(al).save(f'{RAIZ}/ia-alinhado/{id_}.png')
    # quadros de fala (1 e 2): só a boca (oval), o olho não pode mexer; demais expressões: só o que mudou de verdade no rosto
    junta([al[0], colar_rosto(al[0], al[1], BOCA, True), colar_rosto(al[0], al[2], BOCA, True)] + [colar_rosto(al[0], q) for q in al[3:]]).save(f'{RAIZ}/ia-alinhado-rosto/{id_}.png')
    sp = Image.open(f'{PX_SCRIPT}/{id_}.png').convert('RGBA')
    h = sp.height; fs = [sp.crop((i * h, 0, (i + 1) * h, h)).resize((F, F), Image.NEAREST) for i in range(4)]
    junta([fs[0], fs[2], fs[3]] + [fs[0]] * 5).save(f'{RAIZ}/ia-script/{id_}.png')
    print(id_, 'ok')
