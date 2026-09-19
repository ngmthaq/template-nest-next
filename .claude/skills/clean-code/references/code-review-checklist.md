# Code Review Checklist

Use this checklist on any pull request, in any language or coding style.

## SOLID _(OOP)_

- [ ] SRP: Does each class/module have exactly one reason to change?
- [ ] OCP: Are new types added with new code, not by editing existing `if`/`switch` blocks?
- [ ] LSP: Do all subtypes keep the promises of the base class?
- [ ] ISP: Are interfaces small — no methods that implementing classes won't use?
- [ ] DIP: Do high-level modules depend on abstractions, not concrete classes?

## DRY _(All)_

- [ ] No duplicated logic, magic numbers, or copy-pasted blocks
- [ ] Shared types/schemas defined in one place
- [ ] Test setup uses factory functions, not repeated literals

## KISS _(All)_

- [ ] No abstraction added for possible future needs
- [ ] Nesting depth ≤ 2 levels (use guard clauses otherwise)
- [ ] No clever one-liners that are hard to understand

## Separation of Concerns _(All)_

- [ ] Business logic does not depend on UI, DB, or HTTP
- [ ] Controllers/handlers are small
- [ ] Auth, logging, validation handled by middleware — not inline

## Atomic Design _(UI only)_

- [ ] No data fetching below the Page level
- [ ] No business logic inside components
- [ ] No upside-down levels (molecule importing organism, etc.)
