# Security Documentation

## Threat Model

### Assets to Protect

1. **User Credentials** (IMAP/SMTP passwords) - CRITICAL
2. **Session Tokens** - HIGH
3. **Email Content** - HIGH
4. **User Data** - MEDIUM
5. **Branding Configuration** - LOW

### Threat Actors

1. **External Attackers** - Network-based attacks
2. **Malicious Insiders** - Server access
3. **Compromised Dependencies** - Supply chain

### Attack Vectors & Mitigations

| Vector | Risk | Mitigation |
|--------|------|------------|
| Credential theft from database | CRITICAL | AES-256-GCM encryption with derived keys |
| Session hijacking | HIGH | Short-lived tokens, secure cookies, CSRF protection |
| XSS attacks | HIGH | CSP headers, input sanitization, React auto-escaping |
| CSRF attacks | HIGH | Double-submit cookies, SameSite=Strict |
| SQL injection | MEDIUM | Parameterized queries, ORM usage |
| Container escape | MEDIUM | Read-only FS, no-new-privileges, capability dropping |
| Man-in-the-middle | MEDIUM | TLS for all external connections |
| Brute force | MEDIUM | Rate limiting, account lockout |
| Log injection | LOW | Structured logging, no credential logging |

## Security Architecture

### Credential Encryption

- Master key stored in Docker secret (never in code/env)
- Per-credential salt using scrypt key derivation
- AES-256-GCM authenticated encryption
- Credentials decrypted only in memory, cleared after use

### Session Security

- JWT tokens with 1-hour expiry
- HttpOnly, Secure, SameSite=Strict cookies
- Automatic session invalidation on password change
- CSRF tokens for all mutations

## Rate Limiting Configuration

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| Auth endpoints | 15 min | 5 |
| API read | 1 min | 100 |
| API write | 1 min | 20 |
| File upload | 1 min | 5 |

## Security Checklist

- [ ] npm audit clean
- [ ] SAST scan passed
- [ ] CSP headers configured
- [ ] HSTS enabled
- [ ] Rate limiting active
- [ ] Secrets in Docker secrets only
- [ ] Read-only filesystem
- [ ] No privileged containers
- [ ] Input validation on all endpoints
- [ ] CSRF protection enabled

## Production Recommendations

1. **Use HTTPS** - Deploy behind a reverse proxy (Traefik, Nginx, Caddy)
2. **Regular Updates** - Keep Docker images and dependencies updated
3. **Backup Secrets** - Securely backup encryption keys
4. **Monitor Logs** - Set up log aggregation and alerting
5. **Network Isolation** - Use Docker networks to isolate services

## Vulnerability Reporting

Report security vulnerabilities to: security@your-domain.com

We follow responsible disclosure and will respond within 48 hours.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/panie18/webmail_launcher/main/scripts/install.sh | bash
```

## Repository

https://github.com/panie18/webmail_launcher

