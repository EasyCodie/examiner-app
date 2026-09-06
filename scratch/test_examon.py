from scrapling.fetchers import Fetcher

try:
    response = Fetcher.get('https://www.examon.ai/', impersonate='chrome', stealthy_headers=True)
    print("Status:", response.status)
    print("Title:", response.css('title::text').get())
    css_links = response.css('link[rel="stylesheet"]::attr(href)').getall()
    print(f"Found {len(css_links)} stylesheets:")
    for link in css_links:
        print(" -", link)
except Exception as e:
    print("Fetcher.get error:", e)
