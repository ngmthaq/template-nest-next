# Language & Framework Patterns

Load the sections matching the stack detected in Step 1. Each lists the entry points where
untrusted data arrives, the sinks where it becomes dangerous, and the framework-specific
traps.

---

## JavaScript / TypeScript

**Sources:** `req.body`, `req.query`, `req.params`, `req.headers`, `req.cookies`, `req.files`,
WebSocket messages, `postMessage` events, `location.hash`.

**Sinks:** `child_process.exec`/`execSync`, `eval`, `new Function`, `vm.runInThisContext`,
`innerHTML`, `dangerouslySetInnerHTML`, `fs.readFile`/`sendFile` with a joined path,
`JSON.parse` into a prototype-sensitive merge, raw DB `query()`.

**Express** — `express.json()` with no size limit (DoS); missing `helmet()`; `cors({ origin: true })`
or reflecting `Origin` with `credentials: true`; error middleware returning `err.stack`;
`app.use(express.static)` over a user-writable directory.

**React** — `dangerouslySetInnerHTML`; `href`/`src` bound to user input allowing `javascript:`;
secrets in `REACT_APP_*`/`NEXT_PUBLIC_*` (shipped to the browser); `localStorage` holding
tokens (XSS-readable — prefer `HttpOnly` cookies).

**Next.js** — `getServerSideProps` leaking server-only data into props; API routes without
auth checks; middleware matcher gaps that skip protected paths; server actions that trust
client-supplied IDs.

**Prototype pollution** — recursive `merge`/`extend`/`set` on user JSON reaching `__proto__`
or `constructor.prototype`; vulnerable `lodash.merge`, `deep-extend`, `query-string` parsers.

**ORM escape hatches** — `sequelize.literal`, `knex.raw`, TypeORM
`createQueryBuilder().where("... " + input)`, Prisma `$queryRawUnsafe`.

---

## Python

**Sources:** `request.args`, `request.form`, `request.json`, `request.files`, `request.headers`,
`sys.argv`, environment-driven config.

**Sinks:** `os.system`, `subprocess` with `shell=True`, `eval`/`exec`, `pickle.loads`,
`yaml.load` (without `SafeLoader`), `open()` on a joined path, raw cursor `execute` with
f-strings.

**Django** — `Model.objects.extra()` / `.raw()` with interpolation; `mark_safe` and
`{% autoescape off %}`; `DEBUG = True` in production (leaks settings and stack traces);
`ALLOWED_HOSTS = ["*"]`; `SECRET_KEY` hardcoded in `settings.py`; missing
`CsrfViewMiddleware`; permission checks in views but not in DRF serializers/viewsets.

**Flask** — `render_template_string` on user input (SSTI → RCE); `app.run(debug=True)`
(Werkzeug console = RCE); `session` signed with a weak `SECRET_KEY`;
`send_file`/`send_from_directory` with an unresolved path.

**FastAPI** — dependency-injected auth declared but not applied to every route; response
models that leak fields (`orm_mode` over a full user record); `Body(...)` accepting extra
fields into a DB update (mass assignment).

**Requests/urllib** — `verify=False`; user-controlled URLs (SSRF).

---

## Java

**Sources:** `@RequestParam`, `@PathVariable`, `@RequestBody`, `HttpServletRequest`, JMS/Kafka payloads.

**Sinks:** `Runtime.getRuntime().exec`, `ProcessBuilder` with a concatenated command,
`Statement.executeQuery` with `+`, `ObjectInputStream.readObject`, `Class.forName` on user
input, `new File(base + userPath)`.

**Spring Boot** — Actuator endpoints exposed unauthenticated (`/env`, `/heapdump`);
`@CrossOrigin("*")` with credentials; `permitAll()` patterns broader than intended;
`@PreAuthorize` missing on service methods reachable by other paths; SpEL evaluation of user
input; `spring.jpa.show-sql` logging parameters.

**Persistence** — JPQL/HQL string concatenation; `@Query(nativeQuery = true)` with `+`;
MyBatis `${}` (interpolated) instead of `#{}` (bound).

**XML/serialization** — `DocumentBuilderFactory` without
`FEATURE_SECURE_PROCESSING` (XXE); Jackson `enableDefaultTyping`; Log4j `<2.17` (JNDI).

---

## PHP

**Sources:** `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `$_FILES`, `$_SERVER['HTTP_*']`.

**Sinks:** `eval`, `system`/`exec`/`shell_exec`/`passthru`/backticks, `include`/`require`
with a variable (LFI/RFI), `unserialize` (object injection), `mysqli_query` with
concatenation, `extract()` on request data, `move_uploaded_file` without extension and MIME
validation.

**Laravel** — `DB::raw` with interpolation; `$fillable`/`$guarded` too permissive with
`Model::create($request->all())`; `{!! !!}` unescaped Blade output; `APP_DEBUG=true` in
production; policies defined but not invoked (`authorize()` missing).

**General** — loose comparison `==` on hashes or tokens (type juggling, `"0e123" == "0e456"`);
`md5()` for passwords; missing `password_verify`.

---

## Go

**Sources:** `r.URL.Query()`, `r.FormValue`, `r.Header`, `mux.Vars(r)`, request bodies.

**Sinks:** `exec.Command("sh", "-c", input)`, `db.Query(fmt.Sprintf(...))`,
`template.HTML(input)` (bypasses `html/template` escaping), `os.Open(filepath.Join(base, input))`
without `filepath.Clean` + prefix check, `http.Get(userURL)` (SSRF).

**Traps** — using `text/template` instead of `html/template` for HTML output; ignored `error`
returns on security-critical calls; `tls.Config{InsecureSkipVerify: true}`; `math/rand`
instead of `crypto/rand` for tokens; missing `Server.ReadTimeout` (slowloris); goroutines
mutating shared state without a mutex (race in auth/balance logic).

---

## Ruby

**Sources:** `params`, `request.headers`, `cookies`, uploaded files.

**Sinks:** `eval`, `send`/`public_send` with a user-supplied method name, backticks and
`system`, `Marshal.load`, `YAML.load` (use `safe_load`), `constantize` on user input,
`File.read(params[:path])`.

**Rails** — `where("name = '#{params[:q]}'")` instead of a bound hash or `?` placeholder;
`permit!` or `params.require(:user).permit!` (mass assignment); `html_safe` / `raw` on user
content; `skip_before_action :verify_authenticity_token` on state-changing controllers;
strong-parameter allowlists that include `role` or `admin`; `secret_key_base` committed.

---

## Rust

**Sources:** Axum/Actix extractors (`Query`, `Json`, `Path`), header maps, CLI args.

**Sinks:** `Command::new("sh").arg("-c")`, `sqlx::query()` built via `format!` (use the
compile-time-checked `query!` macro or bind parameters), `unsafe` blocks handling
attacker-controlled lengths or pointers.

**Traps** — `unwrap()`/`expect()` on user input (panic → DoS); integer arithmetic that wraps
in release mode (use `checked_add`/`saturating_*` for financial or index math);
`rand::thread_rng` for tokens where a CSPRNG (`rand::rngs::OsRng`, `ring`) is required;
`dangerous_configuration()` / disabled certificate verification in `rustls`/`reqwest`.

---

## .NET / C#

**Sources:** `Request.Query`, `Request.Form`, `[FromBody]`, `Request.Headers`, route values.

**Sinks:** `SqlCommand` with string concatenation (use `SqlParameter`), `Process.Start` with
a composed argument string, `BinaryFormatter` / `JsonConvert` with `TypeNameHandling.All`,
`Path.Combine` with unvalidated user segments, `@Html.Raw`.

**Traps** — `[ValidateAntiForgeryToken]` missing on POST actions; `[Authorize]` on the
controller but `[AllowAnonymous]` left on an action; over-posting into EF entities (bind an
explicit DTO); `ServerCertificateValidationCallback` returning `true`; secrets in
`appsettings.json` committed to source.
