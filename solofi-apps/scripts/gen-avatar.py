"""Generate SoloFi CFO agent avatar — 440x440, square corners, sharp.
Run: python scripts/gen-avatar.py
"""
from PIL import Image, ImageDraw, ImageFont

SIZE = 440
img = Image.new("RGB", (SIZE, SIZE), "#0B1220")
draw = ImageDraw.Draw(img)

# Subtle gradient background (navy -> deep blue), square corners (no rounding)
top = (11, 18, 32)
bottom = (18, 32, 58)
for y in range(SIZE):
    t = y / SIZE
    r = int(top[0] + (bottom[0] - top[0]) * t)
    g = int(top[1] + (bottom[1] - top[1]) * t)
    b = int(top[2] + (bottom[2] - top[2]) * t)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b))

gold = (212, 175, 55)
gold_dim = (150, 120, 40)

# Outer ring (coin motif)
margin = 46
draw.ellipse([margin, margin, SIZE - margin, SIZE - margin], outline=gold, width=8)
draw.ellipse([margin + 16, margin + 16, SIZE - margin - 16, SIZE - margin - 16], outline=gold_dim, width=3)

# Rising cashflow bars inside the coin (kept well within the ring radius)
bar_w = 26
gap = 14
base_y = 260
bars = [55, 90, 125, 95, 150]
total_w = len(bars) * bar_w + (len(bars) - 1) * gap
start_x = (SIZE - total_w) / 2
x = start_x
for h in bars:
    draw.rectangle([x, base_y - h, x + bar_w, base_y], fill=gold)
    x += bar_w + gap

# "SFC" monogram text below bars
try:
    font = ImageFont.truetype("arialbd.ttf", 50)
except Exception:
    font = ImageFont.load_default()

text = "SFC"
bbox = draw.textbbox((0, 0), text, font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text(((SIZE - tw) / 2, 300 - bbox[1]), text, fill=(245, 245, 245), font=font)

# Ensure perfectly square corners (no alpha/rounding) — save as flat RGB PNG
img = img.convert("RGB")
img.save("assets/solofi-avatar.png", "PNG")
print("saved assets/solofi-avatar.png", img.size, img.mode)
