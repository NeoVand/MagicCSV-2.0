# 🔮 MagicTable

MagicTable is a desktop application that allows you to manipulate spreadsheet data using AI assistance. Built with React, TypeScript, and Electron, it provides an intuitive interface for processing CSV and Excel files with AI models through Ollama.

## ✨ Features

- 📤 Upload CSV and Excel files (xlsx, xls)
- 🤖 AI-powered text processing using Ollama
- 📊 Interactive data grid with AG Grid
- 🎨 Light/Dark theme support
- 📝 Column-aware prompt templates
- ↩️ Undo/Redo capabilities
- 📥 Export to CSV/Excel
- 🖥️ Cross-platform desktop application

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- [Ollama](https://ollama.ai) installed and running locally

## 🚀 Quick Start

1. Clone and install:
```bash
git clone [url]
cd magictable
npm install
```

2. Start development:
```bash
# Start Ollama server
ollama serve

# Start development environment
npm run electron:dev
```

## 📦 Building

```bash
# Generate icons
npm run generate-icons

# Build installers
npm run electron:build
```

This creates platform-specific installers in the `release` directory.

## 🎯 Using the Application

1. Upload a CSV or Excel file
2. Configure Ollama settings in the sidebar
3. Create a prompt template using @column references
4. Specify the new column name
5. Select rows to process
6. Click "Run" to start processing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.