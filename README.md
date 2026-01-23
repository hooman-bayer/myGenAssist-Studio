# myGenAssist Studio

Internal AI assistant for Bayer employees - a desktop companion app for [myGenAssist](https://chat.int.bayer.com), Bayer's internal AI platform.

## Features

- **Azure AD SSO** - Seamless single sign-on with your Bayer credentials
- **Enterprise Security** - Secure authentication and data handling
- **Multi-agent Workflows** - Visual workflow builder with parallel agent execution
- **Local File Access** - Direct access to local files and documents
- **Terminal Integration** - Built-in terminal for development tasks
- **MCP Tools** - Extensible tool system via Model Context Protocol
- **Offline Capable** - Work with AI models even without constant network

## Quick Start

### Prerequisites

- **Docker Desktop** - installed and running
- **Node.js** >= 18.0.0
- **npm** or **yarn**

### 1. Start Local Backend

The local backend (PostgreSQL + FastAPI) is required for development.

```bash
cd server
cp .env.example .env  # If .env doesn't exist
docker compose up -d
```

- API server: http://localhost:3001
- API docs: http://localhost:3001/docs

### 2. Configure Environment

In `.env.development`, ensure these values are set:

```bash
VITE_USE_LOCAL_PROXY=true
VITE_PROXY_URL=http://localhost:3001
```

### 3. Start Frontend

```bash
npm install
npm run dev
```

### 4. Configure Model Provider

1. Sign in with your Bayer Azure AD credentials
2. Go to **Settings > Models**
3. In **OpenAI Compatible** section:
   - **API Host**: `https://dev.chat.int.bayer.com/api/v2`
   - **API Key**: Auto-filled from SSO token
   - **Model Type**: `claude-sonnet-4.5` (or other available models)
4. Click **Save** to validate and store

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + Vite + Electron | User interface and desktop app |
| Local Backend | FastAPI + PostgreSQL (Docker) | Provider config storage and API proxy |
| Authentication | Azure AD SSO (MSAL) | Enterprise single sign-on |
| Model API | OpenAI-compatible endpoint | `https://dev.chat.int.bayer.com/api/v2` |

## Development

### Commands

```bash
# Start development server
npm run dev

# Run tests
npm run test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage

# Type checking
npm run type-check

# Storybook for component development
npm run storybook
```

### Key Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_USE_LOCAL_PROXY` | Set to `true` for local development |
| `VITE_PROXY_URL` | Local backend URL (`http://localhost:3001`) |
| `VITE_AZURE_CLIENT_ID` | Azure AD application client ID |
| `VITE_AZURE_TENANT_ID` | Azure AD tenant ID |

## Building for Production

```bash
# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build:all
```

### Distribution Files

- **macOS**: `myGenAssist-Studio.dmg`
- **Windows**: `myGenAssist-Studio.Setup.exe`
- **Linux**: `myGenAssist-Studio.AppImage`

## Support

- **Email**: mygenassist@bayer.com
- **Documentation**: https://docs.int.bayer.com/baychatgpt

## Upstream Source

This project is built on [Eigent](https://github.com/eigent-ai/eigent), an open-source multi-agent AI desktop application. We maintain a thin wrapper approach to enable periodic upstream merges while keeping Bayer-specific customizations isolated.

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.
