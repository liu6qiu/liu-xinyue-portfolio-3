from __future__ import annotations

import io
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
REPOSITORY = "liu6qiu/liu-xinyue-portfolio-3"
TOKEN = os.environ.get("GITHUB_TOKEN", "")


def api(path: str) -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "codex-portfolio-image-optimizer",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    with urlopen(Request(f"https://api.github.com/repos/{REPOSITORY}{path}", headers=headers), timeout=90) as response:
        return json.load(response)


def download_chunk(path: str, start: int, end: int) -> bytes:
    url = f"https://liu6qiu.github.io/liu-xinyue-portfolio-3/assets/{quote(path)}"
    last_error = None
    for attempt in range(5):
        try:
            request = Request(
                url,
                headers={
                    "Range": f"bytes={start}-{end}",
                    "Accept-Encoding": "identity",
                    "User-Agent": "codex-portfolio-image-optimizer",
                },
            )
            with urlopen(request, timeout=180) as response:
                data = response.read()
            expected = end - start + 1
            if len(data) != expected:
                raise IOError(f"Expected {expected} bytes, received {len(data)}")
            return data
        except Exception as error:
            last_error = error
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Unable to download {path} bytes {start}-{end}") from last_error


def referenced(path: str) -> bool:
    direct = {
        "01-a2.png",
        "02-xiancha.png",
        "03-mamamiya.png",
        "04-super-syn.png",
        "05-alusso.png",
        "06-vesta.png",
        "07-forgood.png",
        "08-huaye.png",
        "bzm-featured-cover.png",
        "bzm-hover-cursor.png",
        "jsc-featured-cover.png",
        "jsc-hover-cursor.png",
        "soniq-featured-cover.png",
        "soniq-hover-cursor.png",
        "carousel-expand.png",
        "carousel-collapse.png",
        "about/hero-images-group.png",
        "about/tools-group.png",
        "about/portrait-hike.jpg",
        "about/bike-sunset.jpg",
        "about/group-ride.jpg",
        "about/pilates.jpg",
        "about/road-run.jpg",
    }
    return path in direct or (path.startswith("cases/") and path.lower().endswith((".jpg", ".jpeg", ".png")))


def profile(path: str) -> tuple[int, int, bool]:
    if "hover-cursor" in path:
        return 100, 1200, True
    if path.startswith("carousel-"):
        return 100, 256, True
    if path.startswith("cases/"):
        return 84, 2200, False
    if path.startswith("about/"):
        return 84, 2400, False
    return 83, 2400, False


def main() -> None:
    ref = api("/git/ref/heads/main")
    commit = api(f"/git/commits/{ref['object']['sha']}")
    tree = api(f"/git/trees/{commit['tree']['sha']}?recursive=1")
    blobs = [item for item in tree["tree"] if item.get("type") == "blob" and referenced(item["path"])]
    if not blobs:
        raise SystemExit("No referenced image blobs found")

    chunk_size = 1024 * 1024
    tasks = []
    for item in blobs:
        for start in range(0, item["size"], chunk_size):
            tasks.append((item["path"], start, min(item["size"] - 1, start + chunk_size - 1)))

    chunks: dict[str, dict[int, bytes]] = {item["path"]: {} for item in blobs}
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(download_chunk, *task): task for task in tasks}
        for completed, future in enumerate(as_completed(futures), 1):
            path, start, end = futures[future]
            chunks[path][start] = future.result()
            print(f"downloaded {completed:03d}/{len(tasks):03d} chunks: {path} [{start}-{end}]", flush=True)

    before = 0
    after = 0
    converted = []
    for index, item in enumerate(blobs, 1):
        remote_path = item["path"]
        source = b"".join(chunks[remote_path][start] for start in sorted(chunks[remote_path]))
        before += len(source)
        quality, max_width, lossless = profile(remote_path)

        with Image.open(io.BytesIO(source)) as opened:
            image = ImageOps.exif_transpose(opened)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            source_size = image.size
            if max_width and image.width > max_width:
                target_height = round(image.height * max_width / image.width)
                image = image.resize((max_width, target_height), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            save_args = {"format": "WEBP", "method": 6, "lossless": lossless}
            if not lossless:
                save_args.update({"quality": quality, "alpha_quality": 92})
            image.save(output, **save_args)

        target_path = Path(remote_path).with_suffix(".webp")
        destination = ASSETS / target_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(output.getvalue())
        after += destination.stat().st_size
        converted.append({
            "source": remote_path,
            "target": target_path.as_posix(),
            "before": len(source),
            "after": destination.stat().st_size,
            "source_size": source_size,
            "output_size": image.size,
        })
        print(f"[{index:02d}/{len(blobs):02d}] {remote_path} -> {target_path.as_posix()} ({len(source) / 1048576:.2f}MB -> {destination.stat().st_size / 1048576:.2f}MB)")

    report = {
        "count": len(converted),
        "before_bytes": before,
        "after_bytes": after,
        "saving_percent": round((1 - after / before) * 100, 1),
        "images": converted,
    }
    (ROOT / "image-optimization-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"TOTAL: {before / 1048576:.2f}MB -> {after / 1048576:.2f}MB ({report['saving_percent']}% smaller)")


if __name__ == "__main__":
    main()
