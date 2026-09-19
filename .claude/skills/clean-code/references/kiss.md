# KISS — Keep It Simple, Stupid

A solution should be **as simple as possible** while still meeting its requirements — not simpler, not more complex.

```javascript
// Bad — factory for something that only needs a function
class DataFetcherFactory {
  static create(type, config, middleware = [], plugins = []) {
    ...
  }
}

// Good
async function fetchData(url) {
  const res = await fetch(url);
  return res.json();
}
```

```python
# Bad — clever one-liner that is hard to understand
result = [x for x in data if x % 2 == 0 and x > 0 and x < 100 and x not in seen and not seen.add(x)]

# Good — readable loop
result = []
for x in data:
    if x % 2 == 0 and 0 < x < 100 and x not in seen:
        seen.add(x)
        result.append(x)
```

```javascript
// Bad — deep nesting
function processOrder(order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        if (order.status !== "cancelled") {
          /* logic */
        }
      }
    }
  }
}

// Good — guard clauses
function processOrder(order) {
  if (!order?.items?.length) return;
  if (order.status === "cancelled") return;
  // logic
}
```

## KISS Rules

1. Before you add an abstraction, ask: "What problem does this solve today?" If none, do not add it.
2. When nesting more than 2 levels deep, use guard clauses or early returns.
3. Use built-in language features instead of writing your own.
4. Ask: "Could a good developer who is new to this codebase understand this in 30 seconds?" If no, make it simpler.
5. Flag complexity with: "KISS violation: can this be simplified to `[simpler form]`?"
