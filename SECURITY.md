# Security Policy

## Supported Versions

This is a starter template maintained on a rolling basis. Security attention is given to the `main`
branch only — there are no maintenance releases or backported fixes.

| Version            | Supported                                         |
| ------------------ | ------------------------------------------------- |
| `main` (latest)    | ✅ Yes                                            |
| Older tags / forks | ❌ No — forks maintain their own security posture |

## Security Surface

The starter ships authentication and authorization machinery that warrants a disclosure policy:

- PASETO v4 local tokens for session management
- bcrypt password hashing (configurable cost factor)
- Role-based access control (RBAC) with permission-checked endpoints
- Rate limiting on authentication endpoints
- Database-backed refresh-token / session revocation

A misconfiguration of these components in a downstream fork can become a real vulnerability, so we
keep a private channel for coordinated disclosure.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report privately via **[GitHub Private Vulnerability Reporting](https://github.com/ResetShop/angular-nx-standalone-starter/security/advisories/new)**.
This keeps the report confidential until a fix is available.

## Response Expectations

This is an open-source project maintained on a best-effort basis — no formal SLA is committed. We
aim to acknowledge your report within **7 business days** and to keep you updated as we investigate
and remediate, but cannot guarantee specific timelines given maintainer capacity.

## Out of Scope

- Vulnerabilities in third-party dependencies — report those to the dependency's own maintainers.
- Issues requiring physical access or social engineering.
- Vulnerabilities introduced by a fork's own configuration or deployment — forks own their security posture.
