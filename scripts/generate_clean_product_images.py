import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

SRC_PATH = r"C:/Users/princ/.gemini/antigravity/brain/db010721-1ffe-4efd-a4d8-f416a1ced94e/.user_uploaded/media_1792575738063_c1950c3f.jpg"
MACRO_PATH = r"src/assets/images/brand/makhana-macro.png"

CANVAS_W = 600
CANVAS_H = 750
TARGET_POUCH_H = 670  # Fills 89.3% of the canvas height cleanly and boldly!
TOP_MARGIN = 28       # Elegant minimal top margin

configs = {
    "250g": {
        "name": "premium-makhana-250g.png",
        "poly": [
            (84, 136),
            (200, 124),
            (245, 124),
            (362, 136),
            (364, 560),
            (225, 568),
            (86, 560),
        ],
        "bbox": (82, 122, 366, 570),
        "win": {"center": (224, 375), "rx": 58, "ry": 44},
    },
    "200g": {
        "name": "premium-makhana-200g.png",
        "poly": [
            (395, 200),
            (515, 188),
            (555, 188),
            (674, 200),
            (673, 572),
            (535, 578),
            (397, 572),
        ],
        "bbox": (393, 186, 676, 580),
        "win": {"center": (535, 390), "rx": 52, "ry": 40},
    },
    "100g": {
        "name": "premium-makhana-100g.png",
        "poly": [
            (703, 234),
            (800, 222),
            (845, 222),
            (949, 234),
            (947, 578),
            (825, 584),
            (705, 578),
        ],
        "bbox": (701, 220, 951, 586),
        "win": {"center": (825, 405), "rx": 46, "ry": 35},
    },
}

def main():
    print("Loading source images...")
    src = Image.open(SRC_PATH).convert("RGBA")
    macro = Image.open(MACRO_PATH).convert("RGBA")

    for k, cfg in configs.items():
        poly = cfg["poly"]
        bbox = cfg["bbox"]
        win = cfg["win"]

        # 1. High precision anti-aliased mask
        mask = Image.new("L", (src.width * 2, src.height * 2), 0)
        draw = ImageDraw.Draw(mask)
        scaled_poly = [(p[0] * 2, p[1] * 2) for p in poly]
        draw.polygon(scaled_poly, fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(1.8))
        mask = mask.resize(src.size, Image.Resampling.LANCZOS)

        pouch = Image.new("RGBA", src.size, (0, 0, 0, 0))
        pouch.paste(src, (0, 0), mask)
        pouch_crop = pouch.crop(bbox)

        # 2. Realistic white makhana filling inside the transparent die-cut window
        win_cx = win["center"][0] - bbox[0]
        win_cy = win["center"][1] - bbox[1]
        rx, ry = win["rx"], win["ry"]

        macro_sample = macro.crop((650, 150, 1150, 650)).resize(
            (rx * 2, ry * 2), Image.Resampling.LANCZOS
        )
        enhancer = ImageEnhance.Contrast(macro_sample)
        macro_sample = enhancer.enhance(1.18)
        brightener = ImageEnhance.Brightness(macro_sample)
        macro_sample = brightener.enhance(1.08)

        win_mask = Image.new("L", (rx * 4, ry * 4), 0)
        draw_win = ImageDraw.Draw(win_mask)
        draw_win.ellipse((0, 0, rx * 4 - 1, ry * 4 - 1), fill=255)
        win_mask = win_mask.filter(ImageFilter.GaussianBlur(3.0))
        win_mask = win_mask.resize((rx * 2, ry * 2), Image.Resampling.LANCZOS)

        pouch_crop.paste(macro_sample, (win_cx - rx, win_cy - ry), win_mask)

        # 3. Scale pouch to uniform TARGET_POUCH_H
        orig_w, orig_h = pouch_crop.size
        scale = TARGET_POUCH_H / orig_h
        new_w = int(orig_w * scale)
        new_h = TARGET_POUCH_H
        scaled_pouch = pouch_crop.resize((new_w, new_h), Image.Resampling.LANCZOS)

        pos_x = (CANVAS_W - new_w) // 2
        pos_y = TOP_MARGIN

        # 4. Create canvas with exact #FAF7EF background
        canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (250, 247, 239, 255))

        # Soft realistic ground contact shadow
        base_cx = pos_x + new_w // 2
        base_cy = pos_y + new_h - 4

        shadow_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        draw_s = ImageDraw.Draw(shadow_layer)
        draw_s.ellipse(
            [
                (base_cx - int(new_w * 0.44), base_cy - 8),
                (base_cx + int(new_w * 0.44), base_cy + 12),
            ],
            fill=(30, 35, 25, 60),
        )
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(12))

        tight_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        draw_t = ImageDraw.Draw(tight_layer)
        draw_t.ellipse(
            [
                (base_cx - int(new_w * 0.38), base_cy - 4),
                (base_cx + int(new_w * 0.38), base_cy + 4),
            ],
            fill=(15, 20, 15, 110),
        )
        tight_layer = tight_layer.filter(ImageFilter.GaussianBlur(4))

        canvas = Image.alpha_composite(canvas, shadow_layer)
        canvas = Image.alpha_composite(canvas, tight_layer)
        canvas.paste(scaled_pouch, (pos_x, pos_y), scaled_pouch)

        # Save to both destinations
        filename = cfg["name"]
        for dest_dir in ["public/images/products", "src/assets/images"]:
            os.makedirs(dest_dir, exist_ok=True)
            out_path = os.path.join(dest_dir, filename)
            canvas.convert("RGB").save(out_path, "PNG", optimize=True)
            print(f"Saved {out_path}: pouch {new_w}x{new_h} at ({pos_x}, {pos_y})")

    print("All 3 normalized images generated successfully!")

if __name__ == "__main__":
    main()
