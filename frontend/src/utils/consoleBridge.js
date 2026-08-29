// Injected into the preview iframe so its console output and uncaught errors
// reach the parent. The sandbox omits allow-same-origin, so the frame has an
// opaque origin and '*' is the only possible postMessage target; the parent
// verifies the sender by window identity instead.

export const PREVIEW_MESSAGE_SOURCE = 'peerscript-preview-console';

// Trimmed here rather than in the panel, so a runaway log never crosses in full.
const MAX_ARG_LENGTH = 2000;

export const consoleBridge = `<script>
(function () {
  var SOURCE = ${JSON.stringify(PREVIEW_MESSAGE_SOURCE)};
  var MAX_ARG_LENGTH = ${MAX_ARG_LENGTH};

  function truncate(text) {
    return text.length > MAX_ARG_LENGTH
      ? text.slice(0, MAX_ARG_LENGTH) + '... (truncated)'
      : text;
  }

  function describeFunction(value) {
    return 'f ' + (value.name || 'anonymous') + '()';
  }

  // JSON drops undefined, functions and symbols, and throws on cycles.
  function serialize(value) {
    if (typeof value === 'string') return value;
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'function') return describeFunction(value);
    if (typeof value === 'bigint') return String(value) + 'n';
    if (typeof value === 'symbol') return value.toString();
    if (value instanceof Error) return value.name + ': ' + value.message;

    if (typeof value === 'object') {
      var seen = new WeakSet();
      try {
        return JSON.stringify(value, function (key, nested) {
          if (typeof nested === 'object' && nested !== null) {
            if (seen.has(nested)) return '[Circular]';
            seen.add(nested);
          }
          if (typeof nested === 'function') return describeFunction(nested);
          if (typeof nested === 'bigint') return String(nested) + 'n';
          return nested;
        });
      } catch (error) {
        return Object.prototype.toString.call(value);
      }
    }

    return String(value);
  }

  function send(type, args) {
    try {
      window.parent.postMessage(
        { source: SOURCE, type: type, text: truncate(args.map(serialize).join(' ')) },
        '*'
      );
    } catch (error) {
      // The relay is best effort; a failure here must not break the preview.
    }
  }

  ['log', 'info', 'warn', 'error'].forEach(function (type) {
    var original = console[type];
    console[type] = function () {
      var args = Array.prototype.slice.call(arguments);
      send(type, args);
      if (original) original.apply(console, args);
    };
  });

  window.addEventListener('error', function (event) {
    send('error', [event.message + ' (line ' + event.lineno + ')']);
  });

  window.addEventListener('unhandledrejection', function (event) {
    send('error', ['Unhandled promise rejection: ' + serialize(event.reason)]);
  });
})();
</script>`;
