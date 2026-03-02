export const SESSIONS = [
  {
    id: 1,
    name: 'UAT',
  },
  {
    id: 2,
    name: 'Production',
  },
  {
    id: 3,
    name: 'Develop',
  },
];

export const JINJA_ENV = {
  globals: {
    range: {
      type: 'function',
      doc: 'Create a range of numbers (limited to MAX_RANGE items).',
      signature: '(*args: int) -> range',
    },

    dict: {
      type: 'function',
      doc: 'Create a dictionary from a mapping, iterable of pairs, or keyword arguments.',
      signature: 'dict([mapping|iterable], **kwargs) -> dict',
    },

    lipsum: {
      type: 'function',
      doc: 'Generate placeholder lorem ipsum text.',
      signature:
        '(n: int = 5, html: bool = true, min: int = 20, max: int = 100) -> str',
    },

    cycler: {
      type: 'function',
      doc: 'Cycle through given values repeatedly (useful for alternating classes).',
      signature: '(*items: any) -> Cycler',
    },

    joiner: {
      type: 'function',
      doc: 'Helper for joining output with a separator.',
      signature: "(sep: str = ', ') -> Joiner",
    },

    namespace: {
      type: 'function',
      doc: 'Create a namespace object that holds arbitrary attributes.',
      signature: '(**kwargs) -> Namespace',
    },

    datetime: {
      type: 'function',
      doc: 'Create a datetime object.',
      signature:
        '(year, month, day, hour?, minute?, second?, microsecond?, tzinfo?)',
    },

    timedelta: {
      type: 'function',
      doc: 'Create a time duration.',
      signature: '(days=0, seconds=0, minutes=0, hours=0, weeks=0, ...)',
    },

    timezone: {
      type: 'function',
      doc: 'Create a fixed UTC offset timezone.',
      signature: '(offset)',
    },
  },

  filters: {
    abs: {
      type: 'function',
      doc: 'Absolute value.',
      signature: '(x) -> number',
    },
    attr: {
      type: 'function',
      doc: 'Get an object attribute.',
      signature: '(obj, name) -> any',
    },
    batch: {
      type: 'function',
      doc: 'Group items into batches.',
      signature: '(iterable, size, fill?) -> list[list]',
    },
    capitalize: {
      type: 'function',
      doc: 'Capitalize first letter.',
      signature: '(str) -> str',
    },
    center: {
      type: 'function',
      doc: 'Center text in given width.',
      signature: '(str, width=80) -> str',
    },
    count: {
      type: 'function',
      doc: 'Count items.',
      signature: '(iterable) -> int',
    },
    default: {
      type: 'function',
      doc: 'Fallback value if undefined.',
      signature: '(value, default="", boolean=false)',
    },
    dictsort: {
      type: 'function',
      doc: 'Sort dictionary items.',
      signature: '(mapping, case_sensitive=false, by="key")',
    },
    escape: {
      type: 'function',
      doc: 'HTML escape a string.',
      signature: '(str) -> str',
    },
    filesizeformat: {
      type: 'function',
      doc: 'Human-readable file size.',
      signature: '(value, binary=false)',
    },
    first: {
      type: 'function',
      doc: 'First item of a sequence.',
      signature: '(iterable)',
    },
    float: {
      type: 'function',
      doc: 'Convert to float.',
      signature: '(value, default=0.0)',
    },
    format: {
      type: 'function',
      doc: 'Apply printf-style formatting.',
      signature: '(format_string, *args)',
    },
    groupby: {
      type: 'function',
      doc: 'Group objects by attribute.',
      signature: '(iterable, attribute)',
    },
    indent: {
      type: 'function',
      doc: 'Indent text.',
      signature: '(str, width=4)',
    },
    int: {
      type: 'function',
      doc: 'Convert to integer.',
      signature: '(value, default=0, base=10)',
    },
    join: {
      type: 'function',
      doc: 'Join sequence into string.',
      signature: '(iterable, separator="", attribute?)',
    },
    last: {
      type: 'function',
      doc: 'Last item of a sequence.',
      signature: '(iterable)',
    },
    length: {
      type: 'function',
      doc: 'Length of a sequence.',
      signature: '(iterable) -> int',
    },
    list: {
      type: 'function',
      doc: 'Convert to list.',
      signature: '(iterable)',
    },
    lower: { type: 'function', doc: 'Lowercase string.', signature: '(str)' },
    map: {
      type: 'function',
      doc: 'Map attribute or filter over sequence.',
      signature: '(iterable, attribute|filter)',
    },
    max: { type: 'function', doc: 'Maximum value.', signature: '(iterable)' },
    min: { type: 'function', doc: 'Minimum value.', signature: '(iterable)' },
    pprint: {
      type: 'function',
      doc: 'Pretty print (debugging).',
      signature: '(value)',
    },
    random: {
      type: 'function',
      doc: 'Random item from sequence.',
      signature: '(sequence)',
    },
    replace: {
      type: 'function',
      doc: 'Replace substring.',
      signature: '(str, old, new, count?)',
    },
    reverse: {
      type: 'function',
      doc: 'Reverse sequence or string.',
      signature: '(value)',
    },
    round: {
      type: 'function',
      doc: 'Round number.',
      signature: '(value, precision=0)',
    },
    safe: {
      type: 'function',
      doc: 'Mark value as safe (no escaping).',
      signature: '(str)',
    },
    select: {
      type: 'function',
      doc: 'Filter sequence by test.',
      signature: '(iterable, test)',
    },
    selectattr: {
      type: 'function',
      doc: 'Filter objects by attribute test.',
      signature: '(iterable, attribute)',
    },
    slice: {
      type: 'function',
      doc: 'Split into N slices.',
      signature: '(iterable, slices)',
    },
    sort: {
      type: 'function',
      doc: 'Sort iterable.',
      signature: '(iterable, reverse=false, attribute?)',
    },
    string: {
      type: 'function',
      doc: 'Convert to string.',
      signature: '(value)',
    },
    striptags: {
      type: 'function',
      doc: 'Remove HTML/XML tags.',
      signature: '(str)',
    },
    sum: {
      type: 'function',
      doc: 'Sum values.',
      signature: '(iterable, attribute?, start=0)',
    },
    title: { type: 'function', doc: 'Title-case string.', signature: '(str)' },
    trim: { type: 'function', doc: 'Trim whitespace.', signature: '(str)' },
    truncate: {
      type: 'function',
      doc: 'Truncate string with ellipsis.',
      signature: '(str, length=255)',
    },
    unique: {
      type: 'function',
      doc: 'Unique values (preserves order).',
      signature: '(iterable)',
    },
    upper: { type: 'function', doc: 'Uppercase string.', signature: '(str)' },
    urlencode: {
      type: 'function',
      doc: 'URL encode value.',
      signature: '(value)',
    },
    urlize: {
      type: 'function',
      doc: 'Convert URLs to clickable links.',
      signature: '(str)',
    },
    wordcount: { type: 'function', doc: 'Count words.', signature: '(str)' },
    wordwrap: {
      type: 'function',
      doc: 'Wrap text to width.',
      signature: '(str, width=79)',
    },
    xmlattr: {
      type: 'function',
      doc: 'Generate HTML/XML attributes from object.',
      signature: '(dict)',
    },
    tojson: {
      type: 'function',
      doc: 'Serialize to JSON (HTML-safe).',
      signature: '(value, indent?)',
    },

    in_clause: {
      type: 'function',
      doc: 'Custom SQL-style IN clause helper.',
      signature: '(values)',
    },
    pick: {
      type: 'function',
      doc: 'Pick specific fields from items.',
      signature: '(items, ...fields)',
    },
  },

  tests: [
    'odd',
    'even',
    'divisibleby',
    'defined',
    'undefined',
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
    '>=',
    'ge',
    '<',
    'lt',
    'lessthan',
    '<=',
    'le',
  ],

  tags: [],
};
