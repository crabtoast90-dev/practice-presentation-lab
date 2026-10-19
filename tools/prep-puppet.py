# Format B prep: turn See-through's layers (hero/layers/hero.psd + hero_depth.psd) into the
# puppet's web textures in public/puppet/. Your original art stays the base everywhere it is
# visible; the layers only fill what moving hair uncovers and give the eye/mouth/cape masks.
#   python3 -I tools/prep-puppet.py <art.png> <birefnet-mask.png> <layers-dir> <out-dir>
# Writes body.webp, hair-back.webp, hair-front.webp, bg.webp, masks.png, rig.json.
import json, sys
import numpy as np
import cv2
from PIL import Image
from psd_tools import PSDImage

art_path, mask_path, layers_dir, out = sys.argv[1:5]
W, H = 1200, 1754
SQ, X0, XW = 1280, 202, 876  # See-through worked on a 1280 square, the art 876 wide at x=202

art = np.asarray(Image.open(art_path).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
char = np.asarray(Image.open(mask_path).convert('L').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255

def to_art(img):  # 1280-square layer canvas -> art space (W x H)
    return np.asarray(img.crop((X0, 0, X0 + XW, SQ)).resize((W, H), Image.LANCZOS)).astype(np.float32) / 255

def layers(psd):
    out_ = {}
    for l in PSDImage.open(psd).descendants():
        canvas = Image.new('RGBA', (SQ, SQ), (0, 0, 0, 0))
        canvas.paste(l.topil().convert('RGBA'), (l.left, l.top))
        out_[l.name] = to_art(canvas)
    return out_

C = layers(f'{layers_dir}/hero.psd')
D = {k: v[..., 0] for k, v in layers(f'{layers_dir}/hero_depth.psd').items()}
HAIR = ['back hair', 'front hair']
nonhair = [n for n in C if n not in HAIR]

# Everything except hair, stacked per pixel by depth (far first): what sits under the hair.
stack = np.stack([np.where(C[n][..., 3] > 0.01, D[n], -1) for n in nonhair])
order = np.argsort(-stack, axis=0)
nh_rgb = np.zeros((H, W, 3), np.float32)
nh_a = np.zeros((H, W), np.float32)
cols = np.stack([C[n] for n in nonhair])
for k in range(len(nonhair)):
    c = np.take_along_axis(cols, order[k][None, ..., None].repeat(4, -1), 0)[0]
    a = c[..., 3]
    nh_rgb = nh_rgb * (1 - a[..., None]) + c[..., :3] * a[..., None]
    nh_a = nh_a + a * (1 - nh_a)
nh_rgb = nh_rgb / np.maximum(nh_a[..., None], 1e-4) * (nh_a[..., None] > 1e-4)

bh, fh = C['back hair'][..., 3], C['front hair'][..., 3]
hair_only = np.clip(bh + fh, 0, 1) * (1 - nh_a)  # hair over background, nothing of the body under it
body_a = char * (1 - hair_only)
top = np.nonzero(fh > 0.3)[0].min() / H
yy0 = (np.arange(H) / H)[:, None]
# Under the front hair: the filled-in body, but only where the hair can move (not the crown).
w = (np.clip(fh * 1.6, 0, 1) * np.clip((yy0 - top - 0.07) / 0.05, 0, 1))[..., None]
body_rgb = art * (1 - w) + nh_rgb * w

back_vis = np.clip(hair_only * 1.5, 0, 1)[..., None]
hb_rgb = C['back hair'][..., :3] * (1 - back_vis) + art * back_vis  # true art colors where it shows
hf_rgb = art  # the front hair is always on top in the art

# Background without the character: the art's backdrop is a plain studio grey, so each row
# blends the colours at the art's left and right edges (no guessing inside the silhouette).
left = np.median(art[:, : W // 20], axis=1)
right = np.median(art[:, -W // 20:], axis=1)
t = np.linspace(0, 1, W)[None, :, None]
bg = cv2.GaussianBlur(left[:, None, :] * (1 - t) + right[:, None, :] * t, (0, 0), 8)

# Keep the body solid wherever the art isn't plain backdrop (mask holes, the floor shadow).
differs = np.clip((np.abs(art - bg).max(-1) - 0.04) / 0.06, 0, 1)
body_a = np.maximum(body_a, differs * (1 - hair_only))

def save_rgba(name, rgb, a):
    Image.fromarray((np.dstack([rgb, a]) * 255).clip(0, 255).astype(np.uint8), 'RGBA').save(f'{out}/{name}', quality=88, method=6)

save_rgba('body.webp', body_rgb, body_a)
save_rgba('hair-back.webp', hb_rgb, bh)
save_rgba('hair-front.webp', hf_rgb, fh)
Image.fromarray((bg * 255).astype(np.uint8)).save(f'{out}/bg.webp', quality=85, method=6)

# Rig: eye boxes (for blinks), skin colour under each eye, mouth box, all in uv (0..1, y down).
eyes_a = np.clip(C['eyewhite'][..., 3] + C['irides'][..., 3] + C['eyelash'][..., 3], 0, 1)
n, lab, stats, _ = cv2.connectedComponentsWithStats((eyes_a > 0.3).astype(np.uint8))
boxes = sorted([s for s in stats[1:] if s[4] > 30], key=lambda s: -s[4])[:2]
rig = {'eyes': [], 'size': [W, H]}
for x, y, bw, bh_, _ in sorted(boxes, key=lambda s: s[0]):
    band = art[y + bh_ + 2: y + bh_ + 2 + max(4, bh_ // 2), x + bw // 4: x + 3 * bw // 4].reshape(-1, 3)
    rig['eyes'].append({'c': [(x + bw / 2) / W, (y + bh_ / 2) / H], 'h': [bw / 2 / W * 1.15, bh_ / 2 / H * 1.25], 'skin': np.median(band, 0).round(3).tolist()})
ys, xs = np.nonzero(C['mouth'][..., 3] > 0.3)
rig['mouth'] = {'c': [xs.mean() / W, ys.mean() / H], 'h': [(np.ptp(xs) / 2 + 3) / W, (np.ptp(ys) / 2 + 3) / H]}
fy = np.nonzero(fh > 0.3)[0]
rig['hair'] = {'top': float(fy.min() / H), 'bottom': float(np.nonzero(bh > 0.3)[0].max() / H)}
json.dump(rig, open(f'{out}/rig.json', 'w'), indent=1)

# masks.png: R = eyes, G = mouth, B = cape that may flutter (the lower cape, outside the skirt).
yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
eye_m = cv2.GaussianBlur(cv2.dilate((eyes_a > 0.2).astype(np.float32), np.ones((7, 7))), (0, 0), 2)
mouth_m = cv2.GaussianBlur(cv2.dilate((C['mouth'][..., 3] > 0.2).astype(np.float32), np.ones((7, 7))), (0, 0), 2)
cape = C['topwear'][..., 3] * np.clip((yy - 0.42) / 0.3, 0, 1) * np.clip((np.abs(xx - 0.5) - 0.12) / 0.1, 0, 1)
Image.fromarray((np.dstack([eye_m, mouth_m, cape]) * 255).clip(0, 255).astype(np.uint8)).save(f'{out}/masks.png', optimize=True)
print(json.dumps(rig))
