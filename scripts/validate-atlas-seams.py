from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


def edge_error(left: Image.Image, right: Image.Image, edge_width: int) -> float:
    left_edge = left.crop((left.width - edge_width, 0, left.width, left.height))
    right_edge = right.crop((0, 0, edge_width, right.height))
    return sum(ImageStat.Stat(ImageChops.difference(left_edge, right_edge)).mean) / 3


def stitch(tiles: list[Image.Image]) -> Image.Image:
    preview = Image.new("RGB", (sum(tile.width for tile in tiles), tiles[0].height))
    x = 0
    for tile in tiles:
        preview.paste(tile, (x, 0));x += tile.width
    return preview


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate and preview a strict 2x2 environment atlas.")
    parser.add_argument("atlas", type=Path)
    parser.add_argument("preview", type=Path)
    parser.add_argument("--edge-width", type=int, default=16)
    args = parser.parse_args()

    atlas = Image.open(args.atlas).convert("RGB")
    width, height = atlas.size
    if width != height or width % 2 or height % 2:
        raise ValueError("Atlas must be a square with even dimensions")
    half = width // 2
    a = atlas.crop((0, 0, half, half));b = atlas.crop((half, 0, width, half))
    c = atlas.crop((0, half, half, height));d = atlas.crop((half, half, width, height))
    wall = stitch([a, a, b, a]);floor = stitch([c, d, c, d])
    preview = Image.new("RGB", (wall.width, wall.height + floor.height))
    preview.paste(wall, (0, 0));preview.paste(floor, (0, wall.height))
    args.preview.parent.mkdir(parents=True, exist_ok=True)
    preview.save(args.preview, quality=92, optimize=True)

    pairs = {"A>A": (a, a), "A>B": (a, b), "B>A": (b, a), "C>D": (c, d), "D>C": (d, c)}
    for name, (left, right) in pairs.items():
        print(f"{name}: mean edge error {edge_error(left, right, args.edge_width):.2f}")


if __name__ == "__main__":
    main()

