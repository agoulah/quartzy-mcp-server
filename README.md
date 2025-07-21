# Quartzy MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/agoulah/quartzy-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/agoulah/quartzy-mcp-server/actions/workflows/ci.yml)

A Model Context Protocol (MCP) server that provides seamless access to the Quartzy Public API for laboratory inventory and order management through AI assistants like Claude Desktop.

## 🚀 Quick Start

### Installation

```bash
npm install -g quartzy-mcp-server
```

### Configuration

1. Get your Quartzy access token:
   - Visit [Quartzy AccessToken Settings](https://app.quartzy.com/profile/access-tokens)
   - Click "Add AccessToken"
   - Copy the generated token

2. Configure Claude Desktop by editing your config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "quartzy": {
      "command": "quartzy-mcp-server",
      "env": {
        "QUARTZY_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

3. Restart Claude Desktop

## 🔧 Features

- **Complete API Coverage**: All Quartzy Public API endpoints
- **Inventory Management**: List, search, and update inventory items
- **Order Management**: Create, track, and manage order requests
- **Lab Organization**: Access lab and organizational data
- **Webhook Integration**: Set up and manage webhooks
- **Type-Safe**: Full TypeScript support
- **Error Handling**: Comprehensive error reporting

## 📖 Documentation

- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/agoulah/quartzy-mcp-server/issues).

## 📞 Support

- **Quartzy API Issues**: [Quartzy Support](mailto:support@quartzy.com)
- **MCP Server Issues**: [GitHub Issues](https://github.com/agoulah/quartzy-mcp-server/issues)
- **MCP Protocol**: [MCP Documentation](https://modelcontextprotocol.io/)