from __future__ import annotations

import base64
import json
import os
import time
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = "liu6qiu/liu-xinyue-portfolio-3"
TOKEN = os.environ["GITHUB_TOKEN"]


def request(method: str, path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": "codex-portfolio-publisher",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    last_error = None
    for attempt in range(5):
        try:
            with urlopen(Request(f"https://api.github.com/repos/{REPOSITORY}{path}", data=data, headers=headers, method=method), timeout=120) as response:
                return json.load(response)
        except Exception as error:
            last_error = error
            time.sleep(2 ** attempt)
    raise RuntimeError(f"GitHub API request failed: {method} {path}") from last_error


def files_to_publish() -> list[Path]:
    paths = list((ROOT / "assets").rglob("*.webp"))
    paths += [
        ROOT / "src" / "App.jsx",
        ROOT / "src" / "DepthCarousel.jsx",
        ROOT / "src" / "styles.css",
        ROOT / "vite.config.mjs",
        ROOT / "scripts" / "optimize-remote-images.py",
        ROOT / "scripts" / "publish-github.py",
        ROOT / "image-optimization-report.json",
    ]
    return sorted({path for path in paths if path.exists()}, key=lambda path: path.relative_to(ROOT).as_posix())


def main() -> None:
    ref = request("GET", "/git/ref/heads/main")
    parent_sha = ref["object"]["sha"]
    parent = request("GET", f"/git/commits/{parent_sha}")
    entries = []
    files = files_to_publish()
    for index, path in enumerate(files, 1):
        relative = path.relative_to(ROOT).as_posix()
        blob = request("POST", "/git/blobs", {
            "content": base64.b64encode(path.read_bytes()).decode("ascii"),
            "encoding": "base64",
        })
        entries.append({"path": relative, "mode": "100644", "type": "blob", "sha": blob["sha"]})
        print(f"[{index:02d}/{len(files):02d}] uploaded {relative}", flush=True)

    tree = request("POST", "/git/trees", {"base_tree": parent["tree"]["sha"], "tree": entries})
    commit = request("POST", "/git/commits", {
        "message": "Optimize portfolio images and responsive media layout",
        "tree": tree["sha"],
        "parents": [parent_sha],
    })
    request("PATCH", "/git/refs/heads/main", {"sha": commit["sha"], "force": False})
    print(json.dumps({"parent": parent_sha, "commit": commit["sha"], "files": len(files)}), flush=True)


if __name__ == "__main__":
    main()
