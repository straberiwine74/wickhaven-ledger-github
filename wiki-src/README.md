# Thaleryn Wiki source

The wiki that GitHub Pages serves lives in `docs/`. Don't edit the HTML pages in `docs/` by hand: they're generated from the fragments here.

- `pages/<slug>.html`: one fragment per page. The first line is a JSON settings comment (title, lede, poster, accent).
- `build.py`: wraps every fragment in the shared header, sidebar and footer, and writes `docs/*.html` plus `docs/search-index.js`.
- `docs/wiki.css` and `docs/wiki.js`: shared styles and scripts (edit these directly).
- `docs/img/`: Sam's posters.

## Update the wiki
1. Edit or add a fragment in `wiki-src/pages/`. New page? Add it to `NAV` in `build.py` too.
2. Run `python wiki-src/build.py` from the repo root.
3. Commit `docs/` and `wiki-src/` together, then push.
