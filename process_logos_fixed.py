#!/usr/bin/env python3
"""
Fixed logo processing for ORIZON:
- Proper color conversion orange → purple
- Keep black hole and text intact
- Only convert the orange/yellow accretion disk colors
"""

from PIL import Image
import os

# Color definitions
ORANGE_BASE = (255, 149, 0)      # #FF9500
PURPLE_TARGET = (106, 0, 255)    # #6A00FF
BLUE_BASE = (0, 212, 255)        # #00D4FF

SOURCE_DIR = "/home/diegocc/OrizonQA/mocks/Orizon"
OUTPUT_DIR = "/home/diegocc/OrizonQA/public/logos"

def is_orange_tone(r, g, b, tolerance=80):
    """Check if pixel is orange/yellow tone (warm colors)"""
    # Orange/yellow: high R, medium-high G, low B
    return (r > 150 and g > 50 and b < 150 and
            r > g and g > b)

def convert_orange_to_purple(img):
    """Convert orange/yellow tones to purple while preserving blues and blacks"""
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            # Skip transparent pixels
            if a < 10:
                continue

            # Skip very dark pixels (black hole center, shadows)
            if r < 30 and g < 30 and b < 30:
                continue

            # Skip very light pixels (white/light gray for text)
            if r > 200 and g > 200 and b > 200:
                continue

            # Skip blue tones
            if b > r and b > g:
                continue

            # Convert orange/yellow tones to purple
            if is_orange_tone(r, g, b):
                # Map brightness from orange to purple
                brightness = (r + g + b) / 3
                intensity = brightness / 255.0

                new_r = int(PURPLE_TARGET[0] * intensity)
                new_g = int(PURPLE_TARGET[1] * intensity)
                new_b = int(PURPLE_TARGET[2] * intensity)

                pixels[x, y] = (new_r, new_g, new_b, a)

    return img

def remove_bg_smart(img, bg_threshold=240):
    """Remove backgrounds while keeping logo content"""
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            # Make very light backgrounds transparent
            if r > bg_threshold and g > bg_threshold and b > bg_threshold:
                pixels[x, y] = (255, 255, 255, 0)
            # Make very dark backgrounds transparent (but keep the black hole glow)
            elif r < 15 and g < 15 and b < 15:
                pixels[x, y] = (0, 0, 0, 0)

    return img

def process_logo(source_file, output_name, convert_to_purple=False, remove_bg=True):
    """Process a single logo file"""
    source_path = os.path.join(SOURCE_DIR, source_file)
    output_path = os.path.join(OUTPUT_DIR, output_name)

    print(f"Processing: {source_file}")
    print(f"  → {output_name}")

    img = Image.open(source_path)

    if remove_bg:
        img = remove_bg_smart(img)

    if convert_to_purple:
        img = convert_orange_to_purple(img)

    img.save(output_path, "PNG")
    print(f"  ✓ Saved ({img.size[0]}x{img.size[1]})")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 70)
    print("ORIZON Logo Processing - FIXED")
    print("=" * 70)

    # Process blue logos
    print("\n📘 Blue Logos:")
    process_logo("ChatGPT Image Nov 28, 2025, 11_04_27 PM.png",
                 "gargantua-blue-dark.png", False, True)
    process_logo("ChatGPT Image Nov 28, 2025, 11_08_48 PM.png",
                 "gargantua-blue-light.png", False, True)
    process_logo("ChatGPT Image Nov 28, 2025, 11_04_38 PM.png",
                 "orizon-full-blue-dark.png", False, True)
    process_logo("ChatGPT Image Nov 28, 2025, 11_28_56 PM.png",
                 "orizon-full-blue-light.png", False, True)

    # Process orange → purple logos
    print("\n💜 Purple Logos (Orange → Purple conversion):")
    process_logo("ChatGPT Image Nov 28, 2025, 11_04_30 PM.png",
                 "gargantua-purple-dark.png", True, True)
    process_logo("ChatGPT Image Nov 28, 2025, 11_11_07 PM.png",
                 "gargantua-purple-light.png", True, True)
    process_logo("ChatGPT Image Nov 28, 2025, 11_12_54 PM.png",
                 "orizon-full-purple-dark.png", True, True)

    print("\n" + "=" * 70)
    print("✅ Processing complete!")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 70)

if __name__ == "__main__":
    main()
