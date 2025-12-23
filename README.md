# Webmail Launcher

A self-hosted, Docker-based webmail orchestrator with a native webmail client and support for external backends.

## Features

- Native IMAP/SMTP webmail client
- Support for SnappyMail and Roundcube
- Full white-labeling via web UI
- Security-first architecture
- Umbrel OS compatible
- Modern, responsive UI

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/panie18/webmail_launcher/main/scripts/install.sh | bash
```

## Manual Installation

```bash
git clone https://github.com/panie18/webmail_launcher
cd webmail_launcher
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
```

## Configuration

All configuration is done via the web UI. The first user to register becomes admin.

## Security

See [SECURITY.md](SECURITY.md) for security documentation and threat model.

## License

MIT
