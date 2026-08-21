from pathlib import Path

from PIL import Image, ImageFilter


FRAME_SIZE = 384
FRAME_COUNT = 14
BASELINE_Y = 344
SHADOW_COLOR = (8, 10, 12, 0)
SOURCE = Path("src-web/assets/fighter/normalized/hero-ground-kick-combo-14-strip-v1.webp")
OUTPUT = Path("src-web/assets/fighter/normalized/shadows/hero-ground-kick-combo-14-strip-v2.webp")


def clean_alpha(frame: Image.Image) -> Image.Image:
    return frame.getchannel("A").point(lambda value: 0 if value < 24 else value)


def tinted_shadow(mask: Image.Image, opacity: float) -> Image.Image:
    adjusted = mask.point(lambda value: round(value * opacity))
    ink = Image.new("RGBA", mask.size, SHADOW_COLOR)
    ink.putalpha(adjusted)
    return ink


def build_shadow(frame: Image.Image) -> Image.Image:
    alpha = clean_alpha(frame)
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError("Cannot build a shadow from an empty kick frame")

    left, top, right, bottom = bbox
    silhouette_height = max(26, round((bottom - top) * 0.17))

    # Keep the original 384 px horizontal coordinates.  The old generator
    # cropped and re-centred every silhouette independently, which made the
    # shadow slide away from the shared support-foot anchor.
    silhouette = alpha.crop((0, top, FRAME_SIZE, bottom)).resize(
        (FRAME_SIZE, silhouette_height), Image.Resampling.LANCZOS
    )

    # With a top-left light, upper body parts project slightly farther right
    # than the feet.  This keeps the compressed head/torso/limbs readable
    # instead of collapsing them into a uniform horizontal block.
    cast_distance = 16
    slope = cast_distance / max(1, silhouette_height - 1)
    silhouette = silhouette.transform(
        (FRAME_SIZE, silhouette_height),
        Image.Transform.AFFINE,
        (1, slope, -cast_distance, 0, 1, 0),
        resample=Image.Resampling.BICUBIC,
    ).filter(ImageFilter.GaussianBlur(1.15))

    shadow = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    cast_y = BASELINE_Y - round(silhouette_height * 0.56)
    shadow.alpha_composite(tinted_shadow(silhouette, 0.43), (0, cast_y))

    # Derive a compact contact shadow only from the lowest part of the real
    # silhouette.  It follows the planted foot and prevents the fighter from
    # looking detached during the long kicks without inventing an ellipse.
    contact_top = max(top, bottom - 34)
    contact = alpha.crop((0, contact_top, FRAME_SIZE, bottom)).resize(
        (FRAME_SIZE, 9), Image.Resampling.LANCZOS
    ).filter(ImageFilter.GaussianBlur(0.85))
    shadow.alpha_composite(tinted_shadow(contact, 0.47), (0, BASELINE_Y - 5))
    return shadow


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    expected_size = (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE)
    if source.size != expected_size:
        raise RuntimeError(f"Expected {expected_size}, got {source.size}")

    strip = Image.new("RGBA", expected_size)
    for index in range(FRAME_COUNT):
        frame = source.crop((index * FRAME_SIZE, 0, (index + 1) * FRAME_SIZE, FRAME_SIZE))
        strip.alpha_composite(build_shadow(frame), (index * FRAME_SIZE, 0))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    strip.save(OUTPUT, "WEBP", quality=88, method=6, exact=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()
