#!/usr/bin/env python3
"""Build the Thaleryn Wiki.

Each page lives in wiki-src/pages/<slug>.html as an HTML fragment. Its first
line is an HTML comment holding JSON settings, for example:

  <!-- {"title": "Hunting", "lede": "One-line intro", "poster": "poster-hunting-fields.jpg"} -->

Optional settings: lede, poster, poster_alt, accent (a CSS colour for the
page's top stripe), hero (true on the home page: no title block).

Run:  python3 wiki-src/build.py
It writes every page into docs/ (what GitHub Pages serves), plus
docs/search-index.js for the search box. Add a new page by creating its
fragment and adding it to NAV below.
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES = os.path.join(ROOT, "pages")
OUT = os.path.join(os.path.dirname(ROOT), "docs")

NAV = [
    ("Start here", [
        ("index", "Welcome to Wickhaven"),
        ("new-to-thaleryn", "New to Thaleryn"),
        ("character-creation", "Character creation"),
        ("table-safety", "Table safety"),
    ]),
    ("The world", [
        ("wickhaven", "Wickhaven & the Conclave"),
        ("places", "Places of Wickhaven"),
        ("the-ancients", "The Ancients & Elaris"),
        ("faiths", "Faiths & the Hush"),
        ("people", "People of Wickhaven"),
        ("rumors", "Rumors & mysteries"),
        ("the-map", "The map & the Outlands"),
    ]),
    ("Guilds & districts", [
        ("waymeet", "Wayfarers · Waymeet"),
        ("high-ward", "Magisterium · High Ward"),
        ("hammerfell", "Hand & Hammer · Hammerfell"),
        ("the-drift", "Unbound · The Drift"),
        ("lowside", "Lowside"),
    ]),
    ("Adventuring", [
        ("hunting", "Hunting"),
        ("blood-pit", "The Blood Pit"),
        ("solo-expeditions", "Solo expeditions"),
        ("rest-and-recovery", "Rest & recovery"),
    ]),
    ("Reputation", [
        ("reputation", "Reputation guide"),
        ("rep-standing", "Standing, tiers & the cap"),
        ("rep-guilds", "The four guilds"),
        ("rep-earning", "Earning rep"),
        ("rep-pledging", "Pledging to a guild"),
        ("rep-jobs-and-training", "Guild jobs & trainers"),
        ("rep-perks", "What standing unlocks"),
        ("rep-losing", "Losing rep & the Back Alley"),
    ]),
    ("Downtime", [
        ("downtime", "Downtime guide"),
        ("quick-reference", "A day of downtime"),
        ("stamina-and-tools", "Stamina, tools & journal"),
        ("locations", "Where to go"),
        ("channels", "Each channel at a glance"),
        ("gathering-and-fishing", "Gathering & fishing"),
        ("excavation", "Mining, digging & the Hush"),
        ("food-and-drink", "Cooking, eating & drinking"),
        ("skinning-and-crafting", "Skinning & crafting"),
        ("training-and-study", "Training & study"),
        ("the-archive", "The Archive"),
        ("trade", "Turning in, selling & coin"),
        ("weather", "Weather"),
        ("timers-and-resets", "Timers & resets"),
    ]),
    ("Reference", [
        ("commands", "Command index"),
        ("glossary", "Glossary"),
    ]),
]

FLAME = ('<svg class="flame" width="30" height="36" viewBox="0 0 34 40" aria-hidden="true">'
         '<defs><radialGradient id="fl" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff3c9"/>'
         '<stop offset=".5" stop-color="#f0b45a"/><stop offset="1" stop-color="#b5541c"/></radialGradient></defs>'
         '<path d="M17 2c3 6 9 9 9 17a9 9 0 0 1-18 0c0-5 3-7 4-11 1 3 2 4 4 5-1-4 0-8 1-11z" fill="url(#fl)"/>'
         '<rect x="11" y="30" width="12" height="8" rx="2" fill="#f0d4a0"/></svg>')

TOP = [("index", "Start Here"), ("places", "The World"), ("waymeet", "Guilds"),
       ("hunting", "Adventuring"), ("downtime", "Downtime"), ("commands", "Commands")]


def read_page(slug):
    raw = open(os.path.join(PAGES, slug + ".html"), encoding="utf-8").read()
    m = re.match(r"\s*<!--\s*(\{.*?\})\s*-->\s*", raw, re.S)
    if not m:
        raise SystemExit(f"{slug}.html is missing its settings comment")
    return json.loads(m.group(1)), raw[m.end():]


def section_of(slug):
    for name, items in NAV:
        for i, (s, _) in enumerate(items):
            if s == slug:
                return name, items, i
    raise SystemExit(f"{slug} is not in NAV")


def sidebar(current):
    cur_section = section_of(current)[0]
    out = []
    for name, items in NAV:
        links = "".join(
            '<a href="%s.html"%s>%s</a>' % (s, ' aria-current="page"' if s == current else '', html.escape(t))
            for s, t in items)
        is_open = " open" if name == cur_section else ""
        out.append(f'<details{is_open}><summary>{html.escape(name)}</summary>{links}</details>')
    return "".join(out)


def page(slug, meta, body):
    sec, items, i = section_of(slug)
    title = meta["title"]
    top = "".join('<a href="%s.html"%s>%s</a>' % (s, ' class="on"' if section_of(s)[0] == sec else '', t) for s, t in TOP)
    head = ""
    if not meta.get("hero"):
        accent = f' style="--accent:{meta["accent"]}"' if meta.get("accent") else ""
        head = f'<div class="page-head"{accent}><div class="crumbs">{html.escape(sec)}</div><h1>{html.escape(title)}</h1>'
        if meta.get("lede"):
            head += f'<p class="lede">{meta["lede"]}</p>'
        head += "</div>"
        if meta.get("poster"):
            alt = html.escape(meta.get("poster_alt", title + " poster"))
            head += (f'<figure class="poster"><img src="img/{meta["poster"]}" alt="{alt}" loading="lazy">'
                     f'<figcaption>Poster by Sam</figcaption></figure>')
    prev_ = items[i - 1] if i > 0 else None
    next_ = items[i + 1] if i + 1 < len(items) else None
    pager = '<nav class="pager" aria-label="Next and previous pages">'
    pager += f'<a href="{prev_[0]}.html">← {html.escape(prev_[1])}</a>' if prev_ else "<span></span>"
    pager += f'<a href="{next_[0]}.html">{html.escape(next_[1])} →</a>' if next_ else "<span></span>"
    pager += "</nav>"
    doc_title = "Thaleryn Wiki" if slug == "index" else f"{title} | Thaleryn Wiki"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(doc_title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap">
<link rel="stylesheet" href="wiki.css"></head>
<body><a class="skip" href="#content">Skip to content</a>
<header class="site-head"><div class="head-inner">
<a class="brand" href="index.html">{FLAME}<span><span class="word">THALERYN</span><span class="sub">The Chronicles · Wiki</span></span></a>
<nav class="topnav" aria-label="Sections">{top}</nav>
<div class="search"><input id="q" type="search" placeholder="Search the wiki…" aria-label="Search the wiki" autocomplete="off"><div id="results" class="results" hidden></div></div>
<button class="menu" aria-label="Menu" aria-expanded="false" aria-controls="side">☰</button>
</div></header>
<div class="wrap"><div class="layout">
<aside class="side" id="side"><nav aria-label="Wiki pages">{sidebar(slug)}</nav></aside>
<main id="content">{head}
{body.strip()}
{pager}</main>
</div></div>
<footer class="foot"><div class="wrap"><span class="cinzel">The Chronicles of Thaleryn</span><span>Player wiki · daily limits reset at midnight UTC</span></div></footer>
<script src="search-index.js"></script><script src="wiki.js"></script>
</body></html>
"""


def text_of(body):
    t = re.sub(r"<script.*?</script>", " ", body, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def main():
    index = []
    slugs = [s for _, items in NAV for s, _ in items]
    for f in os.listdir(PAGES):
        if f.endswith(".html") and f[:-5] not in slugs:
            raise SystemExit(f"{f} exists but isn't in NAV")
    for slug in slugs:
        meta, body = read_page(slug)
        with open(os.path.join(OUT, slug + ".html"), "w", encoding="utf-8") as fh:
            fh.write(page(slug, meta, body))
        index.append({"u": slug + ".html", "t": meta["title"], "s": section_of(slug)[0], "x": text_of(body)[:4000]})
    with open(os.path.join(OUT, "search-index.js"), "w", encoding="utf-8") as fh:
        fh.write("window.WIKI_INDEX=" + json.dumps(index, ensure_ascii=False) + ";\n")
    print(f"Built {len(slugs)} pages into docs/")


if __name__ == "__main__":
    main()
