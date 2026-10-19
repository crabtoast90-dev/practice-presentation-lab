# Seam check for a reveal clip: how far the first and last frames drift from the hero still.
# python3 -I tools/seam.py <hero.png> <clip.mp4>  -> mean absolute difference (0-255), lower is better
import subprocess, sys, tempfile, os
from PIL import Image, ImageChops, ImageStat
hero, clip = sys.argv[1], sys.argv[2]
d = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', clip, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', f'{d}/first.png'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-sseof', '-0.1', '-i', clip, '-update', '1', f'{d}/last.png'], check=True)
first, last = Image.open(f'{d}/first.png').convert('RGB'), Image.open(f'{d}/last.png').convert('RGB')
still = Image.open(hero).convert('RGB').resize(first.size, Image.LANCZOS)
diff = lambda a, b: sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3
print(f'first vs still {diff(first, still):.1f}  last vs still {diff(last, still):.1f}  last vs first {diff(last, first):.1f}')
