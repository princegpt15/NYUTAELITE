import os
import urllib.request
import io
from PIL import Image

ASSETS = [
    {
        'id': 'process-01-harvest',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Euryale_ferox_kz06.jpg',
        'dest_webp': 'public/images/process/01-harvest-pond.webp',
        'dest_jpg': 'public/images/process/01-harvest-pond.jpg',
        'max_dim': (1200, 800),
        'title': 'Euryale ferox pond harvest',
        'author': 'Krzysztof Ziarnek, Kenraiz',
        'license': 'CC BY-SA 4.0'
    },
    {
        'id': 'process-02-grading',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Foxnut_Makhana_-_Nawada_District_-_Bihar_-_1.jpg',
        'dest_webp': 'public/images/process/02-hand-sorting.webp',
        'dest_jpg': 'public/images/process/02-hand-sorting.jpg',
        'max_dim': (1200, 900),
        'title': 'Traditional Makhana Roasting & Grading in Bihar',
        'author': 'Subhashish Panigrahi',
        'license': 'CC BY-SA 4.0'
    },
    {
        'id': 'process-03-packing',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Unique_Present_Packaging_%28Unsplash%29.jpg',
        'dest_webp': 'public/images/process/03-clean-packing.webp',
        'dest_jpg': 'public/images/process/03-clean-packing.jpg',
        'max_dim': (1200, 850),
        'title': 'Artisanal Hygienic Food Packaging',
        'author': 'Unsplash Archive',
        'license': 'CC0'
    },
    {
        'id': 'process-04-delivery',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/2/24/A_Courier_Delivering_a_Parcel.jpg',
        'dest_webp': 'public/images/process/04-express-delivery.webp',
        'dest_jpg': 'public/images/process/04-express-delivery.jpg',
        'max_dim': (1200, 800),
        'title': 'Courier Delivering a Delivery Parcel',
        'author': 'Ivan Radic',
        'license': 'CC BY 2.0'
    },
    {
        'id': 'lifestyle-morning',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Lancaster%2C_United_States_%28Unsplash%29.jpg',
        'dest_webp': 'public/images/lifestyle/morning-mindful-snack.webp',
        'dest_jpg': 'public/images/lifestyle/morning-mindful-snack.jpg',
        'max_dim': (1000, 800),
        'title': 'Morning Healthy Breakfast Bowl',
        'author': 'Unsplash Archive',
        'license': 'CC0'
    },
    {
        'id': 'lifestyle-work',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Laptop_and_a_mug_%28Unsplash%29.jpg',
        'dest_webp': 'public/images/lifestyle/work-break-snack.webp',
        'dest_jpg': 'public/images/lifestyle/work-break-snack.jpg',
        'max_dim': (1000, 800),
        'title': 'Work Break Desktop Setup with Snack Mug',
        'author': 'Unsplash Archive',
        'license': 'CC0'
    },
    {
        'id': 'lifestyle-evening',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Masala_Chai.JPG',
        'dest_webp': 'public/images/lifestyle/evening-chai-snack.webp',
        'dest_jpg': 'public/images/lifestyle/evening-chai-snack.jpg',
        'max_dim': (1000, 750),
        'title': 'Evening Traditional Masala Chai with Savory Snacks',
        'author': 'Public Domain',
        'license': 'Public domain'
    },
    {
        'id': 'quality-premium',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/1/17/White_euryale_ferox.jpg',
        'dest_webp': 'public/images/quality/premium-jumbo-makhana.webp',
        'dest_jpg': 'public/images/quality/premium-jumbo-makhana.jpg',
        'max_dim': (1200, 900),
        'title': 'Jumbo Spotless White Euryale Ferox Kernels',
        'author': 'Wikimedia Commons',
        'license': 'CC0'
    },
    {
        'id': 'quality-normal',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Euryale_ferox_grains_%281%29.jpg',
        'dest_webp': 'public/images/quality/normal-everyday-makhana.webp',
        'dest_jpg': 'public/images/quality/normal-everyday-makhana.jpg',
        'max_dim': (1200, 900),
        'title': 'Everyday Euryale Ferox Makhana Grains',
        'author': 'Wikimedia Commons',
        'license': 'CC0'
    },
    {
        'id': 'why-makhana-bowl',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Foxnut_Makhana_-_Nawada_District_-_Bihar_-_1.jpg',
        'dest_webp': 'public/images/why-makhana/superfood-roasted-bowl.webp',
        'dest_jpg': 'public/images/why-makhana/superfood-roasted-bowl.jpg',
        'max_dim': (1200, 900),
        'title': 'Authentic Bihar Roasted Makhana Superfood Snack',
        'author': 'Subhashish Panigrahi',
        'license': 'CC BY-SA 4.0'
    }
]

headers = {'User-Agent': 'NyutaEliteBot/1.0 (contact@nutyaelite.com)'}

for item in ASSETS:
    print(f"Downloading {item['id']}...")
    try:
        os.makedirs(os.path.dirname(item['dest_webp']), exist_ok=True)
        req = urllib.request.Request(item['url'], headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        
        im = Image.open(io.BytesIO(data))
        if im.mode in ('RGBA', 'P'):
            im = im.convert('RGB')
        
        im.thumbnail(item['max_dim'], Image.Resampling.LANCZOS)
        
        # Save WebP
        im.save(item['dest_webp'], 'WEBP', quality=85)
        # Save JPG fallback
        im.save(item['dest_jpg'], 'JPEG', quality=85)
        
        size_kb = os.path.getsize(item['dest_webp']) / 1024
        print(f"  [OK] Saved {item['dest_webp']} ({im.size[0]}x{im.size[1]}, {size_kb:.1f} KB)")
    except Exception as e:
        print(f"  [ERR] Failed {item['id']}: {e}")
