from . import bp
from flask import request, jsonify
import pandas as pd
from ..models import Card, Deck, Template
from .. import db

import zipfile
import tempfile
import sqlite3
import json
import os


@bp.route('/imports/upload', methods=['POST'])
def upload_csv():
    f = request.files.get('file')
    if not f:
        return jsonify({'error': 'no file'}), 400
    try:
        df = pd.read_csv(f)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    cols = list(df.columns)
    sample = df.head(5).to_dict(orient='records')
    # include up to 500 rows for preview/apply (protect against huge files)
    rows = df.head(500).to_dict(orient='records')
    return jsonify({'columns': cols, 'sample': sample, 'rows': rows})


@bp.route('/imports/apply', methods=['POST'])
def apply_import():
    # Accept either:
    #  - JSON: { rows: [...], mapping: { csv_col: field_name }, deck_id, template_id }
    #  - JSON: { mapped_rows: [...], deck_id, template_id }  (each mapped_row is dict of field_name -> value)
    data = request.get_json() or {}
    rows = data.get('rows') or []
    mapping = data.get('mapping') or {}
    mapped_rows = data.get('mapped_rows')
    deck_id = data.get('deck_id')
    template_id = data.get('template_id')
    created = []

    if mapped_rows is not None:
        # directly use provided mapped rows
        for mr in mapped_rows:
            fields = mr or {}
            c = Card(deck_id=deck_id, template_id=template_id, fields=fields)
            db.session.add(c)
            db.session.flush()
            created.append(c.id)
        db.session.commit()
        return jsonify({'created': created})

    # fallback to csv rows + mapping
    for r in rows:
        fields = {}
        for csv_col, field_name in mapping.items():
            fields[field_name] = r.get(csv_col)
        c = Card(deck_id=deck_id, template_id=template_id, fields=fields)
        db.session.add(c)
        db.session.flush()
        created.append(c.id)
    db.session.commit()
    return jsonify({'created': created})


@bp.route('/imports/apkg', methods=['POST'])
def import_apkg():
    """Upload an .apkg (Anki package) and import decks/templates/notes into the DB.
    Optional JSON field: project_id to associate created decks with a project.
    Returns summary with counts and sample notes.
    """
    f = request.files.get('file')
    if not f:
        return jsonify({'error': 'no file'}), 400
    project_id = request.form.get('project_id') or request.args.get('project_id')
    # save uploaded file to temp
    tmpdir = tempfile.mkdtemp()
    conn = None
    try:
        path = os.path.join(tmpdir, 'upload.apkg')
        f.save(path)
        # extract collection.anki2
        with zipfile.ZipFile(path, 'r') as z:
            namelist = z.namelist()
            cand = None
            for n in namelist:
                if n.endswith('collection.anki2'):
                    cand = n
                    break
            if not cand:
                return jsonify({'error': 'collection.anki2 not found in apkg'}), 400
            z.extract(cand, tmpdir)
            coll_path = os.path.join(tmpdir, cand)
        # open sqlite db
        conn = sqlite3.connect(coll_path)
        cur = conn.cursor()
        # read col table to get models and decks JSON
        cur.execute("PRAGMA table_info('col')")
        cols = cur.fetchall()
        col_names = [c[1] for c in cols]
        cur.execute('SELECT * FROM col')
        row = cur.fetchone()
        if not row:
            return jsonify({'error': 'col table empty'}), 400
        rowd = dict(zip(col_names, row))
        models_json = rowd.get('models')
        decks_json = rowd.get('decks')
        try:
            models = json.loads(models_json) if models_json else {}
        except Exception:
            models = {}
        try:
            decks = json.loads(decks_json) if decks_json else {}
        except Exception:
            decks = {}

        # create mapping from anki model id to Template.id
        model_to_template = {}
        for mid, m in models.items():
            try:
                name = m.get('name') or f"Model {mid}"
                html = ''
                css = m.get('css') or ''
                # pick first template qfmt as html
                tmpls = m.get('tmpls') or m.get('tmpl') or []
                if isinstance(tmpls, list) and len(tmpls):
                    html = tmpls[0].get('qfmt','')
                elif isinstance(m.get('tmpls'), dict):
                    # handle possible dict
                    first = list(m.get('tmpls').values())[0]
                    html = first.get('qfmt','')
                tpl = Template(deck_id=None, name=name[:180], html=html, css=css)
                db.session.add(tpl)
                db.session.flush()
                model_to_template[mid] = tpl.id
            except Exception:
                continue

        # create mapping from anki deck id to Deck.id
        deck_to_deck = {}
        for did, d in decks.items():
            try:
                dname = d.get('name') or f"Deck {did}"
                deck = Deck(project_id=project_id, name=dname[:180])
                db.session.add(deck)
                db.session.flush()
                deck_to_deck[int(did)] = deck.id
            except Exception:
                continue

        # read notes and cards
        cur.execute('SELECT id, guid, mid, tags, flds FROM notes')
        notes = cur.fetchall()
        created_cards = []
        sample = []
        for nid, guid, mid, tags, flds in notes:
            try:
                mid = str(mid)
                model = models.get(mid) or {}
                field_defs = model.get('flds') or []
                field_names = [fd.get('name') for fd in field_defs]
                # fields separated by 0x1f
                values = flds.split('\x1f') if isinstance(flds, str) else []
                fields = {}
                for i, name in enumerate(field_names):
                    if name:
                        fields[name] = values[i] if i < len(values) else ''
                # find deck id via cards table (first card for this note)
                cur.execute('SELECT did FROM cards WHERE nid = ? LIMIT 1', (nid,))
                c_row = cur.fetchone()
                our_deck_id = None
                if c_row:
                    try:
                        anki_did = int(c_row[0])
                        our_deck_id = deck_to_deck.get(anki_did)
                    except Exception:
                        our_deck_id = None
                # find template id mapping
                tpl_id = model_to_template.get(mid)
                card = Card(deck_id=our_deck_id, template_id=tpl_id, fields=fields, tags=(tags or ''))
                db.session.add(card)
                db.session.flush()
                created_cards.append(card.id)
                if len(sample) < 5:
                    sample.append({'id': card.id, 'fields': fields, 'tags': tags})
            except Exception:
                continue
        db.session.commit()
        return jsonify({'created_cards': created_cards, 'created_templates': list(model_to_template.values()), 'created_decks': list(deck_to_deck.values()), 'sample': sample})
    finally:
        try:
            conn.close()
        except Exception:
            pass
        # clean up tmp
        try:
            os.remove(path)
        except Exception:
            pass
        try:
            # remove extracted files
            if os.path.exists(tmpdir):
                for root, dirs, files in os.walk(tmpdir, topdown=False):
                    for name in files:
                        os.remove(os.path.join(root, name))
                    for name in dirs:
                        os.rmdir(os.path.join(root, name))
                os.rmdir(tmpdir)
        except Exception:
            pass
