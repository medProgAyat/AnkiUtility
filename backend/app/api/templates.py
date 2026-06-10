from . import bp
from flask import request, jsonify
from ..models import Template, Deck
from .. import db


@bp.route('/templates', methods=['GET'])
def list_templates():
    project_id = request.args.get('project_id')
    q = Template.query
    if project_id:
        # join decks to filter by project
        q = q.join(Deck, Template.deck_id == Deck.id).filter(Deck.project_id == project_id)
    templates = q.order_by(Template.created_at.desc()).all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'html': t.html,
        'css': t.css,
        'deck_id': t.deck_id
    } for t in templates])


@bp.route('/templates', methods=['POST'])
def create_template():
    data = request.get_json() or {}
    name = data.get('name', 'Unnamed')
    html = data.get('html', '')
    css = data.get('css', '')
    deck_id = data.get('deck_id')
    t = Template(name=name, html=html, css=css, deck_id=deck_id)
    db.session.add(t)
    db.session.commit()
    return jsonify({'id': t.id}), 201


@bp.route('/templates/<int:tid>', methods=['PUT'])
def update_template(tid):
    t = Template.query.get_or_404(tid)
    data = request.get_json() or {}
    t.name = data.get('name', t.name)
    t.html = data.get('html', t.html)
    t.css = data.get('css', t.css)
    db.session.commit()
    return jsonify({'id': t.id})


@bp.route('/templates/<int:tid>', methods=['DELETE'])
def delete_template(tid):
    t = Template.query.get_or_404(tid)
    db.session.delete(t)
    db.session.commit()
    return jsonify({'deleted': tid})
