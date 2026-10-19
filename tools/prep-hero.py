# Web copies of a hero: <name>.jpg (1200 px wide) and <name>-fx.png (R = character mask,
# G = soft glow around it) for format A's rim glow and foil.
# python3 -I tools/prep-hero.py <hero.png> <mask.png> <out-dir> <name>
import sys
from PIL import Image, ImageFilter, ImageChops
src, mask, out, name = sys.argv[1:5]
img = Image.open(src).convert('RGB')
w = 1200
img.resize((w, round(img.height * w / img.width)), Image.LANCZOS).save(f'{out}/{name}.jpg', quality=86, optimize=True, progressive=True)
m = Image.open(mask).convert('L').resize((512, round(512 * img.height / img.width)), Image.LANCZOS)
glow = m.filter(ImageFilter.GaussianBlur(14))
glow = ImageChops.multiply(glow, Image.eval(m, lambda v: 255 - v)).point(lambda v: min(255, v * 3))
Image.merge('RGB', (m, glow, Image.new('L', m.size, 0))).save(f'{out}/{name}-fx.png', optimize=True)
