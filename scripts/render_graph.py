#!/usr/bin/env python3
"""
Authoritative Cartesian Plane Renderer for IB Examiner
Powered by Python, matplotlib, and numpy.

Generates mathematically exact, scalable SVG vector graphs for functions,
piecewise curves, asymptotes, coordinates, and shaded regions.
"""

import sys
import json
import io
import argparse
import numpy as np

# Ensure headless Agg backend
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator, FuncFormatter

# Use standard clean sans-serif font
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
plt.rcParams['svg.fonttype'] = 'path'  # Ensures fonts render identically everywhere without OS font dependency

SAFE_MATH_NAMESPACE = {
    'np': np,
    'sin': np.sin,
    'cos': np.cos,
    'tan': np.tan,
    'arcsin': np.arcsin,
    'arccos': np.arccos,
    'arctan': np.arctan,
    'sinh': np.sinh,
    'cosh': np.cosh,
    'tanh': np.tanh,
    'exp': np.exp,
    'log': np.log,
    'ln': np.log,
    'log10': np.log10,
    'log2': np.log2,
    'sqrt': np.sqrt,
    'abs': np.abs,
    'pi': np.pi,
    'e': np.e,
}

import re

def parse_color(c):
    """Converts CSS color strings (including rgba and rgb) into matplotlib compatible colors."""
    if not c or c == 'none':
        return 'none'
    if isinstance(c, str):
        c_str = c.strip()
        if c_str.startswith('rgba'):
            m = re.match(r'rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)', c_str)
            if m:
                return (int(m.group(1))/255.0, int(m.group(2))/255.0, int(m.group(3))/255.0, float(m.group(4)))
        if c_str.startswith('rgb('):
            m = re.match(r'rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', c_str)
            if m:
                return (int(m.group(1))/255.0, int(m.group(2))/255.0, int(m.group(3))/255.0)
    return c

THEMES = {
    'exam': {
        'bg_color': '#f8fafc',
        'border_color': '#cbd5e1',
        'axis_color': '#0f172a',
        'grid_major': '#e2e8f0',
        'grid_minor': '#f1f5f9',
        'text_color': '#0f172a',
        'subtext_color': '#64748b',
        'default_curve_color': '#0f172a',
        'asymptote_color': '#cf2d56',
        'shading_color': (0.06, 0.09, 0.16, 0.08),
    },
    'obsidian': {
        'bg_color': '#0c0d0e',
        'border_color': '#222428',
        'axis_color': '#f3f3f2',
        'grid_major': '#222428',
        'grid_minor': '#141517',
        'text_color': '#f3f3f2',
        'subtext_color': '#9b9a95',
        'default_curve_color': '#f54e00',
        'asymptote_color': '#cf2d56',
        'shading_color': (0.96, 0.31, 0.0, 0.15),
    },
    'transparent': {
        'bg_color': 'none',
        'border_color': 'none',
        'axis_color': '#0f172a',
        'grid_major': '#e2e8f0',
        'grid_minor': '#f1f5f9',
        'text_color': '#0f172a',
        'subtext_color': '#64748b',
        'default_curve_color': '#0f172a',
        'asymptote_color': '#cf2d56',
        'shading_color': (0.06, 0.09, 0.16, 0.08),
    }
}

def evaluate_expression(expr_str, x_array):
    """Safely evaluates a math expression using numpy over an array of x values."""
    scope = dict(SAFE_MATH_NAMESPACE)
    scope['x'] = x_array
    
    # Pre-process standard notation
    cleaned = expr_str.strip()
    cleaned = cleaned.replace('^', '**')
    
    try:
        y = eval(cleaned, {'__builtins__': {}}, scope)
        if isinstance(y, (int, float)):
            y = np.full_like(x_array, y)
        return y
    except Exception as e:
        raise ValueError(f"Failed evaluating expression '{expr_str}': {e}")

def render_cartesian_graph(spec):
    """
    Renders a Cartesian plane graph based on the provided dictionary specification
    and returns clean SVG markup.
    """
    theme_name = spec.get('theme', 'exam')
    theme = THEMES.get(theme_name, THEMES['exam'])

    x_range = spec.get('xRange', [-5, 7])
    y_range = spec.get('yRange', [-6, 8])
    x_min, x_max = float(x_range[0]), float(x_range[1])
    y_min, y_max = float(y_range[0]), float(y_range[1])

    x_step = float(spec.get('xStep', 1.0))
    y_step = float(spec.get('yStep', 1.0))
    minor_x_step = spec.get('minorXStep', x_step / 2.0 if x_step >= 2 else None)
    minor_y_step = spec.get('minorYStep', y_step / 2.0 if y_step >= 2 else None)

    width_px = spec.get('width', 520)
    height_px = spec.get('height', 390)
    dpi = 100
    figsize = (width_px / dpi, height_px / dpi)

    fig, ax = plt.subplots(figsize=figsize, dpi=dpi)

    if theme['bg_color'] != 'none':
        fig.patch.set_facecolor(theme['bg_color'])
        ax.set_facecolor(theme['bg_color'])
    else:
        fig.patch.set_alpha(0.0)
        ax.set_facecolor('none')

    # Spines configuration: Authentic cross at origin (0, 0)
    show_axes = spec.get('showAxes', True)
    if show_axes:
        ax.spines['left'].set_position('zero')
        ax.spines['bottom'].set_position('zero')
        ax.spines['right'].set_color('none')
        ax.spines['top'].set_color('none')

        ax.spines['left'].set_color(theme['axis_color'])
        ax.spines['left'].set_linewidth(1.3)
        ax.spines['bottom'].set_color(theme['axis_color'])
        ax.spines['bottom'].set_linewidth(1.3)
    else:
        for spine in ax.spines.values():
            spine.set_color('none')

    # Ticks & Grid
    show_grid = spec.get('grid', True)
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)

    if 'xTicks' in spec and spec['xTicks'] is not None:
        ax.set_xticks(spec['xTicks'])
    else:
        ax.xaxis.set_major_locator(MultipleLocator(x_step))

    if 'yTicks' in spec and spec['yTicks'] is not None:
        ax.set_yticks(spec['yTicks'])
    else:
        ax.yaxis.set_major_locator(MultipleLocator(y_step))

    if minor_x_step:
        ax.xaxis.set_minor_locator(MultipleLocator(minor_x_step))
    if minor_y_step:
        ax.yaxis.set_minor_locator(MultipleLocator(minor_y_step))

    if show_grid:
        ax.grid(True, which='major', color=theme['grid_major'], linestyle='-', linewidth=0.7, zorder=1)
        if minor_x_step or minor_y_step:
            ax.grid(True, which='minor', color=theme['grid_minor'], linestyle=':', linewidth=0.5, zorder=1)

    # Format ticks: clean integer display, hide 0 tick mark so origin label is sole 0
    def format_tick_int(val, pos):
        if np.isclose(val, 0):
            return ''
        if np.isclose(val, round(val)):
            return str(int(round(val)))
        return f"{val:g}"

    ax.xaxis.set_major_formatter(FuncFormatter(format_tick_int))
    ax.yaxis.set_major_formatter(FuncFormatter(format_tick_int))

    # Tick marks formatting: inout direction makes tick marks cleanly cross the axis spine
    ax.tick_params(axis='both', which='major', colors=theme['text_color'], labelsize=9, width=1.0, length=5, direction='inout')
    if minor_x_step or minor_y_step:
        ax.tick_params(axis='both', which='minor', width=0.5, length=2.5, direction='inout')

    # Origin label 'O' or '0'
    origin_label = spec.get('originLabel', '0')
    if origin_label and show_axes and x_min < 0 < x_max and y_min < 0 < y_max:
        ax.text(-0.025 * (x_max - x_min), -0.035 * (y_max - y_min), origin_label,
                fontsize=9.5, color=theme['text_color'], ha='right', va='top', zorder=2)

    # Axis End Arrows and Labels (x, y)
    if show_axes:
        # Arrow heads
        arrow_size = 0.02
        ax.plot(x_max, 0, marker='>', markersize=5, color=theme['axis_color'], clip_on=False, zorder=5)
        ax.plot(0, y_max, marker='^', markersize=5, color=theme['axis_color'], clip_on=False, zorder=5)

        # Labels
        x_label = spec.get('xLabel', 'x')
        y_label = spec.get('yLabel', 'y')
        ax.text(x_max + 0.02 * (x_max - x_min), 0, f"${x_label}$" if not x_label.startswith('$') else x_label,
                fontsize=11, fontweight='normal', color=theme['text_color'], va='center', ha='left', zorder=5)
        ax.text(0, y_max + 0.03 * (y_max - y_min), f"${y_label}$" if not y_label.startswith('$') else y_label,
                fontsize=11, fontweight='normal', color=theme['text_color'], ha='center', va='bottom', zorder=5)

    # 1. Plot Shaded Regions
    for s in spec.get('shading', []):
        sh_domain = s.get('domain', [x_min, x_max])
        sh_color = parse_color(s.get('color', theme['shading_color']))
        sh_x = np.linspace(sh_domain[0], sh_domain[1], 300)
        
        expr_top = s.get('expression', s.get('topExpression', '0'))
        expr_bottom = s.get('bottomExpression', '0')
        y_top = evaluate_expression(expr_top, sh_x)
        y_bottom = evaluate_expression(expr_bottom, sh_x)
        
        ax.fill_between(sh_x, y_bottom, y_top, color=sh_color, label=s.get('label'), zorder=2)

    # 2. Plot Asymptotes (dashed lines)
    for asymp in spec.get('asymptotes', []):
        a_type = asymp.get('type', 'vertical')
        a_val = float(asymp.get('value', 0))
        a_color = parse_color(asymp.get('color', theme['asymptote_color']))
        a_style = asymp.get('style', '--')
        a_width = float(asymp.get('width', 1.2))
        a_label = asymp.get('label')

        if a_type == 'vertical':
            ax.axvline(x=a_val, color=a_color, linestyle=a_style, linewidth=a_width, zorder=3)
            if a_label:
                ax.text(a_val + 0.015 * (x_max - x_min), y_max * 0.85, a_label,
                        color=a_color, fontsize=9, rotation=90, va='center', zorder=4)
        else:
            ax.axhline(y=a_val, color=a_color, linestyle=a_style, linewidth=a_width, zorder=3)
            if a_label:
                ax.text(x_max * 0.75, a_val + 0.02 * (y_max - y_min), a_label,
                        color=a_color, fontsize=9, va='bottom', zorder=4)

    # 3. Plot Continuous Curves
    for curve in spec.get('curves', []):
        expr = curve.get('expression')
        if not expr:
            continue

        domain = curve.get('domain', [x_min, x_max])
        d_min = max(x_min, float(domain[0]))
        d_max = min(x_max, float(domain[1]))
        num_points = int(curve.get('numPoints', 400))
        
        cx = np.linspace(d_min, d_max, num_points)
        cy = evaluate_expression(expr, cx)
        
        # Mask out-of-bounds or infinite values (e.g. asymptotes)
        cy_masked = np.ma.masked_invalid(cy)
        
        c_color = parse_color(curve.get('color', theme['default_curve_color']))
        c_style = curve.get('style', '-')
        c_width = float(curve.get('width', 2.0))
        c_label = curve.get('label')

        ax.plot(cx, cy_masked, linestyle=c_style, color=c_color, linewidth=c_width,
                label=c_label, zorder=4)

    # 4. Plot Piecewise Functions
    for pw in spec.get('piecewise', []):
        p_color = parse_color(pw.get('color', theme['default_curve_color']))
        p_width = float(pw.get('width', 2.0))
        p_style = pw.get('style', '-')
        p_label = pw.get('label')
        first_piece = True

        for piece in pw.get('pieces', []):
            expr = piece.get('expression')
            domain = piece.get('domain', [x_min, x_max])
            d_min = float(domain[0])
            d_max = float(domain[1])
            px = np.linspace(d_min, d_max, 250)
            py = evaluate_expression(expr, px)
            
            lbl = p_label if first_piece else None
            first_piece = False
            ax.plot(px, py, linestyle=p_style, color=p_color, linewidth=p_width, label=lbl, zorder=4)

    # 5. Plot Key Points (Endpoints, Vertices, Intercepts)
    for pt in spec.get('points', []):
        x = float(pt.get('x', 0))
        y = float(pt.get('y', 0))
        pt_type = pt.get('type', 'solid')  # 'solid' or 'open'
        pt_color = parse_color(pt.get('color', theme['default_curve_color']))
        pt_size = float(pt.get('size', 6))
        pt_label = pt.get('label')
        
        if pt_type == 'open':
            ax.plot(x, y, marker='o', markersize=pt_size,
                    markerfacecolor=theme['bg_color'] if theme['bg_color'] != 'none' else 'white',
                    markeredgecolor=pt_color, markeredgewidth=1.6, zorder=6)
        else:
            ax.plot(x, y, marker='o', markersize=pt_size,
                    markerfacecolor=pt_color, markeredgecolor=pt_color, zorder=6)

        if pt_label:
            offset_x = float(pt.get('offsetX', 0.02 * (x_max - x_min)))
            offset_y = float(pt.get('offsetY', 0.03 * (y_max - y_min)))
            ax.text(x + offset_x, y + offset_y, pt_label,
                    fontsize=9, color=parse_color(theme['text_color']), fontweight='normal',
                    ha=pt.get('ha', 'left'), va=pt.get('va', 'bottom'), zorder=7)

    # 6. Text Annotations
    for ann in spec.get('annotations', []):
        ax.text(float(ann['x']), float(ann['y']), ann['text'],
                fontsize=float(ann.get('fontsize', 10)),
                color=parse_color(ann.get('color', theme['text_color'])),
                fontweight=ann.get('fontweight', 'normal'),
                ha=ann.get('ha', 'left'), va=ann.get('va', 'bottom'), zorder=7)

    # Title
    if spec.get('title'):
        ax.set_title(spec['title'], fontsize=11, color=theme['text_color'], pad=12, fontweight='normal')

    # Export SVG
    buffer = io.StringIO()
    plt.savefig(buffer, format='svg', bbox_inches='tight', pad_inches=0.08)
    plt.close(fig)

    svg_markup = buffer.getvalue()

    # Strip unnecessary XML declaration to make it cleanly embeddable
    if '<?xml' in svg_markup:
        svg_markup = svg_markup[svg_markup.find('<svg'):]

    # Make SVG responsive: ensure width="100%" and height="auto" while preserving viewBox
    svg_markup = re.sub(r'(<svg\b[^>]*?)\s+width="[^"]*"', r'\1 width="100%"', svg_markup, count=1)
    svg_markup = re.sub(r'(<svg\b[^>]*?)\s+height="[^"]*"', r'\1 height="auto"', svg_markup, count=1)

    return svg_markup

def main():
    parser = argparse.ArgumentParser(description="Render Cartesian Plane SVGs for IB Examiner")
    parser.add_argument('--spec', type=str, help="JSON string of graph specification")
    parser.add_argument('--file', type=str, help="Path to JSON file with graph specification")
    parser.add_argument('--output', type=str, help="Path to save output SVG (defaults to stdout)")
    parser.add_argument('--stdin', action='store_true', help="Read JSON specification from stdin")

    args = parser.parse_args()

    spec = None
    if args.spec:
        spec = json.loads(args.spec)
    elif args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            spec = json.load(f)
    elif args.stdin or not sys.stdin.isatty():
        raw = sys.stdin.read()
        if raw.strip():
            spec = json.loads(raw)

    if not spec:
        parser.print_help()
        sys.exit(1)

    try:
        svg_out = render_cartesian_graph(spec)
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as out_f:
                out_f.write(svg_out)
            print(f"Successfully wrote SVG to {args.output}", file=sys.stderr)
        else:
            sys.stdout.write(svg_out)
    except Exception as err:
        sys.stderr.write(f"Error rendering graph: {err}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
