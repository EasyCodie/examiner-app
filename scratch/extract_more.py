import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import re

with open("scratch/examon_combined.css", "r", encoding="utf-8") as f:
    css = f.read()

# 1. CVA button variants or button classes
btn_matches = re.findall(r'(\.[a-zA-Z0-9\-_:]*btn[a-zA-Z0-9\-_:]*)\{([^}]+)\}', css)
print(f"Direct btn matches: {len(btn_matches)}")

# Search for classes that look like button or badge components
variants = {}
for m in re.finditer(r'(bg-secondary|bg-primary|bg-white|bg-destructive|bg-muted)[^"]*', css):
    pass

# Search for animation utilities and transitions
transitions = set(re.findall(r'transition(?:-[a-zA-Z]+)?:\s*([^;{}]+)', css))
print(f"\nTransitions: {len(transitions)}")
for t in list(transitions)[:10]:
    print(" ", t.strip())

# Extract keyframe details
for kf_name in ['accordion-down', 'accordion-up', 'card-pulse', 'bounce-once', 'circular-rotate']:
    m = re.search(r'@keyframes\s+' + kf_name + r'\s*\{([^}]+(?:\{[^}]+\}[^}]*)*)\}', css)
    if m:
        print(f"\nKeyframe {kf_name}:\n{m.group(1).strip()}")

# Extract layout breakpoints
screens = re.findall(r'@media\s*\(([^\)]+)\)', css)
print("\nUnique media query conditions:", set(screens)[:15])
