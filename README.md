# myGenAssist Studio

Desktop companion app for [myGenAssist](https://chat.int.bayer.com) - Bayer's internal AI platform.

## Features

- **Offline-capable AI chat** - Work with AI models even without constant network
- **Multi-agent workflow orchestration** - Visual workflow builder with parallel agent execution
- **Local file access** - Direct access to local files and documents
- **Terminal integration** - Built-in terminal for development tasks
- **MCP Tools** - Extensible tool system via Model Context Protocol

## Installation

Download the latest release for your platform:
- macOS: `myGenAssist-Studio.dmg`
- Windows: `myGenAssist-Studio.Setup.exe`
- Linux: `myGenAssist-Studio.AppImage`

## Configuration

1. Launch myGenAssist Studio
2. Sign in with your Bayer Azure AD credentials
3. The app automatically connects to myGenAssist backend

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for your platform
npm run build:mac
npm run build:win
npm run build:linux
```

## Support

- **Email**: mygenassist@bayer.com
- **Documentation**: https://docs.int.bayer.com/baychatgpt

## Upstream Source

This project is built on [Eigent](https://github.com/eigent-ai/eigent), an open-source multi-agent AI desktop application. We maintain a thin wrapper approach to enable periodic upstream merges.

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.
