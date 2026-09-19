# Step 1 — Research Project Overview

**Goal:** Read [PROJECT_OVERVIEW.md](../../../references/PROJECT_OVERVIEW.md) to see what is already there. Get a full picture of the project. Write all findings to [PROJECT_OVERVIEW.md](../../../references/PROJECT_OVERVIEW.md).

## 1.1 — Project Name and Description

Look for config files: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `.csproj`, `pubspec.yaml`, `composer.json`. Get the `name` and `description` fields.

If not found, or the values are unclear or empty, ask the user:

> "What is the project name and description?"

## 1.2 — Programming Languages and Frameworks

Look in the repository for these signs:

| Sign                       | Language / Framework |
| -------------------------- | -------------------- |
| `.ts`, `.tsx` files        | TypeScript           |
| `.js`, `.jsx` files        | JavaScript           |
| `next.config.*`            | Next.js              |
| `vite.config.*`            | Vite                 |
| `angular.json`             | Angular              |
| `nuxt.config.*`            | Nuxt                 |
| `.py` files                | Python               |
| `settings.py`, `manage.py` | Django               |
| `fastapi` in deps          | FastAPI              |
| `.go` files                | Go                   |
| `.rs` files                | Rust                 |
| `.java` + `pom.xml`        | Java / Maven         |
| `spring` in `pom.xml`      | Spring Boot          |
| `.cs` + `.csproj`          | C# / .NET            |
| `.dart` + `pubspec.yaml`   | Dart / Flutter       |
| `.rb` + `Gemfile`          | Ruby                 |
| `.php` + `composer.json`   | PHP / Laravel        |

For monorepos or microservices, list all languages and frameworks you found for each package or service.

## 1.3 — Package Manager

Find it by the lock file:

| Lock File           | Package Manager |
| ------------------- | --------------- |
| `yarn.lock`         | Yarn            |
| `package-lock.json` | npm             |
| `pnpm-lock.yaml`    | pnpm            |
| `bun.lockb`         | Bun             |
| `Pipfile.lock`      | Pipenv          |
| `poetry.lock`       | Poetry          |
| `uv.lock`           | uv              |
| `Cargo.lock`        | Cargo           |
| `go.sum`            | Go modules      |
| `Gemfile.lock`      | Bundler         |
| `composer.lock`     | Composer        |

If there are many lock files for the same language, ask the user:

> "I found multiple lock files ([list them]). Which package manager should I use?"

## 1.4 — Key Libraries

Look at `package.json`, `requirements.txt`, `pyproject.toml`, or other package files. List the main libraries used in many features or modules, such as `prisma`, `axios`, `formik`, `react-query`, `zod`, `express`, `sqlalchemy`, or `celery`. Leave out dev-only tools and tools used only once.

## 1.5 — Database

Skip this section for frontend-only repositories with no local database.

Look for:

- ORM or schema files: `prisma/schema.prisma`, `ormconfig.*`, `alembic.ini`, `database.yml`
- Environment variable names: `DATABASE_URL`, `DB_HOST`, `MONGO_URI`, `REDIS_URL`
- Dependencies: `pg`, `mysql2`, `mongodb`, `sqlite3`, `redis`, `typeorm`, `sequelize`, `sqlalchemy`

If nothing is found, ask:

> "Does this project use a database? If so, which one?"

## 1.6 — Doc Directory

Ask the user:

> "Where should agent-generated plan files be stored? (e.g., `docs/`, `.github/docs/`, `.claude/docs/`, `plans/`)"

## 1.7 — Testing Workflow

Ask the user:

> "What testing workflow do you follow?"
>
> - **Code-First** — Write code first, then add tests
> - **Test-First** — Write tests before implementation (TDD/BDD)
> - **Skip-Testing** — No automated tests in this project

## 1.8 — Playwright Check

Ask the user:

> "How should the Root Agent's review and the tester agent handle Playwright (browser) checks when the UI changes?"
>
> - **Always** — Always run Playwright when UI changed
> - **None** — Never run Playwright checks
> - **Ask-User** — Ask before running (default)

Default to `Ask-User` if the user does not respond.

## 1.9 — Write PROJECT_OVERVIEW.md

Write all findings to [PROJECT_OVERVIEW.md](../../../references/PROJECT_OVERVIEW.md).
