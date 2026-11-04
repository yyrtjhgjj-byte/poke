"""依頼者の画像から、ページに埋め込む assets/ の画像を作る。

1) ドット絵 spec/sprite/draffia.png → assets/draffia.png（元の画素数 72×58 に戻す）
2) イラスト spec/art/draffia-sylveon.png → assets/draffia-sylveon.webp（幅1400px・WebP）

原本は約17倍に拡大された 72×58 のドット絵。各マスの内側の中央値を取り、
透明な画素の色情報は0にそろえる（見た目は変えない）。ページでは image-rendering: pixelated で拡大表示する。
使い方: python3 scripts/assets.py
"""
import pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'spec' / 'sprite' / 'draffia.png'
OUT = ROOT / 'assets' / 'draffia.png'
W, H = 72, 58

a = np.array(Image.open(SRC).convert('RGBA')).astype(int)
H0, W0 = a.shape[:2]
out = np.zeros((H, W, 4), np.uint8)
for j in range(H):
    for i in range(W):
        y0, y1 = int(j * H0 / H), int((j + 1) * H0 / H)
        x0, x1 = int(i * W0 / W), int((i + 1) * W0 / W)
        blk = a[y0 + 3:y1 - 3, x0 + 3:x1 - 3].reshape(-1, 4)
        op = blk[blk[:, 3] > 127]
        if len(op) >= len(blk) * 0.5:
            out[j, i] = list(np.median(op[:, :3], axis=0).astype(int)) + [255]
OUT.parent.mkdir(exist_ok=True)
Image.fromarray(out, 'RGBA').save(OUT, optimize=True)
print(f'{OUT.relative_to(ROOT)}  {W}x{H}  {OUT.stat().st_size} bytes')

# ---------- イラスト（縮小して WebP に） ----------
ART = ROOT / 'spec' / 'art' / 'draffia-sylveon.png'
ART_OUT = ROOT / 'assets' / 'draffia-sylveon.webp'
im = Image.open(ART).convert('RGB')
w = 1400
im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
im.save(ART_OUT, 'WEBP', quality=80, method=6)
print(f'{ART_OUT.relative_to(ROOT)}  {im.width}x{im.height}  {ART_OUT.stat().st_size} bytes')
