# Vulnerability Categories

Tools catch syntax; this reference catches logic. For every category, trace the flow
`[untrusted source] → [processing] → [dangerous sink]` and ask what an attacker controls.

---

## Injection

### SQL Injection (CWE-89)

```js
// ❌ String concat / template literals reach the query — both are unsafe
const q = "SELECT * FROM users WHERE email = '" + req.body.email + "'";
const q = `SELECT * FROM users WHERE id = ${req.params.id}`;

// ✅ Parameterized query — input is data, never SQL
db.execute("SELECT * FROM users WHERE email = ?", [req.body.email]);
User.findOne({ where: { email: req.body.email } }); // ORM bound params
```

**Detection signals:** `.query()`, `.execute()`, `.raw()`, `.exec()` with any `+` or `${}`
near user input; ORM escape hatches (`sequelize.literal`, `Model.objects.extra`,
`createQueryBuilder().where(...)` with interpolation); dynamic `ORDER BY` / table names
(parameters cannot bind identifiers — require an allowlist).

**Second-order SQLi:** a value stored in the DB then concatenated into a later query. Check
that reads from the DB are not treated as trusted at the sink.

### Cross-Site Scripting — XSS (CWE-79)

```jsx
// ❌ Raw HTML injection — attacker injects <script> or event handlers
<div dangerouslySetInnerHTML={{ __html: userComment }} />;
document.getElementById("out").innerHTML = userInput;

// ✅ Text content only (React escapes by default); sanitize if HTML is required
<div>{userComment}</div>
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />
```

**Detection signals:** `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`,
`eval`, `new Function`, `$(...).html()`, `v-html`, `dangerouslySetInnerHTML`; unescaped
server-side template output — `{{{ var }}}` (Handlebars), `| safe` / `{% autoescape off %}`
(Jinja2/Django), `<%= raw %>` (ERB), `@Html.Raw` (Razor).

**Also check:** `href={userInput}` and `src={userInput}` allowing `javascript:` URLs, and
reflected values in error pages.

### Command Injection (CWE-78)

```python
# ❌ User input reaches the shell — attacker appends "; rm -rf /"
os.system(f"convert {filename} output.png")
subprocess.call("convert " + filename, shell=True)

# ✅ Argument list form — no shell interpretation; allowlist input first
if not re.match(r'^[\w\-]+\.pdf$', filename):
    raise ValueError("Invalid filename")
subprocess.run(["convert", filename, "output.png"])
```

**Detection signals:** `child_process.exec` / `execSync` (Node.js — prefer `execFile`),
`Runtime.getRuntime().exec` with a concatenated string (Java), `shell=True` (Python),
backticks and `system()` (Ruby/PHP), `exec.Command("sh", "-c", ...)` (Go).

### Other Injection Sinks

- **LDAP** — user input in a filter string without escaping `()*\|&`.
- **XPath** — concatenated node expressions.
- **Header / response splitting** — `\r\n` in a redirect target or a `Set-Cookie` value.
- **Log injection** — unescaped newlines in log lines, enabling forged log entries.
- **Template injection (SSTI)** — user input compiled as a template (`render_template_string`,
  Handlebars `compile`, Thymeleaf expressions) rather than passed as data.

---

## Authentication & Access Control

### Broken Authorization / IDOR / BOLA (CWE-284, CWE-639)

```js
// ❌ Authenticated but not authorized — any user can fetch any invoice
app.get("/invoice/:id", authenticate, async (req, res) => {
  res.json(await Invoice.findById(req.params.id));
});

// ✅ Scope the query to the requesting user's ownership
res.json(await Invoice.findOne({ _id: req.params.id, ownerId: req.user.id }));
```

Check **every** DB lookup by a user-supplied ID for a secondary ownership filter. Check
admin routes for role-enforcement middleware. Missing authentication entirely on a
sensitive route is CRITICAL, not HIGH.

### JWT Weaknesses

- `algorithms` not pinned on verify → `alg: none` or HS256/RS256 confusion attack.
- Weak or hardcoded signing secret; the same secret across environments.
- `exp` not validated, or an expiry measured in months.
- Sensitive claims trusted from an unverified decode (`jwt.decode` instead of `jwt.verify`).
- No revocation path for compromised tokens.

### CSRF (CWE-352)

```js
// ❌ State-changing endpoint with cookie auth, no origin check
app.post("/transfer", handler);

// ✅ Synchronizer token or SameSite cookie
app.use(csrf());
// Set-Cookie: session=x; SameSite=Strict; Secure; HttpOnly
```

APIs authenticating **only** via an `Authorization: Bearer` header are not CSRF-vulnerable —
custom headers cannot be sent cross-origin by default. Do not report those.

### Mass Assignment (CWE-915)

Never pass `req.body` straight into a model constructor or `update` — an attacker adds
`isAdmin: true`. Allowlist explicitly:
`User.create({ name: req.body.name, email: req.body.email })`.

### Session & Privilege

- Session ID not rotated after login (fixation).
- Missing `HttpOnly` / `Secure` / `SameSite` on session cookies.
- Role checked client-side only, or derived from a user-supplied field.
- Password reset tokens that are predictable, long-lived, or not single-use.

---

## Data Handling

### Sensitive Data Exposure (CWE-200, CWE-312, CWE-798)

```python
# ❌ Secret committed to source
STRIPE_SECRET_KEY = "sk_live_abc123"

# ✅ Environment variable only
STRIPE_SECRET_KEY = os.environ["STRIPE_SECRET_KEY"]
```

Verify: stack traces are not returned in production responses; password hashes and tokens
are excluded from API serializers; PII is not written to logs or analytics; `.env` is in
`.gitignore`; backups and exports are access-controlled.

### Path Traversal (CWE-22)

User-controlled path segments reaching `open`, `readFile`, `sendFile`, `os.path.join`, or
archive extraction (`zip-slip`). Resolve the absolute path and assert it stays inside the
intended base directory — sanitising `../` by string replacement is not sufficient.

### SSRF (CWE-918)

```js
// ❌ Attacker passes http://169.254.169.254/latest/meta-data/
const data = await fetch(req.query.webhook);

// ✅ Hostname allowlist — parse and verify before fetching
const parsed = new URL(req.query.webhook);
if (!ALLOWED_DOMAINS.includes(parsed.hostname))
  throw new Error("Disallowed domain");
const data = await fetch(req.query.webhook);
```

High-risk surfaces: webhook registration, URL previews, PDF/screenshot generators, image
proxies, importers. Also block redirects to internal ranges and `file://` / `gopher://`.

### Insecure Deserialization (CWE-502)

`pickle.loads`, `yaml.load` without `SafeLoader`, `ObjectInputStream`, PHP `unserialize`,
`Marshal.load` (Ruby), and `JsonConvert` with `TypeNameHandling.All` on untrusted bytes.

### XXE (CWE-611)

XML parsers with external entity resolution enabled — disable DTDs and external entities
explicitly (`libxml_disable_entity_loader`, `XMLConstants.FEATURE_SECURE_PROCESSING`,
`defusedxml`).

### Transport & Storage

- Missing TLS on internal service calls; `rejectUnauthorized: false`, `verify=False`,
  `InsecureSkipVerify: true`.
- Secrets or PII stored unencrypted at rest; passwords hashed with a fast algorithm instead
  of bcrypt/scrypt/Argon2.

---

## Cryptography

- MD5, SHA1, or DES used for a security purpose (signatures, password hashing, tokens).
- Hardcoded IVs, salts, or keys; an IV reused across encryptions.
- ECB mode; encryption without authentication (use AES-GCM or encrypt-then-MAC).
- `Math.random()`, `rand()`, or a time-seeded PRNG generating tokens, session IDs, OTPs, or
  password-reset links — require a CSPRNG (`crypto.randomBytes`, `secrets`, `SecureRandom`).
- Non-constant-time comparison of secrets or MACs (`==` instead of `timingSafeEqual`).

---

## Business Logic

- **Race conditions (TOCTOU)** — check-then-act on balances, coupon redemption, inventory,
  or idempotency without a transaction, row lock, or unique constraint.
- **Integer/float issues** — floats for currency; overflow or negative quantities in
  financial math; missing bounds checks on user-supplied amounts.
- **Missing rate limiting** — login, password reset, OTP, signup, and any expensive or
  outbound-request endpoint.
- **Predictable identifiers** — sequential IDs on sensitive resources exposed without an
  ownership check (chains directly into IDOR).
- **Workflow bypass** — an endpoint that lets a client skip a required prior step (payment,
  verification, approval).

---

## Input Validation

Validate shape and type at every entry point with a schema library (Zod, Joi, Pydantic,
Bean Validation). Unvalidated input reaching any sink above is an automatic flag. Never
accept secrets in query parameters — they land in logs and referrers; use headers.
