# myGenAssist Studio - Rebranding Design

## Overview

Repurpose the Eigent desktop app as "myGenAssist Studio" - a desktop complement to the myGenAssist web app for internal Bayer users.

## Design Decisions

| Aspect | Decision |
|--------|----------|
| **Name** | myGenAssist Studio |
| **Audience** | Internal Bayer employees |
| **Relationship to web** | Complement (not replacement) |
| **Upstream strategy** | Thin wrapper - minimal fork, easy Eigent updates |
| **Backend integration** | Direct API via OpenAI-compatible endpoints to myGenAssist-Backend |
| **Authentication** | Minimal Azure AD OAuth adaptation |
| **Visual identity** | Consistent with myGenAssist brand family (BayondUI colors) |

## Changes Required

### 1. Core Config Files (Critical)

| File | Changes |
|------|---------|
| `package.json` | `name`: "mygenassist-studio", `description`: "myGenAssist Studio", `author`: "Bayer" |
| `electron-builder.json` | `productName`: "myGenAssist Studio", `appId`: "com.bayer.mygenassist-studio", OAuth protocol: "mygenassist-studio" |
| `index.html` | `<title>`: "myGenAssist Studio", remove Amplitude tracking |

### 2. App Icons (build/)

Replace with myGenAssist-branded icons:
- `build/icon.icns` (macOS)
- `build/icon.ico` (Windows)
- `build/icon.png` (Linux)
- `public/favicon.ico`

Source assets available at:
- `/Users/gmfsj/dummy-dir/BayChatGPT-Frontend/public/logos/mygenassist_logo.svg`
- `/Users/gmfsj/dummy-dir/BayChatGPT-Frontend/public/logos/mygenassist_logo.png`

### 3. OAuth Protocol Handler

Files to update:
- `electron-builder.json` - protocol name and schemes
- `src/lib/oauth.ts` - protocol scheme reference
- `electron/main/index.ts` - protocol handler

Change `eigent://` to `mygenassist-studio://`

### 4. API Configuration

Files to update:
- `.env.development` - Add myGenAssist backend URLs
- `src/api/` - Endpoint configuration

Add environment configs:
```
MYGENASSIST_API_DEV=https://dev.chat.int.bayer.com/api/v3
MYGENASSIST_API_TEST=https://test.chat.int.bayer.com/api/v3
MYGENASSIST_API_PROD=https://chat.int.bayer.com/api/v3
```

### 5. i18n Localization (11 languages)

Update brand references in all locale files:
- `src/i18n/locales/*/setting.json`
- `src/i18n/locales/*/layout.json`
- `src/i18n/locales/*/chat.json`

Replace "Eigent" with "myGenAssist Studio" in user-facing strings.

### 6. UI Components with Brand References

Key files:
- `src/components/TopBar/index.tsx`
- `src/components/ChatBox/index.tsx`
- `src/components/ChatBox/BottomBox/InputBox.tsx`
- `src/pages/Login.tsx`
- `src/pages/SignUp.tsx`
- `src/pages/Setting/General.tsx`
- `src/pages/Setting/Privacy.tsx`

### 7. Documentation

Update or replace:
- `README.md` - New project description
- `CONTRIBUTING.md` - Update contribution guidelines
- `docs/` - Update documentation references

### 8. Color Scheme (Optional Enhancement)

Apply BayondUI brand colors from `colorConstants.js`:
- Primary brand green: `#1FBD81` (brand.500)
- Secondary: `#108B5F` (brand.600)
- Gray palette: grayDark/grayLight scales

Update in `tailwind.config.js` if desired.

### 9. Files to Remove/Ignore

- `.github/` - GitHub workflows (internal deployment)
- `server/` - Not needed (using myGenAssist-Backend)
- External links to eigent.ai, docs.eigent.ai

## Implementation Order

1. **Phase 1: Core Identity** (Minimal viable rebrand)
   - package.json
   - electron-builder.json
   - index.html
   - Icons (build/, public/)

2. **Phase 2: OAuth & API**
   - Protocol handler changes
   - Azure AD endpoint configuration
   - API URL configuration

3. **Phase 3: UI Text**
   - i18n locale files
   - Component brand references

4. **Phase 4: Cleanup**
   - Documentation updates
   - Remove unnecessary files
   - Color scheme alignment (optional)

## Upstream Merge Strategy

To maintain easy merging with Eigent updates:

1. **Isolate branding changes** - Keep brand-specific values in config files where possible
2. **Minimize code changes** - Prefer configuration over code modification
3. **Document deviations** - Track what differs from upstream in this document
4. **Periodic rebasing** - Rebase on Eigent releases, resolve conflicts in branding files only

## Files Changed Summary

| Category | File Count |
|----------|------------|
| Config files | 3 |
| Icon assets | 4 |
| OAuth/Protocol | 3 |
| i18n locales | ~33 |
| UI components | ~10 |
| Documentation | ~10 |
| **Total** | ~63 files |

Note: Many of the 141 grep matches are in tests, docs, and backend code that may not need changes for a thin wrapper approach.
