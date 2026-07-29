from pathlib import Path
import sys

import numpy as np
from PIL import Image

# One-time setup: python -m pip install pillow numpy

OUTPUT = Path(__file__).resolve().parents[1] / "public" / "builder-bot-sprite.webp"
CELL_SIZE = 256
CONTENT_SIZE = 230

# Bounding boxes measured from the supplied 1684 × 2528 sheet.
# Each tuple is (left, top, width, height).
ROWS = [
    [
        (143, 94, 176, 337),
        (343, 94, 178, 337),
        (547, 94, 178, 337),
        (749, 94, 175, 337),
        (951, 94, 177, 337),
        (1155, 94, 177, 337),
        (1362, 94, 174, 337),
    ],
    [
        (120, 497, 213, 343),
        (349, 497, 174, 345),
        (538, 497, 201, 346),
        (764, 497, 168, 343),
        (954, 497, 202, 345),
        (1173, 497, 175, 343),
        (1366, 497, 196, 346),
    ],
    [
        (142, 1245, 168, 255),
        (363, 1220, 143, 284),
        (575, 1204, 145, 282),
        (777, 1192, 146, 277),
        (983, 1225, 140, 268),
        (1189, 1245, 145, 255),
        (1410, 1245, 146, 255),
    ],
    [
        (104, 1527, 217, 176),
        (352, 1533, 211, 158),
        (596, 1523, 211, 179),
        (869, 1529, 211, 177),
        (1126, 1533, 196, 159),
        (1370, 1528, 211, 174),
    ],
    [
        (110, 1758, 277, 320),
        (505, 1758, 275, 320),
        (918, 1758, 263, 320),
        (1287, 1758, 265, 320),
    ],
]


def remove_magenta(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    key = np.array([245.0, 2.0, 249.0], dtype=np.float32)
    distance = np.linalg.norm(rgb - key, axis=2)
    alpha = np.clip((distance - 18.0) / 58.0, 0.0, 1.0)
    magenta_dominance = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    bright_magenta = (
        (rgb[..., 0] > 125.0)
        & (rgb[..., 2] > 125.0)
        & (magenta_dominance > 58.0)
    )
    alpha[bright_magenta] = 0.0

    clear_pixels = alpha < 0.08
    padded_clear = np.pad(clear_pixels, 1, mode="constant", constant_values=True)
    touches_clear = np.zeros_like(clear_pixels)
    for y_offset in range(3):
        for x_offset in range(3):
            touches_clear |= padded_clear[
                y_offset : y_offset + clear_pixels.shape[0],
                x_offset : x_offset + clear_pixels.shape[1],
            ]
    edge_fringe = (
        touches_clear
        & (magenta_dominance > 20.0)
        & (rgb[..., 0] > 55.0)
        & (rgb[..., 2] > 55.0)
    )
    alpha[edge_fringe] = 0.0

    foreground = rgb.copy()
    partial = (alpha >= 0.08) & (alpha < 0.98)
    safe_alpha = np.maximum(alpha[..., None], 0.08)
    despilled = (rgb - (1.0 - alpha[..., None]) * key) / safe_alpha
    foreground[partial] = np.clip(despilled[partial], 0.0, 255.0)
    foreground[alpha < 0.08] = 0.0

    rgba = np.dstack((foreground.astype(np.uint8), (alpha * 255).astype(np.uint8)))
    return Image.fromarray(rgba, "RGBA")


def expand_frames(frames: list[tuple[int, int, int, int]]) -> list[tuple[int, int, int, int]]:
    if len(frames) == 7:
        return frames
    if len(frames) == 6:
        return frames + [frames[0]]
    if len(frames) == 4:
        return [frames[0], frames[1], frames[2], frames[3], frames[2], frames[1], frames[0]]
    raise ValueError(f"Unsupported frame count: {len(frames)}")


def build_atlas() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/build_shimeji_atlas.py <source-sprite-sheet.png>")

    source = Image.open(Path(sys.argv[1])).convert("RGB")
    expected_size = (1684, 2528)
    if source.size != expected_size:
        raise SystemExit(
            f"Expected a {expected_size[0]}x{expected_size[1]} source sheet, "
            f"received {source.width}x{source.height}."
        )
    atlas = Image.new("RGBA", (CELL_SIZE * 7, CELL_SIZE * len(ROWS)), (0, 0, 0, 0))

    for row_index, source_frames in enumerate(ROWS):
        frames = expand_frames(source_frames)
        max_width = max(frame[2] for frame in source_frames)
        max_height = max(frame[3] for frame in source_frames)
        scale = min(CONTENT_SIZE / max_width, CONTENT_SIZE / max_height)

        for column_index, (left, top, width, height) in enumerate(frames):
            padding = 8
            crop = source.crop(
                (
                    max(0, left - padding),
                    max(0, top - padding),
                    min(source.width, left + width + padding),
                    min(source.height, top + height + padding),
                )
            )
            sprite = remove_magenta(crop)
            resized_width = max(1, round(sprite.width * scale))
            resized_height = max(1, round(sprite.height * scale))
            sprite = sprite.resize(
                (resized_width, resized_height),
                Image.Resampling.LANCZOS,
            )

            x = column_index * CELL_SIZE + (CELL_SIZE - resized_width) // 2
            # A shared baseline keeps feet stable while walking and prevents jitter.
            y = row_index * CELL_SIZE + CELL_SIZE - resized_height - 8
            atlas.alpha_composite(sprite, (x, y))

    atlas.save(OUTPUT, "WEBP", quality=92, method=6)
    print(f"Wrote {OUTPUT} ({atlas.width}x{atlas.height})")


if __name__ == "__main__":
    build_atlas()
