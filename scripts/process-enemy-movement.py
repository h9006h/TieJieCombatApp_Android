from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
REFERENCE_DIR = ROOT / "docs/references/enemy-movement"
NORMALIZED_DIR = ROOT / "src-web/assets/fighter/normalized"
SHADOW_DIR = NORMALIZED_DIR / "shadows"

FRAME_SIZE = 384
BASELINE_Y = 344
CELL_INSET = 18

TARGET_HEIGHTS = {
    "spinner": 184,
    "grappler": 191,
    "axe": 187,
    "suit": 185,
    "breaker": 174,
    "whip": 180,
}

BASE_SHEETS = {
    "spinner": ("enemy-spinner-strip-padded.webp", 4),
    "grappler": ("enemy-grappler-strip-padded.webp", 5),
    "axe": ("enemy-axe-strip-padded.webp", 5),
    "suit": ("enemy-suit-strip-padded-v6.webp", 5),
    "breaker": ("enemy-breaker-strip-padded.webp", 5),
    "whip": ("enemy-whip-strip-padded.webp", 5),
}

# Each entry is (master name, grid cells in playback order). Two characters can
# share a 2x2 generation master, but every final frame is independently normalized.
MOVEMENT_SOURCES = {
    "spinner": ("spinner-grappler-2x2-master-v1.png", ((0, 0), (0, 1))),
    "grappler": ("spinner-grappler-2x2-master-v1.png", ((1, 0), (1, 1))),
    "axe": ("axe-suit-2x2-master-v1.png", ((0, 0), (0, 1))),
    "suit": ("suit-hands-in-pockets-2x2-master-v1.png", ((0, 0), (0, 1), (1, 0))),
    "breaker": ("breaker-whip-2x2-master-v1.png", ((0, 0), (0, 1))),
    "whip": ("suit-whip-corrected-2x2-master-v1.png", ((1, 0), (1, 1))),
}


def keep_largest_component(image: Image.Image) -> Image.Image:
    width, height = image.size
    alpha = image.getchannel("A")
    values = alpha.get_flattened_data() if hasattr(alpha, "get_flattened_data") else alpha.getdata()
    occupied = bytearray(1 if value else 0 for value in values)
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


def chroma_alpha(cell: Image.Image) -> Image.Image:
    rgba = cell.convert("RGBA")
    output = []
    source = rgba.get_flattened_data() if hasattr(rgba, "get_flattened_data") else rgba.getdata()
    for red, green, blue, _ in source:
        is_green = (
            green > 48
            and green - red > 20
            and green - blue > 17
            and green > red * 1.2
            and green > blue * 1.28
        )
        if is_green:
            output.append((0, 0, 0, 0))
            continue
        if green > max(red, blue) + 5:
            green = max(red, blue) + 5
        output.append((red, green, blue, 255))
    rgba.putdata(output)
    return keep_largest_component(rgba)


def crop_grid_cell(master: Image.Image, row: int, column: int) -> Image.Image:
    half_w, half_h = master.width // 2, master.height // 2
    left = column * half_w + CELL_INSET
    top = row * half_h + CELL_INSET
    right = (column + 1) * half_w - CELL_INSET
    bottom = (row + 1) * half_h - CELL_INSET
    return master.crop((left, top, right, bottom))


def normalize_frame(cell: Image.Image, target_height: int) -> Image.Image:
    bbox = cell.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError("Generated movement cell contains no visible character")
    character = cell.crop(bbox)
    scale = target_height / character.height
    target_width = round(character.width * scale)
    character = character.resize((target_width, target_height), Image.Resampling.LANCZOS)
    if target_width > FRAME_SIZE - 32:
        raise RuntimeError(f"Character exceeds horizontal safe area: {target_width}px")

    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    x = round((FRAME_SIZE - target_width) / 2)
    frame.alpha_composite(character, (x, BASELINE_Y - target_height))
    return frame


def make_shadow(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("Cannot create shadow for an empty movement frame")
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


def base_frame(enemy_type: str) -> Image.Image:
    file_name, count = BASE_SHEETS[enemy_type]
    image = Image.open(NORMALIZED_DIR / file_name).convert("RGBA")
    return image.crop((0, 0, image.width // count, FRAME_SIZE))


def build_generated_movement() -> dict[str, list[Image.Image]]:
    result = {}
    for enemy_type, (master_name, cells) in MOVEMENT_SOURCES.items():
        master = Image.open(REFERENCE_DIR / master_name)
        frames = [
            normalize_frame(chroma_alpha(crop_grid_cell(master, row, column)), TARGET_HEIGHTS[enemy_type])
            for row, column in cells
        ]
        result[enemy_type] = frames
        count = len(frames)
        save_strip(frames, NORMALIZED_DIR / f"enemy-{enemy_type}-move-{count}-strip-v1.webp")
        save_strip([make_shadow(frame) for frame in frames], SHADOW_DIR / f"enemy-{enemy_type}-move-{count}-strip-v1.webp")
    return result


def build_barbarian_two_frame_strip() -> None:
    sources = (
        (REFERENCE_DIR / "barbarian-sprint-4-source-v1.webp", NORMALIZED_DIR),
        (REFERENCE_DIR / "barbarian-sprint-4-shadow-source-v1.webp", SHADOW_DIR),
    )
    for source_path, directory in sources:
        source = Image.open(source_path).convert("RGBA")
        frames = [source.crop((index * FRAME_SIZE, 0, (index + 1) * FRAME_SIZE, FRAME_SIZE)) for index in (0, 1)]
        save_strip(frames, directory / "enemy-barbarian-sprint-2-strip-v2.webp")


def save_comparison(movement: dict[str, list[Image.Image]]) -> None:
    enemy_types = list(MOVEMENT_SOURCES)
    max_frames = max(len(frames) for frames in movement.values())
    comparison = Image.new("RGBA", (FRAME_SIZE * (max_frames + 1), FRAME_SIZE * len(enemy_types)), (31, 34, 35, 255))
    for row, enemy_type in enumerate(enemy_types):
        comparison.alpha_composite(base_frame(enemy_type), (0, row * FRAME_SIZE))
        for column, frame in enumerate(movement[enemy_type], 1):
            comparison.alpha_composite(frame, (FRAME_SIZE * column, row * FRAME_SIZE))
    comparison.convert("RGB").save(REFERENCE_DIR / "enemy-movement-color-comparison-v1.jpg", "JPEG", quality=88)


def validate_character_strip(path: Path, frame_count: int) -> None:
    image = Image.open(path).convert("RGBA")
    if image.size != (FRAME_SIZE * frame_count, FRAME_SIZE):
        raise RuntimeError(f"Invalid movement dimensions: {path} {image.size}")
    masks = []
    boxes = []
    visible_green = []
    for index in range(frame_count):
        frame = image.crop((index * FRAME_SIZE, 0, (index + 1) * FRAME_SIZE, FRAME_SIZE))
        alpha = frame.getchannel("A")
        bbox = alpha.getbbox()
        if not bbox or bbox[0] < 16 or bbox[1] < 16 or FRAME_SIZE - bbox[2] < 16 or FRAME_SIZE - bbox[3] < 16:
            raise RuntimeError(f"Unsafe movement frame bounds: {path} frame={index} bbox={bbox}")
        if abs(bbox[3] - BASELINE_Y) > 4:
            raise RuntimeError(f"Movement baseline mismatch: {path} frame={index} bbox={bbox}")
        pixels = frame.get_flattened_data() if hasattr(frame, "get_flattened_data") else frame.getdata()
        green_count = sum(
            1 for red, green, blue, alpha_value in pixels
            if alpha_value > 32 and green >= 48 and green > max(red, blue) + 20
        )
        if green_count:
            raise RuntimeError(f"Visible chroma spill: {path} frame={index} pixels={green_count}")
        alpha_values = alpha.get_flattened_data() if hasattr(alpha, "get_flattened_data") else alpha.getdata()
        masks.append({pixel for pixel, value in enumerate(alpha_values) if value > 32})
        boxes.append(bbox)
        visible_green.append(green_count)

    pair_ious = []
    for first in range(frame_count):
        for second in range(first + 1, frame_count):
            union = masks[first] | masks[second]
            pair_ious.append(round(len(masks[first] & masks[second]) / len(union), 3))
    if pair_ious and max(pair_ious) >= 0.85:
        raise RuntimeError(f"Movement frames are too similar: {path} IoU={pair_ious}")
    print(f"QA {path.relative_to(ROOT)} boxes={boxes} IoU={pair_ious} green={visible_green}")


def main() -> None:
    movement = build_generated_movement()
    build_barbarian_two_frame_strip()
    save_comparison(movement)

    expected = [
        NORMALIZED_DIR / f"enemy-{enemy_type}-move-{len(cells)}-strip-v1.webp"
        for enemy_type, (_, cells) in MOVEMENT_SOURCES.items()
    ]
    expected += [SHADOW_DIR / path.name for path in expected]
    expected += [
        NORMALIZED_DIR / "enemy-barbarian-sprint-2-strip-v2.webp",
        SHADOW_DIR / "enemy-barbarian-sprint-2-strip-v2.webp",
    ]
    for path in expected:
        image = Image.open(path)
        expected_frames = 2 if "barbarian" in path.name else 3 if "suit" in path.name else 2
        if image.size != (FRAME_SIZE * expected_frames, FRAME_SIZE) or image.mode != "RGBA":
            raise RuntimeError(f"Invalid movement output: {path} {image.mode} {image.size}")
        print(path.relative_to(ROOT))
        if path.parent == NORMALIZED_DIR:
            validate_character_strip(path, expected_frames)


if __name__ == "__main__":
    main()
