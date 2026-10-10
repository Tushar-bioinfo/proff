#!/usr/bin/env python3
"""Quiz log: one line per quiz (date, topic, style, score, main mistake).

Usage: log.py add --topic T --style ste|plain --score 3/5 --mistake "..."
       log.py show [--topic T] [--last 10]
File: $PROFF_LOG or ~/.proff/quiz.tsv
"""
import argparse, datetime, os, sys
from pathlib import Path

LOG = Path(os.environ.get("PROFF_LOG", Path.home() / ".proff" / "quiz.tsv"))
HEAD = "date\ttopic\tstyle\tscore\tmistake\n"


def clean(s):
    return " ".join(str(s).split())


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a1 = sub.add_parser("add")
    a1.add_argument("--topic", required=True)
    a1.add_argument("--style", choices=["ste", "plain"], default="ste")
    a1.add_argument("--score", required=True)
    a1.add_argument("--mistake", default="")
    a2 = sub.add_parser("show")
    a2.add_argument("--topic")
    a2.add_argument("--last", type=int, default=10)
    a = ap.parse_args()
    if a.cmd == "add":
        LOG.parent.mkdir(parents=True, exist_ok=True)
        new = not LOG.exists()
        with LOG.open("a") as f:
            if new:
                f.write(HEAD)
            f.write("\t".join([datetime.date.today().isoformat(), clean(a.topic), a.style, clean(a.score), clean(a.mistake)]) + "\n")
        print(LOG)
    else:
        if not LOG.exists():
            print("no quizzes logged yet")
            return 0
        rows = LOG.read_text().splitlines()[1:]
        if a.topic:
            rows = [r for r in rows if a.topic.lower() in r.split("\t")[1].lower()]
        print(HEAD.strip())
        print("\n".join(rows[-a.last:]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
