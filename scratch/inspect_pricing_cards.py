import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from scrapling.parser import Selector

with open("scratch/examon_pricing.html", "r", encoding="utf-8") as f:
    html = f.read()

sel = Selector(html)

# Extract plans
plan_cards = sel.css('div[class*="border"]')
for card in plan_cards:
    h3 = card.css('h3::text').get()
    if h3:
        price = card.css('div[class*="text-"], span[class*="text-"]::text').getall()
        classes = card.attrib.get('class', '')
        btn = card.css('button, a')
        btn_txt = " ".join([t.strip() for t in btn.css('::text').getall() if t.strip()])
        features = card.css('li::text').getall()
        print(f"\n[Plan Card: {h3}]")
        print("  Card classes:", classes)
        print("  Button:", btn_txt)
        print("  Features count:", len(features))
        for feat in features[:5]:
            print("   -", feat.strip())
