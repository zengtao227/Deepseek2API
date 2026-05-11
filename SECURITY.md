# Security Policy

## Supported Versions

**Only the latest version** receives security updates.  
If you are using an older version, please upgrade to the latest release.

| Version        | Supported          |
| -------------- | ------------------ |
| latest         | :white_check_mark: |
| < latest       | :x:                |

> **Why?** This project is maintained by a single developer. Keeping only one active version ensures fast response times and avoids legacy maintenance overhead.

## What is a Security Vulnerability?

A **security vulnerability** is a bug that can be exploited to compromise:
- Data confidentiality (e.g., leaking secrets, user data)
- Data integrity (e.g., unauthorized modification)
- System availability (e.g., remote crash, denial of service)
- Privilege escalation (e.g., normal user gains admin rights)

**Examples**: SQL injection, command injection, path traversal, authentication bypass, insecure deserialization, sensitive data exposure.

**What is NOT a security vulnerability?**  
Regular bugs like crashes (without exploit potential), incorrect return values, performance issues, missing features, or documentation typos. Please report those via **GitHub Issues** publicly.

## Reporting a Vulnerability

If you believe you have found a security vulnerability, **please do NOT open a public issue**.

Instead, send an email to: **cjackhwang@qq.com**

Please include as much as possible:
- A clear description of the issue
- Steps to reproduce (code / input / environment)
- Potential impact (what could an attacker do?)
- Suggested fix (if any)

You can expect:
- **Initial response** within 3 business days (acknowledgment)
- **Confirmation or clarification** within 7 days
- **Fix or decision** within 14 days (depending on complexity)

## What to Expect After Reporting

| Outcome            | What happens |
| ------------------ | ------------- |
| **Accepted**       | I will develop a fix, release a patch version, and may credit you in the release notes (unless you prefer anonymity). |
| **Declined**       | I will explain why (e.g., not a security issue, already fixed, out of scope, or requires a larger redesign). |
| **Need more info** | I will ask follow-up questions. If no response within 14 days, the report may be considered stale. |

## Disclosure Policy

- Vulnerabilities will be **fixed privately** and then released as a new version.
- After the fix is released, I will typically publish a short security advisory (via GitHub Security Advisories) without revealing exploit details.
- Public disclosure can be coordinated if you request it.

## Recognition

I appreciate security researchers who follow responsible disclosure. Contributors who report valid, previously unknown vulnerabilities may be acknowledged in the project's README or release notes (unless they prefer to stay anonymous).

---

*Thank you for helping keep this project safe!*
