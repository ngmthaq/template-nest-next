# Step 2 — Coding Conventions

**Goal:** Read [CODING_CONVENTIONS.md](../../../references/CODING_CONVENTIONS.md) to see what is already there. Find and write down the project's coding rules. Write approved results to [CODING_CONVENTIONS.md](../../../references/CODING_CONVENTIONS.md).

1. **Look** in the repository for signs of coding rules:
   - Naming: camelCase, snake_case, PascalCase for files, variables, functions, classes
   - Folder structure: by feature, by layer, or by domain
   - Import style: absolute or relative paths, barrel exports (`index.ts`)
   - Style config files: `.eslintrc.*`, `.prettierrc.*`, `pyproject.toml [tool.ruff]`, `.editorconfig`, `rustfmt.toml`
   - Documentation style: JSDoc, Python docstrings, inline comments
   - Error handling patterns: try/catch, Result types, error boundaries
   - State management patterns, if any

2. **Show** the rules you found to the user and ask:

   > "Here are the coding conventions I found. Do you want to change anything, or approve them as they are?"

3. **Only after user approval**, write the conventions to [CODING_CONVENTIONS.md](../../../references/CODING_CONVENTIONS.md).
