from jinja2.sandbox import SandboxedEnvironment
from jinja2 import meta
from datetime import datetime, timedelta, timezone


def _get_value(item, path):
    parts = path.split(".")
    current = item

    for part in parts:
        if current is None:
            return None
        if isinstance(current, dict):
            current = current.get(part)
        else:
            current = getattr(current, part, None)

    return current


def _set_nested(target, path, value):
    parts = path.split(".")
    current = target

    for part in parts[:-1]:
        current = current.setdefault(part, {})

    current[parts[-1]] = value


def pick(items, *fields):
    result = []

    for item in items:
        picked = {}
        for field in fields:
            value = _get_value(item, field)
            _set_nested(picked, field, value)
        result.append(picked)

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


def render(tpl_str, context, ctx):
    try:
        return sandbox.from_string(tpl_str).render(context, this=context, ctx=ctx)
    except Exception:
        ast = sandbox.parse(tpl_str)
        return meta.find_undeclared_variables(ast)
