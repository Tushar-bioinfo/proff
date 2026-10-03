#!/usr/bin/env python3
"""Make one lesson image by asking the Codex CLI to use its image tool.

Usage: image.py --out img/topic.png --title T --subtitle S --callout1 A --callout2 B --monologue M
                [--scene "tissue slice"] [--features "cyan DAPI nuclei, ..."] [--model M] [--timeout 600]
Exit 0 = image saved (prints path and size). Exit 2 = no image tool (codex missing). Exit 1 = it failed.
Pass --print to only print the filled prompt (for chat apps with their own image tool).
"""
import argparse, shutil, struct, subprocess, sys, tempfile
from pathlib import Path

TEMPLATE = (
    "Visual Scene: Dark teal, indigo, and slate background; {scene} featuring {features}.\n"
    "Header: Compact white handwritten title '{title}' with subtitle '{subtitle}'.\n"
    "Callout Notes: '{callout1}', '{callout2}'.\n"
    "Inner Monologue: '{monologue}'.\n"
    "Rules: Thin single-stroke white pen lines, polygon boundaries, white arrows, ample negative space. "
    "STRICT: NO emojis, faces, hearts, or sparkles."
)


def png_size(f):
    b = f.read_bytes()[:24]
    return struct.unpack(">II", b[16:24]) if b[:8] == b"\x89PNG\r\n\x1a\n" else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--subtitle", required=True)
    ap.add_argument("--callout1", required=True)
    ap.add_argument("--callout2", required=True)
    ap.add_argument("--monologue", required=True)
    ap.add_argument("--scene", default="a tissue slice")
    ap.add_argument("--features", default="cyan DAPI nuclei, mint membranes, pink/gold markers")
    ap.add_argument("--model", help="Codex model; default = your Codex default")
    ap.add_argument("--timeout", type=int, default=600)
    ap.add_argument("--print", action="store_true", help="only print the filled prompt")
    a = ap.parse_args()
    prompt = TEMPLATE.format(**{k: getattr(a, k) for k in ("scene", "features", "title", "subtitle", "callout1", "callout2", "monologue")})
    if a.print:
        print(prompt)
        return 0
    codex = shutil.which("codex")
    if not codex:
        print("no image tool: codex CLI not found. Skip the image; use a flow or svg slide.", file=sys.stderr)
        return 2
    out = Path(a.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    brief = (f"Generate ONE image with your image generation tool and save it as {out} "
             "(copy it there if the tool saves elsewhere). Landscape 16:9 if you can choose the size. "
             f"Use exactly this prompt:\n\n{prompt}\n\nReply with only the saved path.")
    cmd = [codex, "exec", "--skip-git-repo-check", "-s", "workspace-write", "-C", str(out.parent)]
    if a.model:
        cmd += ["-m", a.model]
    with tempfile.NamedTemporaryFile(suffix=".txt") as last:
        cmd += ["-o", last.name, "-"]
        try:
            r = subprocess.run(cmd, input=brief, text=True, capture_output=True, timeout=a.timeout)
        except subprocess.TimeoutExpired:
            print(f"codex timed out after {a.timeout}s", file=sys.stderr)
            return 1
    if not out.exists() or out.stat().st_size == 0:
        print(f"no image saved (codex exit {r.returncode}). {r.stderr.strip()[-400:]}", file=sys.stderr)
        return 1
    size = png_size(out)
    print(out, f"{size[0]}x{size[1]}" if size else "")
    return 0


if __name__ == "__main__":
    sys.exit(main())
