from . import bp
from flask import request, send_file, jsonify
from io import BytesIO
import genanki
from ..models import Card, Template, Deck


@bp.route('/export/json', methods=['POST'])
def export_json():
    data = request.get_json() or {}
    ids = data.get('ids') or []
    cards = Card.query.filter(Card.id.in_(ids)).filter(Card.deleted == False).all()
    out = []
    for c in cards:
        out.append({'id': c.id, 'fields': c.fields, 'tags': c.tags})
    return jsonify({'cards': out})


@bp.route('/export/apkg', methods=['POST'])
def export_apkg():
    data = request.get_json() or {}
    ids = data.get('ids') or []
    project_id = data.get('project_id')

    if project_id:
        # export all cards under project (exclude deleted)
        cards = Card.query.join(Deck, Card.deck_id == Deck.id).filter(Deck.project_id == project_id).filter(Card.deleted == False).all()
    else:
        cards = Card.query.filter(Card.id.in_(ids)).filter(Card.deleted==False).all()

    if not cards:
        return jsonify({'error': 'no cards found'}), 400

    # Build a simple model using union of field keys
    field_names = []
    fn_set = set()
    for c in cards:
        for k in c.fields.keys():
            if k not in fn_set:
                fn_set.add(k)
                field_names.append(k)

    model = genanki.Model(
        1607392319,
        'AnkiUtilityModel',
        fields=[{'name': n} for n in field_names],
        templates=[{
            'name': 'Card 1',
            'qfmt': ' '.join(['{{%s}}' % n for n in field_names]),
            'afmt': '{{FrontSide}}<hr id="answer">' + ' '.join(['{{%s}}' % n for n in field_names])
        }]
    )

    deck = genanki.Deck(2059400110, 'AnkiUtility Export')
    for c in cards:
        note_fields = [c.fields.get(n, '') for n in field_names]
        note = genanki.Note(model=model, fields=note_fields, tags=(c.tags or '').split())
        deck.add_note(note)

    # write to temp file and send
    tmp_path = f'/tmp/anki_export_{project_id or "ids"}.apkg'
    package = genanki.Package(deck)
    package.write_to_file(tmp_path)
    return send_file(tmp_path, as_attachment=True, download_name='anki_export.apkg')
