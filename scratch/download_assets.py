import urllib.parse
from scrapling.fetchers import Fetcher

base_url = "https://www.examon.ai"
response = Fetcher.get(base_url, impersonate='chrome', stealthy_headers=True)
css_links = response.css('link[rel="stylesheet"]::attr(href)').getall()

print(f"Fetching {len(css_links)} CSS files...")
all_css = []
for href in css_links:
    css_url = urllib.parse.urljoin(base_url, href)
    print("Fetching:", css_url)
    css_res = Fetcher.get(css_url, impersonate='chrome', stealthy_headers=True)
    all_css.append(css_res.body.decode('utf-8', errors='ignore'))

combined_css = "\n".join(all_css)
print(f"Total CSS length: {len(combined_css)} chars")

with open("scratch/examon_combined.css", "w", encoding="utf-8") as f:
    f.write(combined_css)

with open("scratch/examon_index.html", "w", encoding="utf-8") as f:
    f.write(response.body.decode('utf-8', errors='ignore'))

print("Saved scratch/examon_combined.css and scratch/examon_index.html")
