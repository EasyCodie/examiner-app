import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from scrapling.parser import Selector

with open("scratch/examon_dynamic.html", "r", encoding="utf-8") as f:
    html = f.read()

sel = Selector(html)

print("--- HEADER / NAVBAR HTML ---")
header = sel.css('header')
if header:
    print(header[0].attrib.get('class'))
    for child in header[0].css('*'):
        tag = child.tag
        cls = child.attrib.get('class')
        txt = child.css('::text').get()
        if txt and txt.strip():
            print(f"  <{tag} class='{cls}'>: {txt.strip()}")

print("\n--- FOOTER HTML ---")
footer = sel.css('footer')
if footer:
    print(footer[0].attrib.get('class'))
    for child in footer[0].css('*'):
        tag = child.tag
        cls = child.attrib.get('class')
        txt = child.css('::text').get()
        if txt and txt.strip():
            print(f"  <{tag} class='{cls}'>: {txt.strip()}")

print("\n--- HERO SECTION ---")
hero = sel.css('section#top')
if hero:
    print("Hero class:", hero[0].attrib.get('class'))
    for h in hero[0].css('h1, h2, h3, p, a, button'):
        tag = h.tag
        cls = h.attrib.get('class')
        txt = " ".join([t.strip() for t in h.css('::text').getall() if t.strip()])
        print(f"  <{tag} class='{cls}'>: {txt}")
