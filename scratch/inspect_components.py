from scrapling.parser import Selector
import json

with open("scratch/examon_dynamic.html", "r", encoding="utf-8") as f:
    html = f.read()

sel = Selector(html)

print("--- NAV / HEADER ---")
navs = sel.css('nav')
for nav in navs:
    print("Nav class:", nav.attrib.get('class'))
    links = nav.css('a')
    for l in links:
        print("  Nav link:", l.css('::text').getall(), "href:", l.attrib.get('href'), "class:", l.attrib.get('class'))

print("\n--- BUTTONS ---")
buttons = sel.css('button')
for b in buttons:
    txt = " ".join([t.strip() for t in b.css('::text').getall() if t.strip()])
    print(f"Button: '{txt}' | class: '{b.attrib.get('class')}'")

print("\n--- HEADINGS (H1-H6) ---")
for level in range(1, 7):
    hs = sel.css(f'h{level}')
    for h in hs:
        txt = " ".join([t.strip() for t in h.css('::text').getall() if t.strip()])
        print(f"H{level}: '{txt}' | class: '{h.attrib.get('class')}'")

print("\n--- SECTIONS & CARDS ---")
sections = sel.css('section')
print(f"Found {len(sections)} <section> tags")
for i, s in enumerate(sections):
    print(f"Section {i}: id='{s.attrib.get('id')}' class='{s.attrib.get('class')}'")

print("\n--- ALL A LINKS ---")
all_a = sel.css('a')
for a in all_a:
    txt = " ".join([t.strip() for t in a.css('::text').getall() if t.strip()])
    href = a.attrib.get('href')
    cls = a.attrib.get('class')
    if txt or href:
        print(f"  Link: '{txt}' -> {href} (class: {cls})")
