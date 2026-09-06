import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import re

with open("scratch/examon_combined.css", "r", encoding="utf-8") as f:
    css = f.read()

# 1. Look for typography custom utilities (p-*, h1-*, h2-*, etc.)
custom_typography = re.findall(r'(\.(?:h[1-6]|p)-(?:bold|semibold|medium|regular|light)[^{]*)\{([^}]+)\}', css)
print("--- CUSTOM TYPOGRAPHY UTILITIES ---")
for sel, rules in custom_typography:
    print(f"{sel} {{ {rules.strip()} }}")

# 2. Look for background patterns (bg-dotted-pattern, etc.)
patterns = re.findall(r'(\.bg-[a-zA-Z0-9\-_/]+)\{([^}]+)\}', css)
print("\n--- BG PATTERNS / CUSTOM BG ---")
for sel, rules in patterns:
    if any(x in rules for x in ['url(', 'radial-gradient', 'linear-gradient', 'image']):
        print(f"{sel} {{ {rules.strip()} }}")

# 3. Look for buttons and variants (.btn or button classes)
# In Tailwind, let's see classes containing 'rounded-full', 'p-medium-14', etc.

# 4. Color definitions in CSS - HSL conversions
hsl_tokens = {
    "--primary": "132 25% 20%",
    "--primary-50": "107 82% 98%",
    "--primary-100": "72 33% 94%",
    "--primary-500": "129 10% 36%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "106 79% 63%",
    "--secondary-500": "106 79% 93%",
    "--secondary-foreground": "var(--primary)",
    "--pop": "47 98% 59%",
    "--pop-foreground": "var(--primary)",
    "--background": "0 0% 100%",
    "--foreground": "0 0% 0%",
    "--card": "0 0% 100%",
    "--card-foreground": "0 0% 13%",
    "--muted": "0 0% 96%",
    "--muted-foreground": "0 0% 40%",
    "--accent": "0 0% 94%",
    "--accent-foreground": "var(--foreground)",
    "--border": "0 0% 92%",
    "--border-hover": "0 0% 80%",
    "--input": "0 0% 81%",
    "--destructive": "0 98% 59%",
    "--destructive-foreground": "0 0% 100%",
    "--sidebar-background": "240 5.9% 10%",
    "--sidebar-foreground": "240 4.8% 95.9%",
    "--sidebar-primary": "224.3 76.3% 48%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-accent": "240 3.7% 15.9%",
    "--sidebar-accent-foreground": "240 4.8% 95.9%",
    "--sidebar-border": "240 3.7% 15.9%",
    "--sidebar-ring": "217.2 91.2% 59.8%",
    "--status-blue": "212 53% 73%",
    "--status-blue-100": "214 100% 97%",
    "--status-green": "116 100% 25%",
    "--status-green-100": "141 84% 93%",
    "--status-red": "0 100% 50%",
    "--status-red-100": "0 86% 97%",
    "--status-yellow": "47 98% 59%",
    "--status-yellow-100": "55 92% 95%",
}

def hsl_to_hex(h, s, l):
    s /= 100.0
    l /= 100.0
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c / 2
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return f"#{int((r + m) * 255):02x}{int((g + m) * 255):02x}{int((b + m) * 255):02x}"

print("\n--- TOKEN COLOR MAPPINGS ---")
for token, val in hsl_tokens.items():
    parts = val.replace('%', '').split()
    if len(parts) == 3 and not 'var' in val:
        try:
            h, s, l = float(parts[0]), float(parts[1]), float(parts[2])
            hex_val = hsl_to_hex(h, s, l)
            print(f"{token:30} hsl({val}) -> {hex_val}")
        except:
            print(f"{token:30} {val}")
    else:
        print(f"{token:30} {val}")
