from PIL import Image
import os

# Paths relative to project root
src_path = os.path.abspath(os.path.join('src', 'assets', 'images', 'brand-emblem.jpg'))
dst_path = os.path.abspath(os.path.join('src', 'assets', 'images', 'brand-emblem.png'))

im = Image.open(src_path).convert('RGBA')
new_data = []
for pixel in im.getdata():
    # Treat near‑white (tolerance) as transparent
    if pixel[0] > 240 and pixel[1] > 240 and pixel[2] > 240:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(pixel)
im.putdata(new_data)
# Save optimized PNG with transparency
im.save(dst_path, format='PNG', optimize=True)
print('Transparent logo saved to', dst_path)
