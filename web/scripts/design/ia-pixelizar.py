# Versão C da bancada: a versão A (só a boca colada) passada pelo proper-pixel-art com grade fixa de 2 px (128x128, 48 cores por personagem; a de 4 px / 64x64 perdeu detalhe demais),
# ampliada 2x sem suavizar para manter o sheet de 8 quadros de 256 px. Roda no venv-pixel (D:\Projetos\_ferramentas\venv-pixel).
from pathlib import Path
from PIL import Image
from proper_pixel_art.config import PixelateConfig
from proper_pixel_art.video import FramePipeline

RAIZ = Path('public/content/design/chars')
cfg = PixelateConfig.from_dict({'pixel_width': 2, 'colors': {'method': 'palette', 'background_candidates': [[24, 20, 28]], 'palette': {'num_colors': 48, 'kmeans': 4}}})
regular = (list(range(0, 513, 4)), list(range(0, 513, 4)))  # malha de 2 px no espaço 2x do pacote
(RAIZ / 'ia-pixel2').mkdir(exist_ok=True)
for id_ in ['barbarian', 'knight', 'lancer', 'mage', 'ranger', 'rogue_hooded', 'skeleton_mage']:
    sheet = Image.open(RAIZ / 'ia-boca' / f'{id_}.png').convert('RGBA')
    frames = [sheet.crop((q * 256, 0, q * 256 + 256, 256)) for q in range(8)]
    pipe = FramePipeline(regular, 2, (256, 256), frames, color_config=cfg.colors)
    out = Image.new('RGBA', (256 * 8, 256), (0, 0, 0, 0))
    for q, f in enumerate(frames):
        p = pipe.process(f).convert('RGBA')
        out.paste(p.resize((256, 256), Image.NEAREST), (q * 256, 0))
    out.save(RAIZ / 'ia-pixel2' / f'{id_}.png')
    print(id_, 'ok')
