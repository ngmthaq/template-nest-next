# DRY — Don't Repeat Yourself

Every piece of knowledge lives in **one single place** in the system. That place is the source of truth.

```javascript
// Bad — tax logic duplicated in three places
const tax = price * 0.08; // checkout
const tax = subtotal * 0.08; // order summary
const tax = amount * 0.08; // invoice

// Good — single source of truth
const TAX_RATE = 0.08;
function calculateTax(amount) {
  return amount * TAX_RATE;
}
```

```typescript
// Bad — same shape defined in three layers
type User = { id: string; email: string; role: string }; // API handler
type UserRecord = { id: string; email: string; role: string }; // DB layer
const mockUser = { id: "1", email: "a@b.com", role: "admin" }; // tests

// Good — import from one definition
// types/user.ts
export type User = { id: string; email: string; role: string };
```

## DRY Rules

1. Before you copy and paste, stop — move the code into a function, constant, or module first.
2. Before you hardcode a value, check if it is used somewhere else — if so, make it a named constant.
3. "Rule of Three": make shared code on the third copy, not the first.
4. Do not DRY too early — code that looks the same by chance but means different things should stay separate.
