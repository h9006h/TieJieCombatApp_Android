from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
FRAME_MASTERS = tuple(
    ROOT / f"docs/references/assassin-run-frame-{index}-master-v2.png"
    for index in range(1, 3)
)
REFERENCE = ROOT / "src-web/assets/fighter/normalized/enemy-assassin-strip-padded-v2.webp"
OUTPUT = ROOT / "src-web/assets/fighter/normalized/enemy-assassin-run-2-strip-v3.webp"
SHADOW_OUTPUT = ROOT / "src-web/assets/fighter/normalized/shadows/enemy-assassin-run-2-strip-v3.webp"
COMPARISON = ROOT / "docs/references/assassin-run-color-comparison-v3.png"

FRAME_SIZE = 384
BASELINE_Y = 344
TARGET_HEIGHT = 177


def chroma_alpha(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    pixels = []
    source_pixels = rgba.get_flattened_data() if hasattr(rgba, "get_flattened_data") else rgba.getdata()
    for red, green, blue, _ in source_pixels:
        is_green = (
            green > 50
            and green - red > 22
            and green - blue > 18
            and green > red * 1.24
            and green > blue * 1.32
        )
        if is_green:
            pixels.append((0, 0, 0, 0))
            continue
        # Remove chroma spill from antialiased outline pixels. The approved
        # assassin palette has no green accents, so this cannot erase costume
        # detail and prevents bright green pinholes after WebP compression.
        if green > max(red, blue) + 5:
            green = max(red, blue) + 5
        pixels.append((red, green, blue, 255))
    rgba.putdata(pixels)
    return keep_largest_component(rgba)


def keep_largest_component(image: Image.Image) -> Image.Image:
    """Discard the generated baked shadow and isolated chroma-key fragments."""
    width, height = image.size
    alpha = image.getchannel("A")
    alpha_values = alpha.get_flattened_data() if hasattr(alpha, "get_flattened_data") else alpha.getdata()
    occupied = bytearray(1 if value else 0 for value in alpha_values)
    visited = bytearray(width * height)
    largest = []

    for start in range(width * height):
        if not occupied[start] or visited[start]:
            continue
        visited[start] = 1
        queue = deque([start])
        component = []
        while queue:
            index = queue.popleft()
            component.append(index)
            x, y = index % width, index // width
            for ny in range(max(0, y - 1), min(height, y + 2)):
                row = ny * width
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = row + nx
                    if occupied[neighbor] and not visited[neighbor]:
                        visited[neighbor] = 1
                        queue.append(neighbor)
        if len(component) > len(largest):
            largest = component

    retained = bytearray(width * height)
    for index in largest:
        retained[index] = 255
    image.putalpha(Image.frombytes("L", (width, height), bytes(retained)))
    return image


def normalize_frame(cell: Image.Image) -> Image.Image:
    bbox = cell.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError("Generated assassin cell contains no visible character")
    character = cell.crop(bbox)
    scale = TARGET_HEIGHT / character.height
    target_width = round(character.width * scale)
    character = character.resize((target_width, TARGET_HEIGHT), Image.Resampling.LANCZOS)

    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    x = round((FRAME_SIZE - target_width) / 2)
    y = BASELINE_Y - TARGET_HEIGHT
    frame.alpha_composite(character, (x, y))
    return frame


def make_shadow(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("Cannot create a shadow for an empty frame")
    silhouette = alpha.crop(bbox)
    shadow_height = max(14, round(silhouette.height * 0.12))
    silhouette = silhouette.resize((silhouette.width, shadow_height), Image.Resampling.LANCZOS)
    silhouette = silhouette.filter(ImageFilter.GaussianBlur(1.4))
    silhouette = silhouette.point(lambda value: round(value * 0.43))

    shadow = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    x = round((FRAME_SIZE - silhouette.width) / 2) + 9
    y = BASELINE_Y - round(shadow_height * 0.45)
    ink = Image.new("RGBA", silhouette.size, (8, 10, 12, 0))
    ink.putalpha(silhouette)
    shadow.alpha_composite(ink, (x, y))
    return shadow


def save_strip(frames: list[Image.Image], path: Path) -> None:
    strip = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME_SIZE, 0))
    path.parent.mkdir(parents=True, exist_ok=True)
    strip.save(path, "WEBP", quality=82, method=6, exact=True)


def save_color_comparison(new_frame: Image.Image) -> None:
    reference = Image.open(REFERENCE).convert("RGBA").crop((0, 0, FRAME_SIZE, FRAME_SIZE))
    checker = Image.new("RGBA", (FRAME_SIZE * 2, FRAME_SIZE), (31, 34, 35, 255))
    checker.alpha_composite(reference, (0, 0))
    checker.alpha_composite(new_frame, (FRAME_SIZE, 0))
    COMPARISON.parent.mkdir(parents=True, exist_ok=True)
    checker.convert("RGB").save(COMPARISON, "PNG", optimize=True)


def main() -> None:
    frames = [
        normalize_frame(chroma_alpha(Image.open(master)))
        for master in FRAME_MASTERS
    ]
    shadows = [make_shadow(frame) for frame in frames]
    save_strip(frames, OUTPUT)
    save_strip(shadows, SHADOW_OUTPUT)
    save_color_comparison(frames[0])

    for path in (OUTPUT, SHADOW_OUTPUT):
        image = Image.open(path)
        if image.size != (FRAME_SIZE * len(FRAME_MASTERS), FRAME_SIZE) or image.mode != "RGBA":
            raise RuntimeError(f"Invalid sprite output: {path} {image.mode} {image.size}")
    print(OUTPUT.relative_to(ROOT))
    print(SHADOW_OUTPUT.relative_to(ROOT))
    print(COMPARISON.relative_to(ROOT))


if __name__ == "__main__":
    main()
