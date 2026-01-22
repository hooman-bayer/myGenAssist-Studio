/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
  readonly VITE_PROXY_URL: string
  readonly VITE_USE_LOCAL_PROXY: string
  // Azure AD SSO Configuration
  readonly VITE_AZURE_CLIENT_ID: string
  readonly VITE_AZURE_TENANT_ID: string
  readonly VITE_AZURE_AUTHORITY: string
  readonly VITE_AZURE_AUDIENCE: string
  readonly VITE_AZURE_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: import('electron').ElectronAPI
}
