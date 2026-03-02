export default {
  globals: {
    range: {
      type: 'function',
      doc: "A range that can't generate ranges with a length of more than\nMAX_RANGE items.",
      signature: '(*args: int) -> range',
    },
    dict: {
      type: 'function',
      doc: "dict() -> new empty dictionary\ndict(mapping) -> new dictionary initialized from a mapping object's\n    (key, value) pairs\ndict(iterable) -> new dictionary initialized as if via:\n    d = {}\n    for k, v in iterable:\n        d[k] = v\ndict(**kwargs) -> new dictionary initialized with the name=value pairs\n    in the keyword argument list.  For example:  dict(one=1, two=2)",
      signature: null,
    },
    lipsum: {
      type: 'function',
      doc: 'Generate some lorem ipsum for the template.',
      signature:
        '(n: int = 5, html: bool = True, min: int = 20, max: int = 100) -> str',
    },
    cycler: {
      type: 'function',
      doc: 'Cycle through values by yield them one at a time, then restarting\nonce the end is reached. Available as ``cycler`` in templates.\n\nSimilar to ``loop.cycle``, but can be used outside loops or across\nmultiple loops. For example, render a list of folders and files in a\nlist, alternating giving them "odd" and "even" classes.\n\n.. code-block:: html+jinja\n\n    {% set row_class = cycler("odd", "even") %}\n    <ul class="browser">\n    {% for folder in folders %}\n      <li class="folder {{ row_class.next() }}">{{ folder }}\n    {% endfor %}\n    {% for file in files %}\n      <li class="file {{ row_class.next() }}">{{ file }}\n    {% endfor %}\n    </ul>\n\n:param items: Each positional argument will be yielded in the order\n    given for each cycle.\n\n.. versionadded:: 2.1',
      signature: '(*items: Any) -> None',
    },
    joiner: {
      type: 'function',
      doc: 'A joining helper for templates.',
      signature: "(sep: str = ', ') -> None",
    },
    namespace: {
      type: 'function',
      doc: 'A namespace object that can hold arbitrary attributes.  It may be\ninitialized from a dictionary or with keyword arguments.',
      signature: '(*args: Any, **kwargs: Any) -> None',
    },
    datetime: {
      type: 'function',
      doc: 'datetime(year, month, day[, hour[, minute[, second[, microsecond[,tzinfo]]]]])\n\nThe year, month and day arguments are required. tzinfo may be None, or an\ninstance of a tzinfo subclass. The remaining arguments may be ints.',
      signature: null,
    },
    timedelta: {
      type: 'function',
      doc: 'Difference between two datetime values.\n\ntimedelta(days=0, seconds=0, microseconds=0, milliseconds=0, minutes=0, hours=0, weeks=0)\n\nAll arguments are optional and default to 0.\nArguments may be integers or floats, and may be positive or negative.',
      signature: null,
    },
    timezone: {
      type: 'function',
      doc: 'Fixed offset from UTC implementation of tzinfo.',
      signature: null,
    },
    this: {
      type: 'variable',
      doc: 'The payload object passed to the render function.',
    },
    ctx: {
      type: 'variable',
      doc: 'Execution context for the current render',
    },
    dao: {
      type: 'variable',
      doc: 'models.DAO',
    },
    util: {
      type: 'variable',
      doc: 'utils.job.JobUtil',
    },
    fetch_data: {
      type: 'function',
      doc: null,
      signature: '(ctx: enforcer.ExecutionContext)',
    },
    MyClass: {
      type: 'function',
      doc: null,
      signature: '(name)',
    },
    get_users: {
      type: 'function',
      doc: null,
      signature: '()',
    },
    get_cities_by_country: {
      type: 'function',
      doc: null,
      signature: '(country_name)',
    },
  },
  filters: {
    abs: {
      type: 'function',
      doc: 'Return the absolute value of the argument.',
      signature: '(x, /)',
    },
    attr: {
      type: 'function',
      doc: 'Get an attribute of an object.  ``foo|attr("bar")`` works like\n``foo.bar`` just that always an attribute is returned and items are not\nlooked up.\n\nSee :ref:`Notes on subscriptions <notes-on-subscriptions>` for more details.',
      signature:
        "(environment: 'Environment', obj: Any, name: str) -> Union[jinja2.runtime.Undefined, Any]",
    },
    batch: {
      type: 'function',
      doc: "A filter that batches items. It works pretty much like `slice`\njust the other way round. It returns a list of lists with the\ngiven number of items. If you provide a second parameter this\nis used to fill up missing items. See this example:\n\n.. sourcecode:: html+jinja\n\n    <table>\n    {%- for row in items|batch(3, '&nbsp;') %}\n      <tr>\n      {%- for column in row %}\n        <td>{{ column }}</td>\n      {%- endfor %}\n      </tr>\n    {%- endfor %}\n    </table>",
      signature:
        "(value: 't.Iterable[V]', linecount: int, fill_with: 't.Optional[V]' = None) -> 't.Iterator[t.List[V]]'",
    },
    capitalize: {
      type: 'function',
      doc: 'Capitalize a value. The first character will be uppercase, all others\nlowercase.',
      signature: '(s: str) -> str',
    },
    center: {
      type: 'function',
      doc: 'Centers the value in a field of a given width.',
      signature: '(value: str, width: int = 80) -> str',
    },
    count: {
      type: 'function',
      doc: 'Return the number of items in a container.',
      signature: '(obj, /)',
    },
    d: {
      type: 'function',
      doc: "If the value is undefined it will return the passed default value,\notherwise the value of the variable:\n\n.. sourcecode:: jinja\n\n    {{ my_variable|default('my_variable is not defined') }}\n\nThis will output the value of ``my_variable`` if the variable was\ndefined, otherwise ``'my_variable is not defined'``. If you want\nto use default with variables that evaluate to false you have to\nset the second parameter to `true`:\n\n.. sourcecode:: jinja\n\n    {{ ''|default('the string was empty', true) }}\n\n.. versionchanged:: 2.11\n   It's now possible to configure the :class:`~jinja2.Environment` with\n   :class:`~jinja2.ChainableUndefined` to make the `default` filter work\n   on nested elements and attributes that may contain undefined values\n   in the chain without getting an :exc:`~jinja2.UndefinedError`.",
      signature:
        "(value: ~V, default_value: ~V = '', boolean: bool = False) -> ~V",
    },
    default: {
      type: 'function',
      doc: "If the value is undefined it will return the passed default value,\notherwise the value of the variable:\n\n.. sourcecode:: jinja\n\n    {{ my_variable|default('my_variable is not defined') }}\n\nThis will output the value of ``my_variable`` if the variable was\ndefined, otherwise ``'my_variable is not defined'``. If you want\nto use default with variables that evaluate to false you have to\nset the second parameter to `true`:\n\n.. sourcecode:: jinja\n\n    {{ ''|default('the string was empty', true) }}\n\n.. versionchanged:: 2.11\n   It's now possible to configure the :class:`~jinja2.Environment` with\n   :class:`~jinja2.ChainableUndefined` to make the `default` filter work\n   on nested elements and attributes that may contain undefined values\n   in the chain without getting an :exc:`~jinja2.UndefinedError`.",
      signature:
        "(value: ~V, default_value: ~V = '', boolean: bool = False) -> ~V",
    },
    dictsort: {
      type: 'function',
      doc: "Sort a dict and yield (key, value) pairs. Python dicts may not\nbe in the order you want to display them in, so sort them first.\n\n.. sourcecode:: jinja\n\n    {% for key, value in mydict|dictsort %}\n        sort the dict by key, case insensitive\n\n    {% for key, value in mydict|dictsort(reverse=true) %}\n        sort the dict by key, case insensitive, reverse order\n\n    {% for key, value in mydict|dictsort(true) %}\n        sort the dict by key, case sensitive\n\n    {% for key, value in mydict|dictsort(false, 'value') %}\n        sort the dict by value, case insensitive",
      signature:
        '(value: Mapping[~K, ~V], case_sensitive: bool = False, by: \'te.Literal["key", "value"]\' = \'key\', reverse: bool = False) -> List[Tuple[~K, ~V]]',
    },
    e: {
      type: 'function',
      doc: 'Replace the characters ``&``, ``<``, ``>``, ``\'``, and ``"`` in the string with HTML-safe sequences. Use this if you need to display text that might contain such characters in HTML.\n\nIf the object has an ``__html__`` method, it is called and the return value is assumed to already be safe for HTML.\n\n:param s: An object to be converted to a string and escaped.\n:return: A :class:`Markup` string with the escaped text.',
      signature: null,
    },
    escape: {
      type: 'function',
      doc: 'Replace the characters ``&``, ``<``, ``>``, ``\'``, and ``"`` in the string with HTML-safe sequences. Use this if you need to display text that might contain such characters in HTML.\n\nIf the object has an ``__html__`` method, it is called and the return value is assumed to already be safe for HTML.\n\n:param s: An object to be converted to a string and escaped.\n:return: A :class:`Markup` string with the escaped text.',
      signature: null,
    },
    filesizeformat: {
      type: 'function',
      doc: "Format the value like a 'human-readable' file size (i.e. 13 kB,\n4.1 MB, 102 Bytes, etc).  Per default decimal prefixes are used (Mega,\nGiga, etc.), if the second parameter is set to `True` the binary\nprefixes are used (Mebi, Gibi).",
      signature: '(value: Union[str, float, int], binary: bool = False) -> str',
    },
    first: {
      type: 'function',
      doc: 'Return the first item of a sequence.',
      signature:
        "(environment: 'Environment', seq: 't.Iterable[V]') -> 't.Union[V, Undefined]'",
    },
    float: {
      type: 'function',
      doc: "Convert the value into a floating point number. If the\nconversion doesn't work it will return ``0.0``. You can\noverride this default using the first parameter.",
      signature: '(value: Any, default: float = 0.0) -> float',
    },
    forceescape: {
      type: 'function',
      doc: 'Enforce HTML escaping.  This will probably double escape variables.',
      signature: "(value: 't.Union[str, HasHTML]') -> markupsafe.Markup",
    },
    format: {
      type: 'function',
      doc: 'Apply the given values to a `printf-style`_ format string, like\n``string % values``.\n\n.. sourcecode:: jinja\n\n    {{ "%s, %s!"|format(greeting, name) }}\n    Hello, World!\n\nIn most cases it should be more convenient and efficient to use the\n``%`` operator or :meth:`str.format`.\n\n.. code-block:: text\n\n    {{ "%s, %s!" % (greeting, name) }}\n    {{ "{}, {}!".format(greeting, name) }}\n\n.. _printf-style: https://docs.python.org/library/stdtypes.html\n    #printf-style-string-formatting',
      signature: '(value: str, *args: Any, **kwargs: Any) -> str',
    },
    groupby: {
      type: 'function',
      doc: 'Group a sequence of objects by an attribute using Python\'s\n:func:`itertools.groupby`. The attribute can use dot notation for\nnested access, like ``"address.city"``. Unlike Python\'s ``groupby``,\nthe values are sorted first so only one group is returned for each\nunique value.\n\nFor example, a list of ``User`` objects with a ``city`` attribute\ncan be rendered in groups. In this example, ``grouper`` refers to\nthe ``city`` value of the group.\n\n.. sourcecode:: html+jinja\n\n    <ul>{% for city, items in users|groupby("city") %}\n      <li>{{ city }}\n        <ul>{% for user in items %}\n          <li>{{ user.name }}\n        {% endfor %}</ul>\n      </li>\n    {% endfor %}</ul>\n\n``groupby`` yields namedtuples of ``(grouper, list)``, which\ncan be used instead of the tuple unpacking above. ``grouper`` is the\nvalue of the attribute, and ``list`` is the items with that value.\n\n.. sourcecode:: html+jinja\n\n    <ul>{% for group in users|groupby("city") %}\n      <li>{{ group.grouper }}: {{ group.list|join(", ") }}\n    {% endfor %}</ul>\n\nYou can specify a ``default`` value to use if an object in the list\ndoes not have the given attribute.\n\n.. sourcecode:: jinja\n\n    <ul>{% for city, items in users|groupby("city", default="NY") %}\n      <li>{{ city }}: {{ items|map(attribute="name")|join(", ") }}</li>\n    {% endfor %}</ul>\n\nLike the :func:`~jinja-filters.sort` filter, sorting and grouping is\ncase-insensitive by default. The ``key`` for each group will have\nthe case of the first item in that group of values. For example, if\na list of users has cities ``["CA", "NY", "ca"]``, the "CA" group\nwill have two values. This can be disabled by passing\n``case_sensitive=True``.\n\n.. versionchanged:: 3.1\n    Added the ``case_sensitive`` parameter. Sorting and grouping is\n    case-insensitive by default, matching other filters that do\n    comparisons.\n\n.. versionchanged:: 3.0\n    Added the ``default`` parameter.\n\n.. versionchanged:: 2.6\n    The attribute supports dot notation for nested access.',
      signature:
        "(environment: 'Environment', value: 't.Iterable[V]', attribute: Union[str, int], default: Optional[Any] = None, case_sensitive: bool = False) -> 't.List[_GroupTuple]'",
    },
    indent: {
      type: 'function',
      doc: "Return a copy of the string with each line indented by 4 spaces. The\nfirst line and blank lines are not indented by default.\n\n:param width: Number of spaces, or a string, to indent by.\n:param first: Don't skip indenting the first line.\n:param blank: Don't skip indenting empty lines.\n\n.. versionchanged:: 3.0\n    ``width`` can be a string.\n\n.. versionchanged:: 2.10\n    Blank lines are not indented by default.\n\n    Rename the ``indentfirst`` argument to ``first``.",
      signature:
        '(s: str, width: Union[int, str] = 4, first: bool = False, blank: bool = False) -> str',
    },
    int: {
      type: 'function',
      doc: "Convert the value into an integer. If the\nconversion doesn't work it will return ``0``. You can\noverride this default using the first parameter. You\ncan also override the default base (10) in the second\nparameter, which handles input with prefixes such as\n0b, 0o and 0x for bases 2, 8 and 16 respectively.\nThe base is ignored for decimal numbers and non-string values.",
      signature: '(value: Any, default: int = 0, base: int = 10) -> int',
    },
    join: {
      type: 'function',
      doc: "Return a string which is the concatenation of the strings in the\nsequence. The separator between elements is an empty string per\ndefault, you can define it with the optional parameter:\n\n.. sourcecode:: jinja\n\n    {{ [1, 2, 3]|join('|') }}\n        -> 1|2|3\n\n    {{ [1, 2, 3]|join }}\n        -> 123\n\nIt is also possible to join certain attributes of an object:\n\n.. sourcecode:: jinja\n\n    {{ users|join(', ', attribute='username') }}\n\n.. versionadded:: 2.6\n   The `attribute` parameter was added.",
      signature:
        "(eval_ctx: 'EvalContext', value: Iterable, d: str = '', attribute: Union[str, int, NoneType] = None) -> str",
    },
    last: {
      type: 'function',
      doc: "Return the last item of a sequence.\n\nNote: Does not work with generators. You may want to explicitly\nconvert it to a list:\n\n.. sourcecode:: jinja\n\n    {{ data | selectattr('name', '==', 'Jinja') | list | last }}",
      signature:
        "(environment: 'Environment', seq: 't.Reversible[V]') -> 't.Union[V, Undefined]'",
    },
    length: {
      type: 'function',
      doc: 'Return the number of items in a container.',
      signature: '(obj, /)',
    },
    list: {
      type: 'function',
      doc: 'Convert the value into a list.  If it was a string the returned list\nwill be a list of characters.',
      signature: "(value: 't.Iterable[V]') -> 't.List[V]'",
    },
    lower: {
      type: 'function',
      doc: 'Convert a value to lowercase.',
      signature: '(s: str) -> str',
    },
    items: {
      type: 'function',
      doc: 'Return an iterator over the ``(key, value)`` items of a mapping.\n\n``x|items`` is the same as ``x.items()``, except if ``x`` is\nundefined an empty iterator is returned.\n\nThis filter is useful if you expect the template to be rendered with\nan implementation of Jinja in another programming language that does\nnot have a ``.items()`` method on its mapping type.\n\n.. code-block:: html+jinja\n\n    <dl>\n    {% for key, value in my_dict|items %}\n        <dt>{{ key }}\n        <dd>{{ value }}\n    {% endfor %}\n    </dl>\n\n.. versionadded:: 3.1',
      signature:
        '(value: Union[Mapping[~K, ~V], jinja2.runtime.Undefined]) -> Iterator[Tuple[~K, ~V]]',
    },
    map: {
      type: 'function',
      doc: 'Applies a filter on a sequence of objects or looks up an attribute.\nThis is useful when dealing with lists of objects but you are really\nonly interested in a certain value of it.\n\nThe basic usage is mapping on an attribute.  Imagine you have a list\nof users but you are only interested in a list of usernames:\n\n.. sourcecode:: jinja\n\n    Users on this page: {{ users|map(attribute=\'username\')|join(\', \') }}\n\nYou can specify a ``default`` value to use if an object in the list\ndoes not have the given attribute.\n\n.. sourcecode:: jinja\n\n    {{ users|map(attribute="username", default="Anonymous")|join(", ") }}\n\nAlternatively you can let it invoke a filter by passing the name of the\nfilter and the arguments afterwards.  A good example would be applying a\ntext conversion filter on a sequence:\n\n.. sourcecode:: jinja\n\n    Users on this page: {{ titles|map(\'lower\')|join(\', \') }}\n\nSimilar to a generator comprehension such as:\n\n.. code-block:: python\n\n    (u.username for u in users)\n    (getattr(u, "username", "Anonymous") for u in users)\n    (do_lower(x) for x in titles)\n\n.. versionchanged:: 2.11.0\n    Added the ``default`` parameter.\n\n.. versionadded:: 2.7',
      signature:
        "(context: 'Context', value: Iterable, *args: Any, **kwargs: Any) -> Iterable",
    },
    min: {
      type: 'function',
      doc: 'Return the smallest item from the sequence.\n\n.. sourcecode:: jinja\n\n    {{ [1, 2, 3]|min }}\n        -> 1\n\n:param case_sensitive: Treat upper and lower case strings as distinct.\n:param attribute: Get the object with the min value of this attribute.',
      signature:
        "(environment: 'Environment', value: 't.Iterable[V]', case_sensitive: bool = False, attribute: Union[str, int, NoneType] = None) -> 't.Union[V, Undefined]'",
    },
    max: {
      type: 'function',
      doc: 'Return the largest item from the sequence.\n\n.. sourcecode:: jinja\n\n    {{ [1, 2, 3]|max }}\n        -> 3\n\n:param case_sensitive: Treat upper and lower case strings as distinct.\n:param attribute: Get the object with the max value of this attribute.',
      signature:
        "(environment: 'Environment', value: 't.Iterable[V]', case_sensitive: bool = False, attribute: Union[str, int, NoneType] = None) -> 't.Union[V, Undefined]'",
    },
    pprint: {
      type: 'function',
      doc: 'Pretty print a variable. Useful for debugging.',
      signature: '(value: Any) -> str',
    },
    random: {
      type: 'function',
      doc: 'Return a random item from the sequence.',
      signature:
        "(context: 'Context', seq: 't.Sequence[V]') -> 't.Union[V, Undefined]'",
    },
    reject: {
      type: 'function',
      doc: 'Filters a sequence of objects by applying a test to each object,\nand rejecting the objects with the test succeeding.\n\nIf no test is specified, each object will be evaluated as a boolean.\n\nExample usage:\n\n.. sourcecode:: jinja\n\n    {{ numbers|reject("odd") }}\n\nSimilar to a generator comprehension such as:\n\n.. code-block:: python\n\n    (n for n in numbers if not test_odd(n))\n\n.. versionadded:: 2.7',
      signature:
        "(context: 'Context', value: 't.Iterable[V]', *args: Any, **kwargs: Any) -> 't.Iterator[V]'",
    },
    rejectattr: {
      type: 'function',
      doc: 'Filters a sequence of objects by applying a test to the specified\nattribute of each object, and rejecting the objects with the test\nsucceeding.\n\nIf no test is specified, the attribute\'s value will be evaluated as\na boolean.\n\n.. sourcecode:: jinja\n\n    {{ users|rejectattr("is_active") }}\n    {{ users|rejectattr("email", "none") }}\n\nSimilar to a generator comprehension such as:\n\n.. code-block:: python\n\n    (u for user in users if not user.is_active)\n    (u for user in users if not test_none(user.email))\n\n.. versionadded:: 2.7',
      signature:
        "(context: 'Context', value: 't.Iterable[V]', *args: Any, **kwargs: Any) -> 't.Iterator[V]'",
    },
    replace: {
      type: 'function',
      doc: 'Return a copy of the value with all occurrences of a substring\nreplaced with a new one. The first argument is the substring\nthat should be replaced, the second is the replacement string.\nIf the optional third argument ``count`` is given, only the first\n``count`` occurrences are replaced:\n\n.. sourcecode:: jinja\n\n    {{ "Hello World"|replace("Hello", "Goodbye") }}\n        -> Goodbye World\n\n    {{ "aaaaargh"|replace("a", "d\'oh, ", 2) }}\n        -> d\'oh, d\'oh, aaargh',
      signature:
        "(eval_ctx: 'EvalContext', s: str, old: str, new: str, count: Optional[int] = None) -> str",
    },
    reverse: {
      type: 'function',
      doc: 'Reverse the object or return an iterator that iterates over it the other\nway round.',
      signature:
        '(value: Union[str, Iterable[~V]]) -> Union[str, Iterable[~V]]',
    },
    round: {
      type: 'function',
      doc: "Round the number to a given precision. The first\nparameter specifies the precision (default is ``0``), the\nsecond the rounding method:\n\n- ``'common'`` rounds either up or down\n- ``'ceil'`` always rounds up\n- ``'floor'`` always rounds down\n\nIf you don't specify a method ``'common'`` is used.\n\n.. sourcecode:: jinja\n\n    {{ 42.55|round }}\n        -> 43.0\n    {{ 42.55|round(1, 'floor') }}\n        -> 42.5\n\nNote that even if rounded to 0 precision, a float is returned.  If\nyou need a real integer, pipe it through `int`:\n\n.. sourcecode:: jinja\n\n    {{ 42.55|round|int }}\n        -> 43",
      signature:
        '(value: float, precision: int = 0, method: \'te.Literal["common", "ceil", "floor"]\' = \'common\') -> float',
    },
    safe: {
      type: 'function',
      doc: 'Mark the value as safe which means that in an environment with automatic\nescaping enabled this variable will not be escaped.',
      signature: '(value: str) -> markupsafe.Markup',
    },
    select: {
      type: 'function',
      doc: 'Filters a sequence of objects by applying a test to each object,\nand only selecting the objects with the test succeeding.\n\nIf no test is specified, each object will be evaluated as a boolean.\n\nExample usage:\n\n.. sourcecode:: jinja\n\n    {{ numbers|select("odd") }}\n    {{ numbers|select("odd") }}\n    {{ numbers|select("divisibleby", 3) }}\n    {{ numbers|select("lessthan", 42) }}\n    {{ strings|select("equalto", "mystring") }}\n\nSimilar to a generator comprehension such as:\n\n.. code-block:: python\n\n    (n for n in numbers if test_odd(n))\n    (n for n in numbers if test_divisibleby(n, 3))\n\n.. versionadded:: 2.7',
      signature:
        "(context: 'Context', value: 't.Iterable[V]', *args: Any, **kwargs: Any) -> 't.Iterator[V]'",
    },
    selectattr: {
      type: 'function',
      doc: 'Filters a sequence of objects by applying a test to the specified\nattribute of each object, and only selecting the objects with the\ntest succeeding.\n\nIf no test is specified, the attribute\'s value will be evaluated as\na boolean.\n\nExample usage:\n\n.. sourcecode:: jinja\n\n    {{ users|selectattr("is_active") }}\n    {{ users|selectattr("email", "none") }}\n\nSimilar to a generator comprehension such as:\n\n.. code-block:: python\n\n    (u for user in users if user.is_active)\n    (u for user in users if test_none(user.email))\n\n.. versionadded:: 2.7',
      signature:
        "(context: 'Context', value: 't.Iterable[V]', *args: Any, **kwargs: Any) -> 't.Iterator[V]'",
    },
    slice: {
      type: 'function',
      doc: 'Slice an iterator and return a list of lists containing\nthose items. Useful if you want to create a div containing\nthree ul tags that represent columns:\n\n.. sourcecode:: html+jinja\n\n    <div class="columnwrapper">\n      {%- for column in items|slice(3) %}\n        <ul class="column-{{ loop.index }}">\n        {%- for item in column %}\n          <li>{{ item }}</li>\n        {%- endfor %}\n        </ul>\n      {%- endfor %}\n    </div>\n\nIf you pass it a second argument it\'s used to fill missing\nvalues on the last iteration.',
      signature:
        "(value: 't.Collection[V]', slices: int, fill_with: 't.Optional[V]' = None) -> 't.Iterator[t.List[V]]'",
    },
    sort: {
      type: 'function',
      doc: 'Sort an iterable using Python\'s :func:`sorted`.\n\n.. sourcecode:: jinja\n\n    {% for city in cities|sort %}\n        ...\n    {% endfor %}\n\n:param reverse: Sort descending instead of ascending.\n:param case_sensitive: When sorting strings, sort upper and lower\n    case separately.\n:param attribute: When sorting objects or dicts, an attribute or\n    key to sort by. Can use dot notation like ``"address.city"``.\n    Can be a list of attributes like ``"age,name"``.\n\nThe sort is stable, it does not change the relative order of\nelements that compare equal. This makes it is possible to chain\nsorts on different attributes and ordering.\n\n.. sourcecode:: jinja\n\n    {% for user in users|sort(attribute="name")\n        |sort(reverse=true, attribute="age") %}\n        ...\n    {% endfor %}\n\nAs a shortcut to chaining when the direction is the same for all\nattributes, pass a comma separate list of attributes.\n\n.. sourcecode:: jinja\n\n    {% for user in users|sort(attribute="age,name") %}\n        ...\n    {% endfor %}\n\n.. versionchanged:: 2.11.0\n    The ``attribute`` parameter can be a comma separated list of\n    attributes, e.g. ``"age,name"``.\n\n.. versionchanged:: 2.6\n   The ``attribute`` parameter was added.',
      signature:
        "(environment: 'Environment', value: 't.Iterable[V]', reverse: bool = False, case_sensitive: bool = False, attribute: Union[str, int, NoneType] = None) -> 't.List[V]'",
    },
    string: {
      type: 'function',
      doc: "Convert an object to a string if it isn't already. This preserves a :class:`Markup` string rather than converting it back to a basic string, so it will still be marked as safe and won't be escaped again.\n\n>>> value = escape(\"<User 1>\")\n>>> value\nMarkup('&lt;User 1&gt;')\n>>> escape(str(value))\nMarkup('&amp;lt;User 1&amp;gt;')\n>>> escape(soft_str(value))\nMarkup('&lt;User 1&gt;')",
      signature: null,
    },
    striptags: {
      type: 'function',
      doc: 'Strip SGML/XML tags and replace adjacent whitespace by one space.',
      signature: "(value: 't.Union[str, HasHTML]') -> str",
    },
    sum: {
      type: 'function',
      doc: "Returns the sum of a sequence of numbers plus the value of parameter\n'start' (which defaults to 0).  When the sequence is empty it returns\nstart.\n\nIt is also possible to sum up only certain attributes:\n\n.. sourcecode:: jinja\n\n    Total: {{ items|sum(attribute='price') }}\n\n.. versionchanged:: 2.6\n   The ``attribute`` parameter was added to allow summing up over\n   attributes.  Also the ``start`` parameter was moved on to the right.",
      signature:
        "(environment: 'Environment', iterable: 't.Iterable[V]', attribute: Union[str, int, NoneType] = None, start: ~V = 0) -> ~V",
    },
    title: {
      type: 'function',
      doc: 'Return a titlecased version of the value. I.e. words will start with\nuppercase letters, all remaining characters are lowercase.',
      signature: '(s: str) -> str',
    },
    trim: {
      type: 'function',
      doc: 'Strip leading and trailing characters, by default whitespace.',
      signature: '(value: str, chars: Optional[str] = None) -> str',
    },
    truncate: {
      type: 'function',
      doc: 'Return a truncated copy of the string. The length is specified\nwith the first parameter which defaults to ``255``. If the second\nparameter is ``true`` the filter will cut the text at length. Otherwise\nit will discard the last word. If the text was in fact\ntruncated it will append an ellipsis sign (``"..."``). If you want a\ndifferent ellipsis sign than ``"..."`` you can specify it using the\nthird parameter. Strings that only exceed the length by the tolerance\nmargin given in the fourth parameter will not be truncated.\n\n.. sourcecode:: jinja\n\n    {{ "foo bar baz qux"|truncate(9) }}\n        -> "foo..."\n    {{ "foo bar baz qux"|truncate(9, True) }}\n        -> "foo ba..."\n    {{ "foo bar baz qux"|truncate(11) }}\n        -> "foo bar baz qux"\n    {{ "foo bar baz qux"|truncate(11, False, \'...\', 0) }}\n        -> "foo bar..."\n\nThe default leeway on newer Jinja versions is 5 and was 0 before but\ncan be reconfigured globally.',
      signature:
        "(env: 'Environment', s: str, length: int = 255, killwords: bool = False, end: str = '...', leeway: Optional[int] = None) -> str",
    },
    unique: {
      type: 'function',
      doc: "Returns a list of unique items from the given iterable.\n\n.. sourcecode:: jinja\n\n    {{ ['foo', 'bar', 'foobar', 'FooBar']|unique|list }}\n        -> ['foo', 'bar', 'foobar']\n\nThe unique items are yielded in the same order as their first occurrence in\nthe iterable passed to the filter.\n\n:param case_sensitive: Treat upper and lower case strings as distinct.\n:param attribute: Filter objects with unique values for this attribute.",
      signature:
        "(environment: 'Environment', value: 't.Iterable[V]', case_sensitive: bool = False, attribute: Union[str, int, NoneType] = None) -> 't.Iterator[V]'",
    },
    upper: {
      type: 'function',
      doc: 'Convert a value to uppercase.',
      signature: '(s: str) -> str',
    },
    urlencode: {
      type: 'function',
      doc: 'Quote data for use in a URL path or query using UTF-8.\n\nBasic wrapper around :func:`urllib.parse.quote` when given a\nstring, or :func:`urllib.parse.urlencode` for a dict or iterable.\n\n:param value: Data to quote. A string will be quoted directly. A\n    dict or iterable of ``(key, value)`` pairs will be joined as a\n    query string.\n\nWhen given a string, "/" is not quoted. HTTP servers treat "/" and\n"%2F" equivalently in paths. If you need quoted slashes, use the\n``|replace("/", "%2F")`` filter.\n\n.. versionadded:: 2.7',
      signature:
        '(value: Union[str, Mapping[str, Any], Iterable[Tuple[str, Any]]]) -> str',
    },
    urlize: {
      type: 'function',
      doc: 'Convert URLs in text into clickable links.\n\nThis may not recognize links in some situations. Usually, a more\ncomprehensive formatter, such as a Markdown library, is a better\nchoice.\n\nWorks on ``http://``, ``https://``, ``www.``, ``mailto:``, and email\naddresses. Links with trailing punctuation (periods, commas, closing\nparentheses) and leading punctuation (opening parentheses) are\nrecognized excluding the punctuation. Email addresses that include\nheader fields are not recognized (for example,\n``mailto:address@example.com?cc=copy@example.com``).\n\n:param value: Original text containing URLs to link.\n:param trim_url_limit: Shorten displayed URL values to this length.\n:param nofollow: Add the ``rel=nofollow`` attribute to links.\n:param target: Add the ``target`` attribute to links.\n:param rel: Add the ``rel`` attribute to links.\n:param extra_schemes: Recognize URLs that start with these schemes\n    in addition to the default behavior. Defaults to\n    ``env.policies["urlize.extra_schemes"]``, which defaults to no\n    extra schemes.\n\n.. versionchanged:: 3.0\n    The ``extra_schemes`` parameter was added.\n\n.. versionchanged:: 3.0\n    Generate ``https://`` links for URLs without a scheme.\n\n.. versionchanged:: 3.0\n    The parsing rules were updated. Recognize email addresses with\n    or without the ``mailto:`` scheme. Validate IP addresses. Ignore\n    parentheses and brackets in more cases.\n\n.. versionchanged:: 2.8\n   The ``target`` parameter was added.',
      signature:
        "(eval_ctx: 'EvalContext', value: str, trim_url_limit: Optional[int] = None, nofollow: bool = False, target: Optional[str] = None, rel: Optional[str] = None, extra_schemes: Optional[Iterable[str]] = None) -> str",
    },
    wordcount: {
      type: 'function',
      doc: 'Count the words in that string.',
      signature: '(s: str) -> int',
    },
    wordwrap: {
      type: 'function',
      doc: 'Wrap a string to the given width. Existing newlines are treated\nas paragraphs to be wrapped separately.\n\n:param s: Original text to wrap.\n:param width: Maximum length of wrapped lines.\n:param break_long_words: If a word is longer than ``width``, break\n    it across lines.\n:param break_on_hyphens: If a word contains hyphens, it may be split\n    across lines.\n:param wrapstring: String to join each wrapped line. Defaults to\n    :attr:`Environment.newline_sequence`.\n\n.. versionchanged:: 2.11\n    Existing newlines are treated as paragraphs wrapped separately.\n\n.. versionchanged:: 2.11\n    Added the ``break_on_hyphens`` parameter.\n\n.. versionchanged:: 2.7\n    Added the ``wrapstring`` parameter.',
      signature:
        "(environment: 'Environment', s: str, width: int = 79, break_long_words: bool = True, wrapstring: Optional[str] = None, break_on_hyphens: bool = True) -> str",
    },
    xmlattr: {
      type: 'function',
      doc: "Create an SGML/XML attribute string based on the items in a dict.\nAll values that are neither `none` nor `undefined` are automatically\nescaped:\n\n.. sourcecode:: html+jinja\n\n    <ul{{ {'class': 'my_list', 'missing': none,\n            'id': 'list-%d'|format(variable)}|xmlattr }}>\n    ...\n    </ul>\n\nResults in something like this:\n\n.. sourcecode:: html\n\n    <ul class=\"my_list\" id=\"list-42\">\n    ...\n    </ul>\n\nAs you can see it automatically prepends a space in front of the item\nif the filter returned something unless the second parameter is false.",
      signature:
        "(eval_ctx: 'EvalContext', d: Mapping[str, Any], autospace: bool = True) -> str",
    },
    tojson: {
      type: 'function',
      doc: 'Serialize an object to a string of JSON, and mark it safe to\nrender in HTML. This filter is only for use in HTML documents.\n\nThe returned string is safe to render in HTML documents and\n``<script>`` tags. The exception is in HTML attributes that are\ndouble quoted; either use single quotes or the ``|forceescape``\nfilter.\n\n:param value: The object to serialize to JSON.\n:param indent: The ``indent`` parameter passed to ``dumps``, for\n    pretty-printing the value.\n\n.. versionadded:: 2.9',
      signature:
        "(eval_ctx: 'EvalContext', value: Any, indent: Optional[int] = None) -> markupsafe.Markup",
    },
    in_clause: {
      type: 'function',
      doc: null,
      signature: '(values)',
    },
    pick: {
      type: 'function',
      doc: null,
      signature: '(items, *fields)',
    },
  },
  tests: [
    'odd',
    'even',
    'divisibleby',
    'defined',
    'undefined',
    'filter',
    'test',
    'none',
    'boolean',
    'false',
    'true',
    'integer',
    'float',
    'lower',
    'upper',
    'string',
    'mapping',
    'number',
    'sequence',
    'iterable',
    'callable',
    'sameas',
    'escaped',
    'in',
    '==',
    'eq',
    'equalto',
    '!=',
    'ne',
    '>',
    'gt',
    'greaterthan',
    'ge',
    '>=',
    '<',
    'lt',
    'lessthan',
    '<=',
    'le',
  ],
  tags: [],
};
