import re
import json

with open("scratch/examon_combined.css", "r", encoding="utf-8") as f:
    css = f.read()

# 1. Find root variables
root_vars = re.findall(r'--([a-zA-Z0-9\-_]+)\s*:\s*([^;{}]+);', css)
vars_dict = {}
for k, v in root_vars:
    vars_dict[k] = v.strip()

print(f"Total CSS variables found: {len(vars_dict)}")
for k in sorted(vars_dict.keys())[:50]:
    print(f"  --{k}: {vars_dict[k]}")

# 2. Font faces
font_faces = re.findall(r'@font-face\s*{([^}]+)}', css)
print(f"\nFont faces found: {len(font_faces)}")
for ff in font_faces[:5]:
    print("  @font-face:", ff.strip())

# 3. Check for tailwind / shadcn variables (like --background, --foreground, --primary, --radius)
shadcn_keys = [k for k in vars_dict if any(x in k for x in ['background', 'foreground', 'primary', 'secondary', 'muted', 'accent', 'destructive', 'border', 'input', 'ring', 'radius', 'card', 'popover', 'chart', 'sidebar'])]
print(f"\nDesign token matches (shadcn/tailwind tokens): {len(shadcn_keys)}")
for k in shadcn_keys:
    print(f"  --{k}: {vars_dict[k]}")
