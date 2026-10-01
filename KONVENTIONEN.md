# Konventionen

## Code

- ESM überall, `"type": "module"`.
- Backend-Imports über die `#`-Subpath-Imports (`#config`, `#routes`, …), nicht über relative Pfade quer durch `src/`.
- Gemeinsame Typen und Zod-Schemas leben in `shared/`, nicht dupliziert.

## Commits

<!-- Format, Sprache, Scope. -->

## Tests

- Vitest in beiden Paketen. Backend mit supertest, Client mit Testing Library.
