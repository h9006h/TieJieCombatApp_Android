from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
REFERENCE_DIR = ROOT / "docs/references/enemy-run-regeneration"
NORMALIZED_DIR = ROOT / "src-web/assets/fighter/normalized"
SHADOW_DIR = NORMALIZED_DIR / "shadows"

MASTER = REFERENCE_DIR / "spinner-run-four-frame-master-v1.png"
APPROVED_FRAME_2 = REFERENCE_DIR / "spinner-run-frame-2-approved-v1.png"
OUTPUT = NORMALIZED_DIR / "enemy-spinner-move-4-strip-v2.webp"
SHADOW_OUTPUT = SHADOW_DIR / OUTPUT.name
PREVIEW = REFERENCE_DIR / "spinner-run-four-frame-normalized-preview-v2.png"

FRAME_SIZE = 384
BASELINE_Y = 344
TARGET_HEIGHT = 184
CELL_INSET = 12


def remove_checkerboard(image: Image.Image) -> Image.Image:
    """Remove the light checkerboard baked into generated preview images."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = list(rgb.getdata())
    background_like = bytearray(width * height)
    for index, (red, green, blue) in enumerate(pixels):
        brightness = (red + green + blue) / 3
        saturation = max(red, green, blue) - min(red, green, blue)
        if brightness >= 205 and saturation <= 18:
            background_like[index] = 1

    flooded = bytearray(width * height)
    visited = bytearray(width * height)
    for start in range(width * height):
        if visited[start] or not background_like[start]:
            continue
        visited[start] = 1
        queue = deque([start])
        component: list[int] = []
        touches_edge = False
        while queue:
            index = queue.popleft()
            component.append(index)
            x, y = index % width, index // width
            touches_edge = touches_edge or x == 0 or y == 0 or x == width - 1 or y == height - 1
            for neighbor in (index - 1 if x else -1, index + 1 if x + 1 < width else -1,
                             index - width if y else -1, index + width if y + 1 < height else -1):
                if neighbor >= 0 and background_like[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        if touches_edge or len(component) >= 80:
            for index in component:
                flooded[index] = 1

    output = []
    matte = 250
    for index, (red, green, blue) in enumerate(pixels):
        if not flooded[index]:
            output.append((red, green, blue, 255))
            continue
        opacity = max(0, min(255, round((matte - min(red, green, blue)) / matte * 255)))
        if opacity <= 12:
            output.append((0, 0, 0, 0))
            continue
        alpha_fraction = opacity / 255
        unmatte = tuple(max(0, min(255, round((channel - matte * (1 - alpha_fraction)) / alpha_fraction))) for channel in (red, green, blue))
        output.append((*unmatte, opacity))
    rgba = Image.new("RGBA", rgb.size)
    rgba.putdata(output)
    return keep_largest_component(rgba)


def keep_largest_component(image: Image.Image) -> Image.Image:
    width, height = image.size
    source_alpha = image.getchannel("A")
    source_values = list(source_alpha.getdata())
    occupied = bytearray(1 if value > 12 else 0 for value in source_values)
    visited = bytearray(width * height)
    largest: list[int] = []
    for start in range(width * height):
        if not occupied[start] or visited[start]:
            continue
        visited[start] = 1
        queue = deque([start])
        component: list[int] = []
        while queue:
            index = queue.popleft()
            component.append(index)
            x, y = index % width, index // width
            for ny in range(max(0, y - 1), min(height, y + 2)):
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = ny * width + nx
                    if occupied[neighbor] and not visited[neighbor]:
                        visited[neighbor] = 1
                        queue.append(neighbor)
        if len(component) > len(largest):
            largest = component
    retained = bytearray(width * height)
    for index in largest:
        retained[index] = source_values[index]
    image.putalpha(Image.frombytes("L", (width, height), bytes(retained)))
    image.putdata([(red, green, blue, alpha) if alpha else (0, 0, 0, 0) for red, green, blue, alpha in image.getdata()])
    return image


def resize_rgba(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    red, green, blue, alpha = image.split()
    resized_alpha = alpha.resize(size, Image.Resampling.LANCZOS)
    premultiplied = [ImageChops.multiply(channel, alpha).resize(size, Image.Resampling.LANCZOS) for channel in (red, green, blue)]
    alpha_values = list(resized_alpha.getdata())
    channel_values = [list(channel.getdata()) for channel in premultiplied]
    output = []
    for index, opacity in enumerate(alpha_values):
        if opacity <= 2:
            output.append((0, 0, 0, 0))
            continue
        output.append(tuple(min(255, round(values[index] * 255 / opacity)) for values in channel_values) + (opacity,))
    resized = Image.new("RGBA", size)
    resized.putdata(output)
    return resized


def grid_cell(master: Image.Image, row: int, column: int) -> Image.Image:
    half_width, half_height = master.width // 2, master.height // 2
    return master.crop((column * half_width + CELL_INSET, row * half_height + CELL_INSET,
                        (column + 1) * half_width - CELL_INSET, (row + 1) * half_height - CELL_INSET))


def normalize_frame(source: Image.Image) -> Image.Image:
    extracted = remove_checkerboard(source)
    bbox = extracted.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError("Spinner run frame contains no visible character")
    character = extracted.crop(bbox)
    scale = TARGET_HEIGHT / character.height
    target_width = round(character.width * scale)
    target_height = TARGET_HEIGHT
    if target_width > FRAME_SIZE - 32:
        scale = (FRAME_SIZE - 32) / character.width
        target_width = FRAME_SIZE - 32
        target_height = round(character.height * scale)
    character = resize_rgba(character, (target_width, target_height))
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    frame.alpha_composite(character, ((FRAME_SIZE - target_width) // 2, BASELINE_Y - target_height))
    return frame


def make_shadow(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A")
    bbox = alpha.getbbox()
    silhouette = alpha.crop(bbox)
    shadow_height = max(14, round(silhouette.height * 0.12))
    silhouette = silhouette.resize((silhouette.width, shadow_height), Image.Resampling.LANCZOS)
    silhouette = silhouette.filter(ImageFilter.GaussianBlur(1.4)).point(lambda value: round(value * 0.43))
    shadow = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    ink = Image.new("RGBA", silhouette.size, (8, 10, 12, 0))
    ink.putalpha(silhouette)
    shadow.alpha_composite(ink, ((FRAME_SIZE - silhouette.width) // 2 + 9, BASELINE_Y - round(shadow_height * 0.45)))
    return shadow


def save_strip(frames: list[Image.Image], path: Path) -> None:
    strip = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME_SIZE, 0))
    path.parent.mkdir(parents=True, exist_ok=True)
    strip.save(path, "WEBP", lossless=True, method=6, exact=True)


def main() -> None:
    master = Image.open(MASTER)
    sources = [grid_cell(master, 0, 0), Image.open(APPROVED_FRAME_2),
               grid_cell(master, 1, 0), grid_cell(master, 1, 1)]
    frames = [normalize_frame(source) for source in sources]
    save_strip(frames, OUTPUT)
    save_strip([make_shadow(frame) for frame in frames], SHADOW_OUTPUT)
    preview = Image.new("RGBA", (FRAME_SIZE * 4, FRAME_SIZE), (34, 36, 38, 255))
    for index, frame in enumerate(frames):
        preview.alpha_composite(frame, (index * FRAME_SIZE, 0))
    preview.save(PREVIEW)
    for path in (OUTPUT, SHADOW_OUTPUT):
        image = Image.open(path)
        if image.size != (FRAME_SIZE * 4, FRAME_SIZE) or image.mode != "RGBA":
            raise RuntimeError(f"Invalid spinner strip: {path} {image.mode} {image.size}")
    print(OUTPUT.relative_to(ROOT))
    print(SHADOW_OUTPUT.relative_to(ROOT))
    print(PREVIEW.relative_to(ROOT))


if __name__ == "__main__":
    main()
