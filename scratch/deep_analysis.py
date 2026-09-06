import re
import json
from scrapling.fetchers import Fetcher

with open("scratch/examon_combined.css", "r", encoding="utf-8") as f:
    css = f.read()

# 1. Dark mode tokens
dark_blocks = re.findall(r'(\.dark[^{]*)\{([^}]+)\}', css)
print(f"Dark mode blocks found: {len(dark_blocks)}")
for sel, body in dark_blocks:
    print("Selector:", sel.strip())
    for line in body.split(';'):
        if '--' in line:
            print("  ", line.strip())

# 2. Keyframes
keyframes = re.findall(r'@keyframes\s+([a-zA-Z0-9\-_]+)\s*\{', css)
print(f"\nKeyframes found: {len(keyframes)}")
print("Keyframes:", set(keyframes))

# 3. All @font-face rules
all_ff = re.findall(r'@font-face\s*\{([^}]+)\}', css)
fonts = {}
for ff in all_ff:
    fam = re.search(r'font-family:\s*([^;]+)', ff)
    weight = re.search(r'font-weight:\s*([^;]+)', ff)
    src = re.search(r'src:\s*([^;]+)', ff)
    if fam:
        f_name = fam.group(1).strip('"\' ')
        w = weight.group(1).strip() if weight else 'normal'
        fonts.setdefault(f_name, []).append((w, src.group(1).strip() if src else ''))

print("\nFonts:", fonts.keys())
for f_name, details in fonts.items():
    print(f"  {f_name}: weights -> {[d[0] for d in details]}")

# 4. Extract all shadow rules
shadows = set(re.findall(r'box-shadow:\s*([^;{}]+)', css))
print(f"\nUnique box-shadows: {len(shadows)}")
for s in list(shadows)[:15]:
    print("  box-shadow:", s.strip())

# 5. Extract border-radius rules
radii = set(re.findall(r'border-radius:\s*([^;{}]+)', css))
print(f"\nUnique border-radii: {len(radii)}")
for r in sorted(radii)[:15]:
    print("  border-radius:", r.strip())

# 6. Check internal links on examon.ai
with open("scratch/examon_index.html", "r", encoding="utf-8") as f:
    html = f.read()

from scrapling.parser import Selector
sel = Selector(html)
links = sel.css('a::attr(href)').getall()
internal_links = sorted(set([l for l in links if l.startswith('/') or 'examon.ai' in l]))
print(f"\nInternal links on homepage: {len(internal_links)}")
for l in internal_links:
    print("  link:", l)
