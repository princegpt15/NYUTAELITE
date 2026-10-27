from PIL import Image
import os, sys

src_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'images', 'brand-emblem.jpg')
 dst_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'images', 'brand-emblem.png')

im = Image.open(src_path).convert('RGBA')
 datas = im.getdata()
 newData = []
 for item in datas:
     # If pixel is near white (tolerance), make it transparent
     if item[0] > 240 and item[1] > 240 and item[2] > 240:
         newData.append((255, 255, 255, 0))
     else:
         newData.append(item)
 im.putdata(newData)
 # Optimize and save
 im.save(dst_path, 'PNG', optimize=True)
 print('Created transparent PNG at', dst_path)
