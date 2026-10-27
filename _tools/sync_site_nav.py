#!/usr/bin/env python3
"""Copy the shared top nav (_tools/site-nav.html) into every page.

Each page marks where the nav goes:
    <!-- FM-NAV:START -->        ... <!-- FM-NAV:END -->   regular page
    <!-- FM-NAV:START course --> ... <!-- FM-NAV:END -->   course page (adds "back to course")

Run from the repo root after editing _tools/site-nav.html:
    python3 _tools/sync_site_nav.py

The look of the nav lives in assets/css/site-nav.css; this script also makes
sure every marked page links that stylesheet. Folders starting with "_" are
not published by GitHub Pages, so this tool never reaches the live site.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = (ROOT / "_tools" / "site-nav.html").read_text(encoding="utf-8").strip()
CSS_LINK = '<link rel="stylesheet" href="assets/css/site-nav.css">'

COURSE_LINK = """
      <a class="fmn-pill fmn-course-link" href="guides.html" aria-label="חזרה לקורס">
        <svg class="fmn-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        <span class="fmn-long" data-fmn-label="course">חזרה לקורס</span><span class="fmn-short" data-fmn-label="course-short">לקורס</span>
      </a>"""

BLOCK = re.compile(r"<!-- FM-NAV:START( course)? -->.*?<!-- FM-NAV:END -->", re.S)


def render(course: bool) -> str:
    html = TEMPLATE.replace("{{COURSE_CLASS}}", " fmn-course" if course else "")
    html = html.replace("{{COURSE_LINK}}", COURSE_LINK if course else "")
    marker = "<!-- FM-NAV:START course -->" if course else "<!-- FM-NAV:START -->"
    return f"{marker}\n{html}\n<!-- FM-NAV:END -->"


def sync_page(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    blocks = list(BLOCK.finditer(text))
    if not blocks:
        return False
    if len(blocks) > 1:
        sys.exit(f"{path.name}: more than one FM-NAV block, fix by hand")
    new = BLOCK.sub(lambda m: render(bool(m.group(1))), text, count=1)
    if CSS_LINK not in new:
        if new.count("</head>") != 1:
            sys.exit(f"{path.name}: expected exactly one </head>")
        new = new.replace("</head>", f"{CSS_LINK}\n</head>", 1)
    if new != text:
        path.write_text(new, encoding="utf-8")
        print(f"updated {path.name}")
    return True


def main() -> None:
    pages = sorted(ROOT.glob("*.html"))
    synced = [p.name for p in pages if sync_page(p)]
    print(f"{len(synced)} pages carry the nav: {', '.join(synced)}")


if __name__ == "__main__":
    main()
