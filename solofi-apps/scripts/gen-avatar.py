"""Generate SoloFi CFO agent avatar — 440x440, square corners, sharp.
Robot-CFO mascot, matching OKX.AI's illustrated-character avatar style
(reference: okx.ai/agents/2023, okx.ai/agents/3345) rather than a flat
abstract icon.
Run: python scripts/gen-avatar.py
"""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SIZE = 440
SS = 4  # supersample for smooth edges/gradients
W = SIZE * SS

img = Image.new("RGB", (W, W), "#0B1220")
draw = ImageDraw.Draw(img)

navy_top = (14, 22, 40)
navy_bottom = (28, 46, 78)
gold = (212, 175, 55)
gold_light = (232, 200, 100)
gold_dim = (150, 120, 40)
white = (240, 240, 245)
dark = (18, 24, 38)

# Background vertical gradient
for y in range(W):
    t = y / W
    r = int(navy_top[0] + (navy_bottom[0] - navy_top[0]) * t)
    g = int(navy_top[1] + (navy_bottom[1] - navy_top[1]) * t)
    b = int(navy_top[2] + (navy_bottom[2] - navy_top[2]) * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Soft radial glow behind the mascot
glow = Image.new("L", (W, W), 0)
gdraw = ImageDraw.Draw(glow)
cx, cy = W / 2, W * 0.46
gdraw.ellipse([cx - W * 0.42, cy - W * 0.42, cx + W * 0.42, cy + W * 0.42], fill=90)
glow = glow.filter(ImageFilter.GaussianBlur(W * 0.06))
gold_layer = Image.new("RGB", (W, W), gold)
img = Image.composite(gold_layer, img, glow.point(lambda p: int(p * 0.35)))
draw = ImageDraw.Draw(img)

# Drop shadow under the mascot (ellipse)
shadow = Image.new("L", (W, W), 0)
sdraw = ImageDraw.Draw(shadow)
sdraw.ellipse([W * 0.28, W * 0.78, W * 0.72, W * 0.90], fill=140)
shadow = shadow.filter(ImageFilter.GaussianBlur(W * 0.02))
black_layer = Image.new("RGB", (W, W), (0, 0, 0))
img = Image.composite(black_layer, img, shadow)
draw = ImageDraw.Draw(img)

# ---- Body (suit jacket, rounded trapezoid) ----
body_top_w, body_bot_w = W * 0.30, W * 0.44
body_top_y, body_bot_y = W * 0.50, W * 0.86
cxm = W / 2
draw.polygon(
    [
        (cxm - body_top_w / 2, body_top_y),
        (cxm + body_top_w / 2, body_top_y),
        (cxm + body_bot_w / 2, body_bot_y),
        (cxm - body_bot_w / 2, body_bot_y),
    ],
    fill=dark,
)
# Lapels
draw.polygon(
    [(cxm - body_top_w / 2, body_top_y), (cxm, body_top_y + W * 0.10), (cxm - body_top_w * 0.18, body_bot_y)],
    fill=(26, 34, 52),
)
draw.polygon(
    [(cxm + body_top_w / 2, body_top_y), (cxm, body_top_y + W * 0.10), (cxm + body_top_w * 0.18, body_bot_y)],
    fill=(26, 34, 52),
)
# Gold tie
tie_w = W * 0.05
draw.polygon(
    [
        (cxm - tie_w / 2, body_top_y),
        (cxm + tie_w / 2, body_top_y),
        (cxm + tie_w * 0.7, body_top_y + W * 0.14),
        (cxm, body_bot_y * 0.86),
        (cxm - tie_w * 0.7, body_top_y + W * 0.14),
    ],
    fill=gold,
)

# ---- Head (rounded square, robot-style) ----
head_w = W * 0.40
head_h = W * 0.34
head_x0, head_y0 = cxm - head_w / 2, W * 0.18
head_x1, head_y1 = cxm + head_w / 2, W * 0.18 + head_h
radius = W * 0.07
draw.rounded_rectangle([head_x0, head_y0, head_x1, head_y1], radius=radius, fill=(232, 234, 240))
# Head shading (subtle bottom-darker band for depth)
shade = Image.new("L", (W, W), 0)
shdraw = ImageDraw.Draw(shade)
shdraw.rounded_rectangle([head_x0, head_y0 + head_h * 0.55, head_x1, head_y1], radius=radius, fill=60)
shade = shade.filter(ImageFilter.GaussianBlur(W * 0.015))
grey_layer = Image.new("RGB", (W, W), (170, 175, 190))
img.paste(Image.composite(grey_layer, img, shade))
draw = ImageDraw.Draw(img)

# Antenna
draw.line([(cxm, head_y0), (cxm, head_y0 - W * 0.05)], fill=(180, 185, 200), width=int(W * 0.012))
draw.ellipse(
    [cxm - W * 0.018, head_y0 - W * 0.07, cxm + W * 0.018, head_y0 - W * 0.07 + W * 0.036],
    fill=gold_light,
)

# Face screen (dark panel with gold uptrend line = the "CFO" chart)
panel_m = head_w * 0.14
px0, py0 = head_x0 + panel_m, head_y0 + head_h * 0.22
px1, py1 = head_x1 - panel_m, head_y0 + head_h * 0.78
draw.rounded_rectangle([px0, py0, px1, py1], radius=radius * 0.5, fill=(16, 22, 36))

# Uptrend sparkline on the screen
pts_ratio = [(0.06, 0.75), (0.28, 0.55), (0.46, 0.62), (0.66, 0.32), (0.94, 0.15)]
pts = [(px0 + rx * (px1 - px0), py0 + ry * (py1 - py0)) for rx, ry in pts_ratio]
draw.line(pts, fill=gold, width=int(W * 0.014), joint="curve")
for p in pts:
    draw.ellipse([p[0] - W * 0.01, p[1] - W * 0.01, p[0] + W * 0.01, p[1] + W * 0.01], fill=gold_light)

# ---- Arm + coin (right hand holding a gold coin) ----
coin_cx, coin_cy, coin_r = cxm + body_bot_w * 0.42, body_bot_y - W * 0.10, W * 0.075
draw.ellipse(
    [coin_cx - coin_r, coin_cy - coin_r, coin_cx + coin_r, coin_cy + coin_r],
    fill=gold_light,
    outline=gold_dim,
    width=int(W * 0.008),
)
try:
    dollar_font = ImageFont.truetype("arialbd.ttf", int(coin_r * 1.1))
except Exception:
    dollar_font = ImageFont.load_default()
d_bbox = draw.textbbox((0, 0), "$", font=dollar_font)
dw, dh = d_bbox[2] - d_bbox[0], d_bbox[3] - d_bbox[1]
draw.text((coin_cx - dw / 2 - d_bbox[0], coin_cy - dh / 2 - d_bbox[1]), "$", fill=(90, 70, 20), font=dollar_font)

# ---- Name plate at the bottom ----
try:
    font = ImageFont.truetype("arialbd.ttf", int(W * 0.052))
except Exception:
    font = ImageFont.load_default()
text = "SoloFi CFO"
bbox = draw.textbbox((0, 0), text, font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
ty = W * 0.94 - th
draw.text(((W - tw) / 2 - bbox[0], ty - bbox[1]), text, fill=white, font=font)

# Downsample for clean anti-aliased edges, square corners preserved
img = img.resize((SIZE, SIZE), Image.LANCZOS).convert("RGB")
img.save("assets/solofi-avatar.png", "PNG")
print("saved assets/solofi-avatar.png", img.size, img.mode)
