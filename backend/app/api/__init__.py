from flask import Blueprint

bp = Blueprint("api", __name__)

# import routes to register them on blueprint
from . import cards  # noqa: F401
from . import templates  # noqa: F401
from . import imports  # noqa: F401
from . import preview  # noqa: F401
from . import export  # noqa: F401
from . import decks  # noqa: F401
from . import projects  # noqa: F401
