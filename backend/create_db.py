from app import create_app, db
from app.models import Deck, Template, Card

app = create_app()

with app.app_context():
    db.create_all()
    # create a default project, deck and template if none exist
    if not Project.query.first():
        p = Project(name='Default Project')
        db.session.add(p)
        db.session.flush()
        d = Deck(name='Default Deck', project_id=p.id)
        db.session.add(d)
        db.session.commit()
    if not Template.query.first():
        # attach to first deck
        first_deck = Deck.query.first()
        t = Template(name='Basic', deck_id=(first_deck.id if first_deck else None), html='<div>{{Front}}</div><div>{{Back}}</div>', css='')
        db.session.add(t)
        db.session.commit()
    print('DB initialized')
