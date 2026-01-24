# CLAUDE.md - myGenAssist Studio

This file provides guidance for AI assistants working on this codebase.

---

## Project Overview

**myGenAssist Studio** is a desktop companion application for myGenAssist, Bayer's internal AI platform. It provides enterprise employees with a native desktop experience for AI-powered productivity tools.

### Origin and Architecture

- **Upstream source**: Eigent (https://github.com/eigent-ai/eigent) - open-source multi-agent AI desktop application
- **Approach**: Thin wrapper - minimal modifications to upstream, Bayer-specific branding and authentication layer
- **Target audience**: Internal Bayer employees
- **Distribution**: Internal enterprise deployment

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite 5** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Flow** (@xyflow/react) - Node-based visual workflows
- **Zustand 5** - Lightweight state management

### Desktop
- **Electron 33** - Cross-platform desktop wrapper
- **electron-builder** - Application packaging and distribution

### Backend (Embedded)
- **FastAPI** - Python web framework
- **Python 3.10** - Runtime
- **CAMEL-AI** - AI agent framework
- **uv** - Python package manager

### Internationalization
- **i18next** - Translation framework
- **Supported languages** (11): Arabic, German, English, Spanish, French, Italian, Japanese, Korean, Russian, Simplified Chinese, Traditional Chinese

---

## Key Directories

```
myGenAssist-Studio/
├── src/                      # Frontend source
│   ├── components/           # React components (30+ components)
│   ├── pages/                # Page-level components
│   ├── store/                # Zustand state stores
│   ├── hooks/                # Custom React hooks
│   ├── i18n/locales/         # Translation files (11 languages)
│   ├── api/                  # API client code
│   ├── lib/                  # Utility libraries
│   ├── types/                # TypeScript type definitions
│   └── assets/               # Static assets
├── electron/                 # Electron application
│   ├── main/                 # Main process code
│   └── preload/              # Preload scripts
├── backend/                  # Embedded Python backend
│   ├── app/                  # FastAPI application
│   ├── lang/                 # Backend translations
│   └── tests/                # Backend tests
├── build/                    # App icons (icns, ico, png)
├── server/                   # Server configurations
├── scripts/                  # Build and utility scripts
├── config/                   # Configuration files
├── test/                     # Frontend tests
└── .beads/                   # Issue tracker database
```

---

## Development Commands

### Primary Commands

```bash
# Start development server (frontend + electron)
npm run dev

# Run tests
npm run test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report

# Type checking
npm run type-check
```

### Build Commands

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

### Additional Commands

```bash
# Storybook for component development
npm run storybook

# Preview production build
npm run preview

# Compile backend translations
npm run compile-babel
```

---

## Related Projects

These sibling repositories provide context and reference implementations:

| Project | Path | Purpose |
|---------|------|---------|
| **BayChatGPT-Frontend** | `/Users/gmfsj/dummy-dir/BayChatGPT-Frontend` | SSO implementation patterns, Bayer logos, BayondUI color system |
| **myGenAssist-Backend** | `/Users/gmfsj/dummy-dir/myGenAssist-Backend` | API endpoints and backend services |
| **myGenAssist-documentation** | `/Users/gmfsj/dummy-dir/myGenAssist-documentation` | SSO credentials, architecture docs |
| **Eigent (upstream)** | `/Users/gmfsj/dummy-dir/eigent` | Original upstream project |

---

## Branding Guidelines

### Product Identity

- **Product name**: myGenAssist Studio
- **App ID**: `com.bayer.mygenassist-studio`
- **OAuth protocol handler**: `mygenassist-studio://`
- **Support contact**: mygenassist@bayer.com

### Visual Identity

- **Design system**: BayondUI (Bayer's internal design system)
- **Primary color**: `#1FBD81` (green)
- **Logo assets**: Reference BayChatGPT-Frontend for approved Bayer logos

### Naming Conventions

- Use "myGenAssist Studio" in user-facing text
- Use "mygenassist-studio" for technical identifiers (URLs, file names)
- Never abbreviate to "MGA" or "MGAS" in user-facing content

---

## SSO / Authentication

### Azure AD Configuration

Authentication is handled via Azure AD using MSAL (Microsoft Authentication Library).

| Environment | Client ID | Tenant ID |
|-------------|-----------|-----------|
| Development | `620f686c-ab5d-483c-b702-ed1b6e878245` | `fcb2b37b-5da0-466b-9b83-0014b67a7c78` |
| Production | See myGenAssist-documentation | Same tenant |

### Implementation Reference

The SSO implementation pattern is documented in:
- **Reference**: `BayChatGPT-Frontend/utils/auth/`
- **Pattern**: PKCE flow with deep link callback
- **Redirect URI**: `mygenassist-studio://auth/callback`

### Authentication Flow

1. App initiates MSAL login with PKCE
2. User authenticates via Bayer Azure AD
3. Callback received via custom protocol handler
4. Access token stored securely in Electron
5. Token attached to API requests

### Session Expiration Handling

When SSO tokens expire and cannot be refreshed:
- The app automatically clears auth state via `logout()`
- Users see a toast notification with a "Log out" action button
- Clicking the button or automatic handling redirects to `/login`
- Use `logoutAndRedirect()` helper for consistent behavior across the codebase

### SSO Token Lifecycle

The SSO integration handles token expiration gracefully:

1. **Token Validation**: `tokenManager.ts` checks if token is expiring soon (< 5 min)
2. **Silent Refresh**: Attempts `acquireTokenSilent()` via MSAL
3. **Refresh Failure**: If MSAL refresh token expired (~24h):
   - Calls `logout()` to clear auth state
   - Callers handle UI feedback (toast) and redirect to login
4. **Helper Function**: Use `logoutAndRedirect()` from authStore for programmatic session expiration

```typescript
// For programmatic logout + redirect (e.g., in API interceptors)
import { logoutAndRedirect } from '@/store/authStore';
logoutAndRedirect();

// For user-initiated logout with custom cleanup
import { getAuthStore } from '@/store/authStore';
getAuthStore().logout();
navigate('/login');
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/tokenManager.ts` | Token validation and refresh logic |
| `src/lib/msal/authInstance.ts` | MSAL configuration and silent token acquisition |
| `src/store/authStore.ts` | Auth state management and `logoutAndRedirect()` helper |
| `src/api/http.ts` | HTTP interceptors with auth error handling |

---

## API Configuration

### Endpoints

| Environment | Base URL |
|-------------|----------|
| Development | `https://dev.chat.int.bayer.com/api/v3` |
| Production | `https://chat.int.bayer.com/api/v3` |

### API Compatibility

- **Protocol**: OpenAI-compatible API endpoints
- **Authentication**: Bearer token (from Azure AD)
- **Content-Type**: `application/json`

### Key Endpoints

```
POST /chat/completions     # Chat completions
POST /embeddings           # Text embeddings
GET  /models               # Available models
```

---

## Beads Issue Tracker

This project uses the **beads** issue tracker for work management.

### Current Epic

- **Epic ID**: `bd-475`
- **Title**: "Rebrand Eigent to myGenAssist Studio"

### Common Commands

```bash
# List all open issues
bd list

# Show ready-to-work tasks (no blockers)
bd ready

# Show specific issue details
bd show <issue-id>

# Update issue status
bd update <issue-id> --status in_progress

# Close completed issue
bd close <issue-id>
```

### Workflow

1. Check `bd ready` for available tasks
2. Claim task: `bd update <id> --status in_progress`
3. Complete work and verify
4. Close task: `bd close <id>`

---

## Local Development Setup

### Prerequisites

- **Docker Desktop** - installed and running
- **Node.js** - version 18.0.0 or higher
- **npm** or **yarn** - package manager

### Step 1: Start Local Backend (Required)

The local backend provides PostgreSQL database and FastAPI server for storing provider configurations.

```bash
cd server
cp .env.example .env  # If .env doesn't exist
docker compose up -d
```

- PostgreSQL + FastAPI API server starts in Docker
- API available at: `http://localhost:3001`
- API documentation at: `http://localhost:3001/docs`

### Step 2: Configure Environment

Ensure `.env.development` contains:

```bash
VITE_USE_LOCAL_PROXY=true
VITE_PROXY_URL=http://localhost:3001
```

### Step 3: Start Frontend

```bash
npm install
npm run dev
```

### Step 4: Configure Model Provider

1. Go to **Settings > Models**
2. In the **OpenAI Compatible** section (pre-configured for myGenAssist):
   - **API Host**: `https://dev.chat.int.bayer.com/api/v2`
   - **API Key**: Auto-filled from SSO token
   - **Model Type**: `claude-sonnet-4.5` (or other available models)
3. Click **Save** to validate and store configuration

---

## Architecture Overview

| Layer | Technology | Description |
|-------|------------|-------------|
| Frontend | React + Vite + Electron | User interface and desktop wrapper |
| Local Backend | FastAPI + PostgreSQL (Docker) | Provider config storage and API proxy |
| Authentication | Azure AD SSO | Enterprise single sign-on |
| Model API | OpenAI-compatible | myGenAssist endpoint at `dev.chat.int.bayer.com` |

### Key Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_USE_LOCAL_PROXY` | Enable local backend proxy | `true` |
| `VITE_PROXY_URL` | Local backend URL | `http://localhost:3001` |
| `VITE_AZURE_CLIENT_ID` | Azure AD app client ID | `620f686c-ab5d-...` |
| `VITE_AZURE_TENANT_ID` | Azure AD tenant ID | `fcb2b37b-5da0-...` |

---

## Development Notes

### Upstream Sync Strategy

This is a fork with a "thin wrapper" approach:
- Minimize divergence from upstream Eigent
- Keep Bayer-specific changes isolated
- Periodically sync with upstream for bug fixes and features

### Branch Strategy

- **main**: Upstream Eigent open-source branch - kept in sync with https://github.com/eigent-ai/eigent
- **bayer-main**: Bayer's adapted version with SSO integration and enterprise customizations
- Periodically merge `main` into `bayer-main` to incorporate upstream fixes and features
- Keep Bayer-specific changes isolated to minimize merge conflicts

### Testing

- Frontend: Vitest with React Testing Library
- E2E: Playwright
- Backend: pytest

---

## Security Considerations

- Never commit credentials or tokens
- Use environment variables for sensitive configuration
- SSO tokens should only be stored in secure Electron storage
- All API communication must use HTTPS
