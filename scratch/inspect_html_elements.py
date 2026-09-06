from scrapling.parser import Selector

with open("scratch/examon_index.html", "r", encoding="utf-8") as f:
    html = f.read()

sel = Selector(html)
all_links = sel.css('a')
print(f"Total <a> tags: {len(all_links)}")
for a in all_links:
    href = a.attrib.get('href', '')
    text = a.css('::text').getall()
    text = " ".join([t.strip() for t in text if t.strip()])
    classes = a.attrib.get('class', '')
    print(f"  [Link] text: '{text}' | href: '{href}' | class: '{classes[:60]}'")

buttons = sel.css('button')
print(f"\nTotal <button> tags: {len(buttons)}")
for b in buttons:
    text = b.css('::text').getall()
    text = " ".join([t.strip() for t in text if t.strip()])
    classes = b.attrib.get('class', '')
    print(f"  [Button] text: '{text}' | class: '{classes[:60]}'")
