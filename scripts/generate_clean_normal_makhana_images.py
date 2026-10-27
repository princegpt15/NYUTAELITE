import os
from PIL import Image, ImageDraw, ImageFilter

F250_PATH = r"C:/Users/princ/.gemini/antigravity/brain/db010721-1ffe-4efd-a4d8-f416a1ced94e/.user_uploaded/media_1792595600634_0d5f76f4.jpg"
F200_PATH = r"C:/Users/princ/.gemini/antigravity/brain/db010721-1ffe-4efd-a4d8-f416a1ced94e/.user_uploaded/media_1792595602186_0f43094a.jpg"
F100_PATH = r"C:/Users/princ/.gemini/antigravity/brain/db010721-1ffe-4efd-a4d8-f416a1ced94e/.user_uploaded/media_1792595603897_4cff6996.jpg"

CANVAS_W = 600
CANVAS_H = 750
TARGET_POUCH_H = 670
TOP_MARGIN = 28

configs = [
    {
        "label": "250g",
        "src": F250_PATH,
        "filename": "normal-makhana-250g.png",
        "bbox": (10, 5, 779, 1024),
    },
    {
        "label": "200g",
        "src": F200_PATH,
        "filename": "normal-makhana-200g.png",
        "bbox": (26, 5, 768, 1020),
    },
    {
        "label": "100g",
        "src": F100_PATH,
        "filename": "normal-makhana-100g.png",
        "bbox": (136, 5, 880, 955),
    },
]

def main():
    print("Generating clean Normal Makhana product images...")

    for cfg in configs:
        label = cfg["label"]
        src_path = cfg["src"]
        filename = cfg["filename"]
        bbox = cfg["bbox"]

        src = Image.open(src_path).convert("RGB")
        pouch = src.crop(bbox)

        # Scale pouch to uniform TARGET_POUCH_H
        orig_w, orig_h = pouch.size
        scale = TARGET_POUCH_H / orig_h
        new_w = int(orig_w * scale)
        new_h = TARGET_POUCH_H
        scaled_pouch = pouch.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Tone white background toward #FAF7EF (250, 247, 239)
        r_factor = 250.0 / 255.0
        g_factor = 247.0 / 255.0
        b_factor = 239.0 / 255.0

        r, g, b = scaled_pouch.split()
        r = r.point(lambda p: int(p * r_factor))
        g = g.point(lambda p: int(p * g_factor))
        b = b.point(lambda p: int(p * b_factor))
        toned_pouch = Image.merge("RGB", (r, g, b)).convert("RGBA")

        # Create smooth feathered alpha mask for the outer boundary of toned_pouch
        # so it blends 100% seamlessly into the canvas
        pouch_mask = Image.new("L", (new_w, new_h), 255)
        draw_m = ImageDraw.Draw(pouch_mask)
        # 4px inset rectangle with soft edge
        draw_m.rectangle([0, 0, new_w - 1, new_h - 1], outline=0, width=3)
        pouch_mask = pouch_mask.filter(ImageFilter.GaussianBlur(2.0))
        toned_pouch.putalpha(pouch_mask)

        # Position centered on canvas
        pos_x = (CANVAS_W - new_w) // 2
        pos_y = TOP_MARGIN

        # Canvas with exact #FAF7EF background
        canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (250, 247, 239, 255))

        # Grounding shadow
        base_cx = pos_x + new_w // 2
        base_cy = pos_y + new_h - 2

        shadow_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        draw_s = ImageDraw.Draw(shadow_layer)
        draw_s.ellipse(
            [
                (base_cx - int(new_w * 0.44), base_cy - 8),
                (base_cx + int(new_w * 0.44), base_cy + 12),
            ],
            fill=(30, 35, 25, 55),
        )
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(12))

        tight_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        draw_t = ImageDraw.Draw(tight_layer)
        draw_t.ellipse(
            [
                (base_cx - int(new_w * 0.38), base_cy - 4),
                (base_cx + int(new_w * 0.38), base_cy + 4),
            ],
            fill=(15, 20, 15, 95),
        )
        tight_layer = tight_layer.filter(ImageFilter.GaussianBlur(4))

        canvas = Image.alpha_composite(canvas, shadow_layer)
        canvas = Image.alpha_composite(canvas, tight_layer)
        canvas.paste(toned_pouch, (pos_x, pos_y), toned_pouch)

        # Save to public and assets
        for dest_dir in ["public/images/products", "src/assets/images"]:
            os.makedirs(dest_dir, exist_ok=True)
            out_path = os.path.join(dest_dir, filename)
            canvas.convert("RGB").save(out_path, "PNG", optimize=True)
            print(f"Saved {out_path}: pouch {new_w}x{new_h} at ({pos_x}, {pos_y})")

    print("All 3 Normal Makhana product images successfully generated!")

if __name__ == "__main__":
    main()
