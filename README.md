# Kindle to Obsidian Highlights Exporter

A desktop application that exports your Kindle highlights from the "My Clippings.txt" file to Markdown files ready for use in Obsidian.

## Features

- Parse Kindle's "My Clippings.txt" file
- Display books sorted by recency (newest first)
- Search/filter functionality to quickly find specific books
- Select which books to export
- Export highlights as separate Markdown files (one per book)
- Remember last used file paths

## Installation

### Windows
Download the latest release from the [Releases](https://github.com/w-wojtak/kindle-to-obsidian-exporter/releases/) page.
You can choose either:
- `.exe` file (portable, no installation required)
- `.msi` installer (recommended for regular use)

## Usage

1. Select your Kindle's "My Clippings.txt" file
2. Choose an output directory for your Markdown files
3. Select which books to export
4. Click "Export Selected Books"
5. Your highlights will be saved as separate Markdown files ready for Obsidian

## Development

This application is built with [Tauri](https://tauri.app/), combining web technologies with Rust.

### Prerequisites
- Node.js
- Rust
- Tauri CLI

### Setup
```bash
# Clone the repository
git clone https://github.com/w-wojtak/kindle-to-obsidian-exporter.git
cd kindle-to-obsidian-exporter

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

 
![app](https://github.com/w-wojtak/kindle-to-obsidian-exporter/blob/main/docs/screenshot.png)

![note1](https://github.com/w-wojtak/kindle-to-obsidian-exporter/blob/main/docs/example.png)



