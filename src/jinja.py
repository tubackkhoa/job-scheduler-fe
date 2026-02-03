from jinja2.sandbox import SandboxedEnvironment
from jinja2 import meta
import inspect
import json
from datetime import datetime, timedelta, timezone


def pick(items, *fields):
    result = []
    for item in items:
        if isinstance(item, dict):
            result.append({f: item.get(f) for f in fields})
        else:
            result.append({f: getattr(item, f, None) for f in fields})
    return result


def in_clause(values):
    return "()" if not values else f"({','.join(map(repr, values))})"


sandbox = SandboxedEnvironment(autoescape=False, trim_blocks=True, lstrip_blocks=True)
sandbox.globals.update(
    {"datetime": datetime, "timedelta": timedelta, "timezone": timezone}
)
sandbox.filters.update(
    {
        "in_clause": in_clause,
        "pick": pick,
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


def render(tpl_str, context, ctx):
    try:
        return sandbox.from_string(tpl_str).render(context, this=context, ctx=ctx)
    except Exception:
        ast = sandbox.parse(tpl_str)
        return meta.find_undeclared_variables(ast)
