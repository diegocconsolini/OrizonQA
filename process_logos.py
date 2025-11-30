#!/usr/bin/env python3
"""
Process ORIZON logo files:
1. Remove backgrounds and add transparency
2. Convert orange (#FF9500) to purple (#6A00FF)
3. Extract individual icons from multi-size reference sheets
"""

from PIL import Image
import os

# Color definitions
ORANGE_COLOR = (255, 149, 0)  # #FF9500
PURPLE_COLOR = (106, 0, 255)  # #6A00FF
BLUE_COLOR = (0, 212, 255)  # #00D4FF

SOURCE_DIR = "/home/diegocc/OrizonQA/mocks/Orizon"
OUTPUT_DIR = "/home/diegocc/OrizonQA/public/logos"

def color_distance(c1, c2):
    """Calculate color distance between two RGB colors"""
    return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5

def remove_background(img, bg_threshold=240):
    """Remove white/light backgrounds and make transparent"""
    img = img.convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        # If pixel is mostly white/light gray (background), make transparent
        if item[0] > bg_threshold and item[1] > bg_threshold and item[2] > bg_threshold:
            new_data.append((255, 255, 255, 0))
        # If pixel is mostly black (dark background), make transparent
        elif item[0] < 20 and item[1] < 20 and item[2] < 20:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    return img

def convert_orange_to_purple(img, tolerance=50):
    """Convert orange colors to purple"""
    img = img.convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        r, g, b, a = item

        # Check if pixel is close to orange
        if color_distance((r, g, b), ORANGE_COLOR) < tolerance:
            # Replace with purple, maintaining alpha
            new_data.append((*PURPLE_COLOR, a))
        else:
            new_data.append(item)

    img.putdata(new_data)
    return img

def process_single_icon(filepath, output_name, convert_to_purple=False):
    """Process a single icon file"""
    print(f"Processing {os.path.basename(filepath)} -> {output_name}")

    img = Image.open(filepath)
    img = remove_background(img)

    if convert_to_purple:
        img = convert_orange_to_purple(img)

    output_path = os.path.join(OUTPUT_DIR, output_name)
    img.save(output_path, "PNG")
    print(f"  Saved: {output_path}")

def process_reference_sheet(filepath, base_name, convert_to_purple=False):
    """Process multi-size reference sheet and extract individual icons"""
    print(f"Processing reference sheet {os.path.basename(filepath)}")

    img = Image.open(filepath)
    img = remove_background(img)

    if convert_to_purple:
        img = convert_orange_to_purple(img)

    # Reference sheets typically have icons at specific sizes
    # Common sizes: 260x512, 126x126, 36x54, 32x32, 12x6, 10x16
    # We'll extract the largest clear icon from the sheet

    # For now, save the processed sheet and extract largest icon
    width, height = img.size

    # Try to extract largest icon (usually top-left quadrant)
    # Assuming largest icon is roughly 1/3 of width, 1/2 of height
    icon_size = min(width // 3, height // 2)
    largest_icon = img.crop((0, 0, icon_size, icon_size))

    # Save the largest icon
    icon_name = f"{base_name}-icon.png"
    output_path = os.path.join(OUTPUT_DIR, icon_name)
    largest_icon.save(output_path, "PNG")
    print(f"  Extracted icon: {output_path}")

def main():
    # Create output directory if needed
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # File mapping based on timestamps and descriptions
    files_to_process = [
        # Single blue icons (dark bg)
        ("ChatGPT Image Nov 28, 2025, 11_04_27 PM.png", "gargantua-blue-dark.png", False),

        # Single orange icons (dark bg) - convert to purple
        ("ChatGPT Image Nov 28, 2025, 11_04_30 PM.png", "gargantua-purple-dark.png", True),

        # Full blue logo RIZON (dark bg)
        ("ChatGPT Image Nov 28, 2025, 11_04_38 PM.png", "orizon-full-blue-dark.png", False),

        # Blue icon (light bg)
        ("ChatGPT Image Nov 28, 2025, 11_08_48 PM.png", "gargantua-blue-light.png", False),

        # Orange icon (dark bg) - convert to purple
        ("ChatGPT Image Nov 28, 2025, 11_11_07 PM.png", "gargantua-purple-dark-alt.png", True),

        # Full orange logo RIZON (dark bg) - convert to purple
        ("ChatGPT Image Nov 28, 2025, 11_12_54 PM.png", "orizon-full-purple-dark.png", True),

        # Full blue logo RIZON (light bg)
        ("ChatGPT Image Nov 28, 2025, 11_28_56 PM.png", "orizon-full-blue-light.png", False),
    ]

    # Reference sheets to process (multi-size)
    reference_sheets = [
        # Blue icon reference sheets
        ("ChatGPT Image Nov 28, 2025, 11_20_49 PM.png", "gargantua-blue", False),

        # Orange icon reference sheets - convert to purple
        ("ChatGPT Image Nov 28, 2025, 11_21_57 PM.png", "gargantua-purple", True),
        ("ChatGPT Image Nov 28, 2025, 11_27_14 PM.png", "gargantua-purple-alt", True),
    ]

    print("=" * 60)
    print("ORIZON Logo Processing")
    print("=" * 60)

    # Process single icon files
    print("\nProcessing single icon files...")
    for filename, output_name, convert in files_to_process:
        filepath = os.path.join(SOURCE_DIR, filename)
        if os.path.exists(filepath):
            process_single_icon(filepath, output_name, convert)
        else:
            print(f"  WARNING: File not found: {filename}")

    # Process reference sheets
    print("\nProcessing reference sheets...")
    for filename, base_name, convert in reference_sheets:
        filepath = os.path.join(SOURCE_DIR, filename)
        if os.path.exists(filepath):
            process_reference_sheet(filepath, base_name, convert)
        else:
            print(f"  WARNING: File not found: {filename}")

    print("\n" + "=" * 60)
    print("Processing complete!")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
