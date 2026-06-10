from . import bp
from flask import request, jsonify
from ..models import Card
from .. import db


@bp.route('/cards', methods=['GET'])
def list_cards():
    from flask import request
    project_id = request.args.get('project_id')
    q = Card.query.filter(Card.deleted == False)
    if project_id:
        from ..models import Deck
        q = q.join(Deck, Card.deck_id == Deck.id).filter(Deck.project_id == project_id)
    cards = q.order_by(Card.updated_at.desc()).all()
    out = []
    for c in cards:
        out.append({'id': c.id, 'fields': c.fields, 'tags': c.tags, 'deck_id': c.deck_id, 'template_id': c.template_id})
    return jsonify(out)


@bp.route('/cards/<int:cid>', methods=['GET'])
def get_card(cid):
    c = Card.query.get_or_404(cid)
    return jsonify({'id': c.id, 'fields': c.fields, 'tags': c.tags, 'deck_id': c.deck_id, 'template_id': c.template_id})


@bp.route('/cards', methods=['POST'])
def create_card():
    data = request.get_json() or {}
    fields = data.get('fields') or {}
    tags = data.get('tags', '')
    deck_id = data.get('deck_id')
    template_id = data.get('template_id')
    c = Card(fields=fields, tags=tags, deck_id=deck_id, template_id=template_id)
    db.session.add(c)
    db.session.commit()
    return jsonify({'id': c.id}), 201


@bp.route('/cards/<int:cid>', methods=['PUT'])
def update_card(cid):
    c = Card.query.get_or_404(cid)
    data = request.get_json() or {}
    c.fields = data.get('fields', c.fields)
    c.tags = data.get('tags', c.tags)
    # allow updating deck/template association
    if 'deck_id' in data:
        c.deck_id = data.get('deck_id')
    if 'template_id' in data:
        c.template_id = data.get('template_id')
    db.session.commit()
    return jsonify({'id': c.id})


@bp.route('/cards/<int:cid>', methods=['DELETE'])
def delete_card(cid):
    c = Card.query.get_or_404(cid)
    # soft-delete
    c.deleted = True
    db.session.commit()
    return jsonify({'deleted': cid})


@bp.route('/cards/batch-delete', methods=['POST'])
def batch_delete():
    data = request.get_json() or {}
    ids = data.get('ids') or []
    if not ids:
        return jsonify({'error': 'no ids provided'}), 400
    cards = Card.query.filter(Card.id.in_(ids)).all()
    for c in cards:
        c.deleted = True
    db.session.commit()
    return jsonify({'deleted': [c.id for c in cards]})


@bp.route('/cards/restore', methods=['POST'])
def restore_cards():
    data = request.get_json() or {}
    ids = data.get('ids') or []
    if not ids:
        return jsonify({'error': 'no ids provided'}), 400
    cards = Card.query.filter(Card.id.in_(ids)).all()
    for c in cards:
        c.deleted = False
    db.session.commit()
    return jsonify({'restored': [c.id for c in cards]})


@bp.route('/cards/permanent-delete', methods=['POST'])
def permanent_delete():
    """Permanently remove cards from the database. Expects JSON { ids: [1,2,3] }"""
    data = request.get_json() or {}
    ids = data.get('ids') or []
    if not ids:
        return jsonify({'error': 'no ids provided'}), 400
    cards = Card.query.filter(Card.id.in_(ids)).all()
    deleted_ids = [c.id for c in cards]
    for c in cards:
        db.session.delete(c)
    db.session.commit()
    return jsonify({'deleted': deleted_ids})
