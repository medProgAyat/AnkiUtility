import json
import pytest
from backend.app import create_app, db
from backend.app.models import Card


@pytest.fixture
def app():
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_health(client):
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json.get('status') == 'ok'


def test_create_and_list_card(client):
    payload = {'fields': {'Front': 'Q1', 'Back': 'A1'}, 'tags': 'test'}
    r = client.post('/api/cards', data=json.dumps(payload), content_type='application/json')
    assert r.status_code == 201
    data = r.get_json()
    cid = data['id']

    # list
    r2 = client.get('/api/cards')
    assert r2.status_code == 200
    cards = r2.get_json()
    assert any(c['id'] == cid for c in cards)

    # get
    r3 = client.get(f'/api/cards/{cid}')
    assert r3.status_code == 200
    c = r3.get_json()
    assert c['fields']['Front'] == 'Q1'
