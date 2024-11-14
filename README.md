# 🔮 MagicCSV

MagicCSV is a powerful desktop application that allows you to manipulate CSV files using AI assistance. Built with React, TypeScript, and Electron, it provides an intuitive interface for processing CSV data with AI models through Ollama.

## ✨ Features

- 📤 Upload and parse CSV files
- 🤖 AI-powered text processing using Ollama
- 📊 Interactive data grid with AG Grid
- 🎨 Light/Dark theme support
- 📝 Column-aware prompt templates
- ↩️ Undo/Redo capabilities
- 📥 Export to CSV
- 🖥️ Cross-platform desktop application

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- [Ollama](https://ollama.ai) installed and running locally
- Git

## 🚀 Local Development Setup

1. Clone the repository:
```bash
git clone [url]
cd magiccsv
```

2. Install dependencies:
```bash
npm install
```

3. Start Ollama server:
```bash
ollama serve
```

4. Start the development server with Electron:
```bash
npm run electron:dev
```

This will launch both the Vite development server and Electron application in development mode.

## 📦 Building for Production

### Web Build
```bash
npm run build
```

### Electron Release Build
1. Ensure you have an icon file at `src/assets/icon.png` (at least 256x256 pixels)

2. Generate platform-specific icons:
```bash
npm run generate-icons
```

3. Build the application:
```bash
npm run electron:build
```

This will create platform-specific installers in the `release` directory:
- Windows: `release/MagicCSV Setup.exe`
- macOS: `release/MagicCSV.dmg`
- Linux: `release/magiccsv.AppImage`

## 🏗️ Project Structure

```
magiccsv/
├── src/                    # Web application source
│   ├── components/         # React components
│   │   ├── DataGridComponent.tsx
│   │   ├── FileUpload.tsx
│   │   ├── MagicFormula.tsx
│   │   ├── NewCSVDialog.tsx
│   │   └── OllamaSettings.tsx
│   ├── assets/            # Static assets
│   │   └── icon.png
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── theme.ts
│   └── vite-env.d.ts
├── electron/              # Electron-specific code
│   ├── main.js
│   └── tsconfig.electron.json
├── build/                 # Build output
│   └── icons/            # Generated platform icons
├── dist/                 # Production build output
├── release/              # Electron installers
├── resources/           # Additional resources
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 📜 Available Scripts

- `npm run dev` - Start web development server
- `npm run electron:dev` - Start Electron development environment
- `npm run build` - Build web application
- `npm run electron:build` - Build desktop installers
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run generate-icons` - Generate platform-specific icons

## 🎯 Using the Application

1. Start by uploading a CSV file using the "Upload CSV" button
2. Configure Ollama settings in the sidebar (click menu icon)
3. Create a prompt template using @column references
4. Specify the new column name
5. Select rows to process (e.g., "All", "1,2,3", "1 to 10")
6. Click "Run" to start processing
7. Use "Stop" to interrupt processing if needed
8. Export the modified data using the "Export" button

## ⚙️ Ollama Configuration

The application requires a running Ollama instance. By default, it connects to `http://localhost:11434`.

Configuration options:
- Model selection
- Temperature (0.0 - 1.0)
- Top P (0.0 - 1.0)
- System prompt
- Context window size
- Random seed

## 🔧 Troubleshooting

### Common Issues

1. **Electron Build Fails**
   - Ensure you have the correct Node.js version
   - Clear the `node_modules` folder and run `npm install` again
   - Check if `src/assets/icon.png` exists

2. **Ollama Connection Error**
   - Verify Ollama is running (`ollama serve`)
   - Check if the default port (11434) is available
   - Ensure no firewall is blocking the connection

3. **Development Server Issues**
   - Clear the `.vite` cache directory
   - Check for port conflicts (default: 5173)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Acknowledgments

- [Electron](https://www.electronjs.org/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Ollama](https://ollama.ai/)
- [AG Grid](https://www.ag-grid.com/)