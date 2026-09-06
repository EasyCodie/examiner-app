import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from scrapling.fetchers import DynamicFetcher
from scrapling.parser import Selector

team_page = DynamicFetcher.fetch('https://www.examon.ai/team', headless=True, network_idle=True)
with open("scratch/examon_team.html", "w", encoding="utf-8") as f:
    f.write(team_page.body.decode('utf-8', errors='ignore'))

sel = Selector(team_page.body.decode('utf-8', errors='ignore'))
print("Team page title:", sel.css('title::text').get())
h1s = sel.css('h1::text').getall()
print("H1s:", h1s)
h2s = sel.css('h2::text').getall()
print("H2s:", h2s)
