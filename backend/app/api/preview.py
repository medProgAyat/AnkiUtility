from . import bp
from flask import request, jsonify
from jinja2 import Template as JinjaTemplate


DEFAULT_ANKI_CSS = """
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background: transparent; }
.anki-card { max-width: 520px; margin: 24px auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); background: #fff; }
.anki-card .front { font-size: 24px; font-weight: 600; margin-bottom: 12px }
.anki-card .back { font-size: 20px; color: #333 }
img { max-width: 100%; height: auto }
"""


def _split_front_back(rendered: str):
    # Prefer explicit hr answer split used by genanki style
    if '<hr id="answer">' in rendered:
        front, back = rendered.split('<hr id="answer">', 1)
        return front, back
    # Support explicit marker
    if '<!--SPLIT-->' in rendered:
        front, back = rendered.split('<!--SPLIT-->', 1)
        return front, back
    # Fallback: split after first top-level closing tag (</div> or </p>)
    for tag in ['</div>', '</p>', '<br>']:
        idx = rendered.find(tag)
        if idx != -1:
            split_at = idx + len(tag)
            return rendered[:split_at], rendered[split_at:]
    # Nothing to split
    return rendered, ''


@bp.route('/preview', methods=['POST'])
def preview():
    data = request.get_json() or {}
    html = data.get('html', '')
    css = data.get('css', '')
    fields = data.get('fields', {})

    try:
        tpl = JinjaTemplate(html)
        rendered = tpl.render(**fields)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    combined_css = DEFAULT_ANKI_CSS + '\n' + (css or '')
    front_content, back_content = _split_front_back(rendered)

    front_full = f"<html><head><style>{combined_css}</style></head><body><div class=\"anki-card\"><div class=\"front\">{front_content}</div></div></body></html>"
    back_full = f"<html><head><style>{combined_css}</style></head><body><div class=\"anki-card\"><div class=\"back\">{back_content}</div></div></body></html>"
    full = f"<html><head><style>{combined_css}</style></head><body><div class=\"anki-card\">{rendered}</div></body></html>"

    return jsonify({'html': full, 'front_html': front_full, 'back_html': back_full})
