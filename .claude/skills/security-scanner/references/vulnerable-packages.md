# Vulnerable Package Watchlist

Use a real advisory scanner when one is available — it is always more current than this
list:

```bash
npm audit --json                      # Node.js
pip-audit --format=json               # Python
govulncheck ./...                     # Go
dotnet list package --vulnerable      # .NET
bundle-audit check --update           # Ruby
mvn dependency-check:check            # Java
cargo audit                           # Rust
osv-scanner -r .                      # Any ecosystem (lockfile-based)
```

This watchlist is the **fallback** for offline or sandboxed reviews, and a prompt for what
to look up. Treat it as a starting point, not an exhaustive database — confirm the exact
CVE and fixed version against the ecosystem advisory database before reporting.

---

## Triage Rules

- **Report** any advisory with CVSS ≥ 7.0 that is reachable from production code.
- **Downgrade** to LOW/INFO for `devDependencies`, test-only packages, and build tooling that
  never ships — state the reasoning in the finding.
- **Check reachability** before escalating: a vulnerable function that the codebase never
  calls is INFO, not HIGH. Grep for the affected API.
- **Flag structurally**, even without a CVE: packages unmaintained for 2+ years, packages
  with a single maintainer and high download counts, versions pinned years behind with no
  upstream fix path, and typosquat-shaped names (`lodahs`, `crossenv`, `python-dateutil`
  vs `dateutil`).
- **Lockfile integrity** — no lockfile committed, `resolved` URLs pointing at non-official
  registries, or `postinstall` scripts in transitive dependencies (supply-chain risk).

---

## npm

| Package                                     | Risk                                                              |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `lodash` < 4.17.21                          | Prototype pollution in `merge`/`set`/`zipObjectDeep`              |
| `axios` < 1.8.2                             | SSRF and credential leak on redirect; earlier CSRF token leakage  |
| `jsonwebtoken` < 9.0.0                      | Algorithm confusion; `alg:none` acceptance with weak verification |
| `minimist` < 1.2.6                          | Prototype pollution                                               |
| `node-fetch` < 2.6.7                        | Redirect leaks `Authorization`/`Cookie` headers to a new host     |
| `express` < 4.20.0                          | `res.redirect` open redirect / response-splitting variants        |
| `next` < 14.2.25                            | Middleware auth bypass via crafted headers                        |
| `ws` < 8.17.1                               | DoS via excess headers                                            |
| `tar` < 6.2.1                               | Path traversal on extraction                                      |
| `semver` < 7.5.2                            | ReDoS                                                             |
| `braces` / `micromatch`                     | ReDoS in older versions (transitive via build tooling)            |
| `serialize-javascript`                      | XSS via unescaped output in older versions                        |
| `xlsx` (SheetJS)                            | Prototype pollution / ReDoS; npm-registry copy is unmaintained    |
| `event-stream`, `ua-parser-js`, `coa`, `rc` | Historic compromised releases — verify version                    |

## pip

| Package                 | Risk                                                      |
| ----------------------- | --------------------------------------------------------- |
| `Pillow` < 10.3.0       | Multiple buffer overflows in image parsing                |
| `PyYAML` < 5.4          | `yaml.load` RCE — require `SafeLoader` regardless         |
| `requests` < 2.32.0     | Certificate verification bypass; `.netrc` credential leak |
| `urllib3` < 2.2.2       | Redirect header leakage, proxy-auth leak                  |
| `Django` < 4.2.x LTS    | SQLi in `Trunc`/`Extract`, DoS in several parsers         |
| `Flask` < 2.3.2         | Session cookie leakage via caching proxies                |
| `cryptography` < 42.0.4 | NULL-pointer and PKCS#7/PKCS#12 parsing issues            |
| `Jinja2` < 3.1.4        | Sandbox escape / HTML attribute injection                 |
| `Werkzeug` < 3.0.6      | Debugger RCE and path traversal on Windows                |
| `numpy` < 1.22          | `pickle`-related deserialization concerns in older APIs   |

## Maven / Gradle

| Package                                 | Risk                                          |
| --------------------------------------- | --------------------------------------------- |
| `log4j-core` 2.0–2.16                   | Log4Shell RCE (CVE-2021-44228) and follow-ups |
| `spring-core` / `spring-beans` < 5.3.18 | Spring4Shell RCE                              |
| `spring-security` (misconfigured)       | Path-matching bypass in older versions        |
| `jackson-databind` < 2.13.4.2           | Deserialization RCE gadget chains             |
| `snakeyaml` < 2.0                       | Unsafe constructor RCE                        |
| `commons-text` < 1.10                   | Text4Shell interpolation RCE                  |
| `commons-collections` 3.x               | Classic deserialization gadget                |
| `xstream` < 1.4.20                      | Deserialization RCE                           |
| `netty` < 4.1.100                       | Request smuggling / header validation         |

## RubyGems

| Package             | Risk                                                |
| ------------------- | --------------------------------------------------- |
| `nokogiri` < 1.16.5 | Bundled libxml2/libxslt memory-safety CVEs          |
| `rails` < 7.x patch | Various — check the current advisory for the series |
| `rack` < 3.0.9.1    | Header parsing DoS, ReDoS                           |
| `puma` < 6.4.2      | HTTP request smuggling                              |
| `devise` (older)    | Session/token handling weaknesses                   |
| `loofah`            | XSS sanitizer bypasses in older versions            |

## Cargo

| Package                      | Risk                                           |
| ---------------------------- | ---------------------------------------------- |
| `time` < 0.2.23              | Segfault via `unsafe` in local-offset handling |
| `openssl` bindings (older)   | Use-after-free / verification bypass           |
| `smallvec` < 1.6.1           | Buffer overflow                                |
| `chrono` (older)             | Depends on the vulnerable `time` versions      |
| `rustls` (pre-1.0 series)    | Certificate validation edge cases              |
| Any crate flagged in RustSec | `cargo audit` is authoritative here            |

## Go Modules

| Package                            | Risk                                         |
| ---------------------------------- | -------------------------------------------- |
| `golang.org/x/crypto` (older)      | SSH server DoS, terminal parsing issues      |
| `golang.org/x/net` (older)         | HTTP/2 rapid-reset DoS, header smuggling     |
| `gopkg.in/yaml.v2` < 2.2.8         | Unbounded alias expansion (billion laughs)   |
| `github.com/gin-gonic/gin` < 1.9.1 | Header/path handling issues                  |
| Go stdlib below the current minor  | Track `govulncheck` — stdlib CVEs are common |

---

## Reporting Format

Report dependency findings as a single grouped section rather than one card per package —
see [`report-format.md`](./report-format.md). Include package, current version, fixed
version, CVE ID, CVSS, whether the vulnerable API is reachable, and whether it is a runtime
or dev-only dependency.
