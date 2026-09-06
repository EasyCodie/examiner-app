import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from scrapling.fetchers import DynamicFetcher, Fetcher
from scrapling.parser import Selector

pricing_url = 'https://www.examon.ai/pricing'
print(f"Fetching {pricing_url}...")
pricing_page = DynamicFetcher.fetch(pricing_url, headless=True, network_idle=True)

with open("scratch/examon_pricing.html", "w", encoding="utf-8") as f:
    f.write(pricing_page.body.decode('utf-8', errors='ignore'))

sel = Selector(pricing_page.body.decode('utf-8', errors='ignore'))
print("Pricing title:", sel.css('title::text').get())
h1s = sel.css('h1::text').getall()
print("H1s:", h1s)
h2s = sel.css('h2::text').getall()
print("H2s:", h2s)
h3s = sel.css('h3::text').getall()
print("H3s:", h3s)

cards = sel.css('div[class*="card"], div[class*="border"], div[class*="rounded"]')
print(f"Potential pricing cards: {len(cards)}")

buttons = sel.css('button')
for b in buttons:
    txt = " ".join([t.strip() for t in b.css('::text').getall() if t.strip()])
    cls = b.attrib.get('class', '')
    if txt:
        print(f"Button: '{txt}' -> class: '{cls[:80]}'")
