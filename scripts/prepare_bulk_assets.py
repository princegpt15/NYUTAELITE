import os
import urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../public/images/bulk')
os.makedirs(OUTPUT_DIR, exist_ok=True)

USER_AGENT = 'NyutaEliteBot/1.0 (contact: info@nyutaelite.com)'

def download_and_save(url, base_name, max_width=1200, max_height=900, crop_aspect=None):
    webp_path = os.path.join(OUTPUT_DIR, f"{base_name}.webp")
    jpg_path = os.path.join(OUTPUT_DIR, f"{base_name}.jpg")
    
    temp_path = os.path.join(OUTPUT_DIR, f"temp_{base_name}.jpg")
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=25) as resp:
        with open(temp_path, 'wb') as f:
            f.write(resp.read())
            
    img = Image.open(temp_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    if crop_aspect:
        target_w_ratio, target_h_ratio = crop_aspect
        current_ratio = img.width / img.height
        target_ratio = target_w_ratio / target_h_ratio
        if current_ratio > target_ratio:
            new_w = int(img.height * target_ratio)
            left = (img.width - new_w) // 2
            img = img.crop((left, 0, left + new_w, img.height))
        else:
            new_h = int(img.width / target_ratio)
            top = (img.height - new_h) // 2
            img = img.crop((0, top, img.width, top + new_h))
            
    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    img.save(webp_path, 'WEBP', quality=88)
    img.save(jpg_path, 'JPEG', quality=88)
    
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    print(f"Created {base_name}: {img.size} ({os.path.getsize(webp_path)/1024:.1f} KB WebP, {os.path.getsize(jpg_path)/1024:.1f} KB JPG)")

print("1. Downloading wholesale sacks and spiced bulk makhana from Wikimedia Commons...")
# Jute Bags (CC BY-SA 4.0 by Ei'eke)
jute_url = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Jute_Bags.jpg"
download_and_save(jute_url, "wholesale-storage-sacks", 1200, 800, (3, 2))

# Roasted Spiced Makhana (CC BY-SA 4.0 by FacetsOfNonStickPans)
spiced_url = "https://upload.wikimedia.org/wikipedia/commons/1/12/Makhana_%28Foxnut%29_roasted_with_masala_and_ghee.jpg"
download_and_save(spiced_url, "wholesale-roasted-spiced", 1000, 750, (4, 3))

print("\n2. Generating Grade Macro Visuals for 4 Sutta, 5 Sutta, 5.5 Sutta, 6 Sutta...")
# Let's open existing high-res macros and create 4 distinct 800x600 grade visuals
macro_src = Image.open(os.path.join(os.path.dirname(__file__), '../src/assets/images/brand/makhana-macro.png'))
jumbo_src = Image.open(os.path.join(os.path.dirname(__file__), '../public/images/quality/premium-jumbo-makhana.webp'))
normal_src = Image.open(os.path.join(os.path.dirname(__file__), '../public/images/quality/normal-everyday-makhana.webp'))

# 4 Sutta: Standard medium harvest pop
crop_4 = normal_src.crop((50, 80, 820, 680)).resize((800, 600), Image.Resampling.LANCZOS)
crop_4.save(os.path.join(OUTPUT_DIR, "grade-4-sutta.webp"), "WEBP", quality=88)
crop_4.save(os.path.join(OUTPUT_DIR, "grade-4-sutta.jpg"), "JPEG", quality=88)
print("Created grade-4-sutta (800x600)")

# 5 Sutta: Medium-large selected pop (800x600, 4:3)
ferox_orig_path = os.path.join(os.path.dirname(__file__), 'White_euryale_ferox_original.jpg')
if os.path.exists(ferox_orig_path):
    orig_ferox = Image.open(ferox_orig_path)
    crop_5 = orig_ferox.crop((100, 100, 2500, 1900)).resize((800, 600), Image.Resampling.LANCZOS)
    crop_55 = orig_ferox.crop((1300, 1650, 2800, 2775)).resize((800, 600), Image.Resampling.LANCZOS)
    crop_55 = ImageEnhance.Brightness(crop_55).enhance(1.05)
else:
    crop_5 = jumbo_src.crop((20, 20, 700, 530)).resize((800, 600), Image.Resampling.LANCZOS)
    crop_55 = jumbo_src.crop((150, 150, 650, 525)).resize((800, 600), Image.Resampling.LANCZOS)

crop_5.save(os.path.join(OUTPUT_DIR, "grade-5-sutta.webp"), "WEBP", quality=90)
crop_5.save(os.path.join(OUTPUT_DIR, "grade-5-sutta.jpg"), "JPEG", quality=90)
print("Created grade-5-sutta (800x600)")

# 5.5 Sutta: Large premium expanded pop (800x600, 4:3)
crop_55.save(os.path.join(OUTPUT_DIR, "grade-5-5-sutta.webp"), "WEBP", quality=90)
crop_55.save(os.path.join(OUTPUT_DIR, "grade-5-5-sutta.jpg"), "JPEG", quality=90)
print("Created grade-5-5-sutta (800x600)")

# 6 Sutta: Giant jumbo hand-sorted spotless white pop
crop_6 = jumbo_src.crop((30, 40, 860, 660)).resize((800, 600), Image.Resampling.LANCZOS)
crop_6.save(os.path.join(OUTPUT_DIR, "grade-6-sutta.webp"), "WEBP", quality=88)
crop_6.save(os.path.join(OUTPUT_DIR, "grade-6-sutta.jpg"), "JPEG", quality=88)
print("Created grade-6-sutta (800x600)")

print("\n3. Generating B2B Wholesale Hero multi-pouch arrangement...")
# Canvas: 1200 x 800 with deep forest green #123B2A, soft gold ambient lighting, and arranged NYUTA ELITE pouches
bg = Image.new('RGB', (1200, 800), color=(18, 59, 42)) # #123B2A
draw = ImageDraw.Draw(bg)

# Draw subtle warm pedestal floor in bottom 30%
for y in range(500, 800):
    progress = (y - 500) / 300.0
    r = int(18 + progress * (28 - 18))
    g = int(59 + progress * (42 - 59))
    b = int(42 + progress * (32 - 42))
    draw.line([(0, y), (1200, y)], fill=(r, g, b))

# Ambient gold glow in top center
glow = Image.new('RGBA', (1200, 800), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.ellipse([300, 100, 900, 500], fill=(198, 161, 91, 35)) # #C6A15B with alpha
glow = glow.filter(ImageFilter.GaussianBlur(radius=80))
bg.paste(glow, (0, 0), glow)

# Load authentic NYUTA ELITE pouches
prem_250 = Image.open(os.path.join(os.path.dirname(__file__), '../public/images/products/premium-makhana-250g.png')).convert('RGBA')
prem_200 = Image.open(os.path.join(os.path.dirname(__file__), '../public/images/products/premium-makhana-200g.png')).convert('RGBA')
norm_250 = Image.open(os.path.join(os.path.dirname(__file__), '../public/images/products/normal-makhana-250g.png')).convert('RGBA')
norm_200 = Image.open(os.path.join(os.path.dirname(__file__), '../public/images/products/normal-makhana-200g.png')).convert('RGBA')

# Resize pouches maintaining aspect ratio
p_prem_250 = prem_250.resize((370, 480), Image.Resampling.LANCZOS)
p_norm_250 = norm_250.resize((370, 480), Image.Resampling.LANCZOS)
p_prem_200 = prem_200.resize((310, 400), Image.Resampling.LANCZOS)
p_norm_200 = norm_200.resize((310, 400), Image.Resampling.LANCZOS)

# Create soft drop shadows under pouches
def make_shadow(w, h):
    s = Image.new('RGBA', (w + 40, 50), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(s)
    s_draw.ellipse([20, 10, w + 20, 40], fill=(0, 0, 0, 110))
    return s.filter(ImageFilter.GaussianBlur(radius=10))

# Place pouches in balanced wholesale tier layout:
# Back row: 200g pouches slightly angled
shadow_p200 = make_shadow(310, 400)
bg.paste(shadow_p200, (110, 640), shadow_p200)
bg.paste(p_norm_200, (130, 270), p_norm_200)

bg.paste(shadow_p200, (760, 640), shadow_p200)
bg.paste(p_prem_200, (760, 270), p_prem_200)

# Front row: 250g hero pouches (Silver Normal and Green Premium)
shadow_p250 = make_shadow(370, 480)
bg.paste(shadow_p250, (270, 670), shadow_p250)
bg.paste(p_norm_250, (280, 220), p_norm_250)

bg.paste(shadow_p250, (550, 670), shadow_p250)
bg.paste(p_prem_250, (560, 220), p_prem_250)

# Subtle gold divider bar at top and bottom of showcase
gold_accent = (198, 161, 91)
draw = ImageDraw.Draw(bg)
draw.rectangle([0, 0, 1200, 6], fill=gold_accent)
draw.rectangle([0, 794, 1200, 800], fill=gold_accent)

hero_webp = os.path.join(OUTPUT_DIR, "bulk-wholesale-hero.webp")
hero_jpg = os.path.join(OUTPUT_DIR, "bulk-wholesale-hero.jpg")
bg.save(hero_webp, "WEBP", quality=90)
bg.save(hero_jpg, "JPEG", quality=90)
print(f"Created bulk-wholesale-hero: 1200x800 ({os.path.getsize(hero_webp)/1024:.1f} KB WebP)")
print("\nAll bulk assets generated successfully!")
