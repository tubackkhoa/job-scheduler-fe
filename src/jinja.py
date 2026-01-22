from jinja2.sandbox import SandboxedEnvironment
from jinja2 import meta
import inspect
import json
from datetime import datetime, timedelta, timezone


def tolist(obj, *include):
    if include:
        include_set = set(include)
        return [
            {k: v for k, v in item.to_dict().items() if k in include_set}
            for item in obj
        ]
    return [item.to_dict() for item in obj]


sandbox = SandboxedEnvironment(autoescape=False, trim_blocks=True, lstrip_blocks=True)
sandbox.globals.update(
    {"datetime": datetime, "timedelta": timedelta, "timezone": timezone}
)
sandbox.filters.update(
    {
        "in_clause": lambda values: (
            "()" if not values else f"({','.join(map(repr, values))})"
        ),
        "tolist": tolist,
    }
)


def describe_callable(obj):
    if callable(obj):
        try:
            signature = str(inspect.signature(obj))
        except (ValueError, TypeError):
            signature = None

        return {
            "type": "function",
            "doc": inspect.getdoc(obj),
            "signature": signature,
        }

    try:
        cls = obj if isinstance(obj, type) else type(obj)
        doc = f"{cls.__module__}.{cls.__qualname__}"
    except Exception:
        doc = str(obj)

    return {
        "type": "variable",
        "doc": doc,
    }


doc_json = json.dumps(
    {
        "globals": {
            name: describe_callable(value) for name, value in sandbox.globals.items()
        },
        "filters": {
            name: describe_callable(value) for name, value in sandbox.filters.items()
        },
        "tests": tuple(sandbox.tests),
        "tags": [
            tag
            for ext in sandbox.extensions.values()
            for tag in getattr(ext, "tags", ())
        ],
    }
)


def render(tpl_str, context):
    try:
        return sandbox.from_string(tpl_str).render(context, this=context)
    except Exception:
        ast = sandbox.parse(tpl_str)
        return meta.find_undeclared_variables(ast)
