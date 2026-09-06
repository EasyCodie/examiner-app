from scrapling.fetchers import DynamicFetcher, StealthyFetcher

print("Fetching with DynamicFetcher...")
page = DynamicFetcher.fetch('https://www.examon.ai/', headless=True, network_idle=True)
print("Title:", page.css('title::text').get())
a_tags = page.css('a')
btn_tags = page.css('button')
print(f"DynamicFetcher found {len(a_tags)} <a> tags and {len(btn_tags)} <button> tags")

with open("scratch/examon_dynamic.html", "w", encoding="utf-8") as f:
    f.write(page.body.decode('utf-8', errors='ignore'))

print("Saved scratch/examon_dynamic.html")
