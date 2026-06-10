from . import bp
from flask import jsonify, request
from ..models import Deck


@bp.route('/decks', methods=['GET'])
def list_decks():
    project_id = request.args.get('project_id')
    q = Deck.query
    if project_id:
        q = q.filter_by(project_id=project_id)
    decks = q.order_by(Deck.created_at.asc()).all()
    return jsonify([{'id': d.id, 'name': d.name, 'project_id': d.project_id} for d in decks])


@bp.route('/decks', methods=['POST'])
def create_deck():
    data = request.get_json() or {}
    name = data.get('name') or 'New Deck'
    project_id = data.get('project_id')
    d = Deck(name=name, project_id=project_id)
    from .. import db
    db.session.add(d)
    db.session.commit()
    return jsonify({'id': d.id}), 201


@bp.route('/decks/<int:did>', methods=['DELETE'])
def delete_deck(did):
    from .. import db
    d = Deck.query.get_or_404(did)
    db.session.delete(d)
    db.session.commit()
    return jsonify({'deleted': did})
