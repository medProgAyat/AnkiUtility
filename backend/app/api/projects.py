from . import bp
from flask import request, jsonify
from ..models import Project, Deck
from .. import db


@bp.route('/projects', methods=['GET'])
def list_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify([{'id': p.id, 'name': p.name} for p in projects])


@bp.route('/projects', methods=['POST'])
def create_project():
    data = request.get_json() or {}
    name = data.get('name') or 'New Project'
    proj = Project(name=name)
    db.session.add(proj)
    db.session.flush()
    # create a default deck for the project
    d = Deck(name='Default', project_id=proj.id)
    db.session.add(d)
    db.session.commit()
    return jsonify({'id': proj.id, 'default_deck_id': d.id}), 201


@bp.route('/projects/<int:pid>', methods=['DELETE'])
def delete_project(pid):
    # delete project and all decks/cards/templates under it
    p = Project.query.get_or_404(pid)
    # delete decks, templates, and cards via cascade assumptions; do manual deletes to be safe
    Deck.query.filter_by(project_id=p.id).delete()
    db.session.delete(p)
    db.session.commit()
    return jsonify({'deleted': pid})
