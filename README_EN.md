# JRXML Web Designer

This is a JasperReport template designer based on Vue 3, running entirely in the browser without any software installation. After design completion, you can directly download or copy the JRXML file content, ready to use anytime, anywhere.

[中文版本 README](README.md)

## 🎯 Project Positioning

Due to export control restrictions on the official JasperReport Studio, this project aims to provide a lightweight, easy-to-use alternative that meets basic JRXML design needs.

## ✨ Core Features

### Design Features
- 📋 Support for multiple report bands: Title, Page Header, Column Header, Detail, Column Footer, Page Footer, Summary
- 🎨 Rich element library: Static Text, Text Field, Rectangle, Ellipse, Line, Image, Frame, Break
- 📐 Precise grid alignment and snap-to functionality
- 🔄 Complete undo/redo mechanism
- 🔍 Canvas zoom support (25% - 400%)
- 🎯 Precise element positioning and resizing
- 📏 Real-time element property editing
- 🔧 Support for element copy, paste, delete
- ⚡ Drag-and-drop element addition and layout

### Element Property Support
- 📄 Static Text: Content, font, color, alignment
- 🔤 Text Field: Data source field binding, expression support
- 🖼️ Image: URL or Base64 support
- 📐 Graphic elements: Border, fill, rounded corners
- 🔗 Frame: Container support, can nest other elements

### File Management
- 💾 Local storage of design files
- 📁 Support for multi-file management
- 📤 Export JRXML files
- 📥 Import JRXML files
- 🔄 Support for design file version management

### Preview and Testing
- 🖨️ PDF preview functionality (requires preview server configuration)
- 🔍 Real-time JRXML syntax validation

### Internationalization
- 🌐 Support for Chinese and English switching

## 📦 Supported Element Types

| Element Type | Description | Main Properties |
|-------------|-------------|----------------|
| **Static Text** | Fixed content text | Text content, font, size, color, alignment |
| **Text Field** | Dynamic data binding | Data source field, expression, font style, formatting |
| **Rectangle** | Rectangle shape | Width, height, border, fill, rounded corners |
| **Ellipse** | Ellipse shape | Width, height, border, fill |
| **Line** | Straight line element | Start point, end point, line style, color |
| **Image** | Image element | Image URL, size, scaling mode |
| **Frame** | Container element | Width, height, border, can nest other elements |
| **Break** | Force page break | Break position |

## 🛠️ Technical Features

- 📱 Developed with Vue 3 + TypeScript
- 🎨 Built with Vite, supporting hot update
- 📦 Component-based design, easy to extend
- 🧪 Comprehensive unit tests
- 📝 Compliant with JasperReport XSD specifications
- 🔒 Runs entirely in the browser, secure data control
- 🚀 Lightweight, fast loading speed

## 🚀 Quick Start

### Online Experience
Visit [Online Demo](https://fengyunhe.github.io/jrxml_web_designer/) to experience the designer immediately.

### Local Development

1. Clone the repository
```bash
git clone https://github.com/fengyunhe/jrxml_web_designer.git
cd jrxml_web_designer
```

2. Install dependencies
```bash
pnpm install
```

3. Start development server
```bash
pnpm run dev
```

4. Open browser and visit
```
http://localhost:5173
```

### Build Production Version
```bash
pnpm run build
```

## 📖 User Guide

### 1. Create a New Report
- Click the "New File" button on the left
- Enter report name
- Select report orientation (landscape/portrait)
- Set page size

### 2. Add Elements
- Drag elements from the left element library to the canvas
- Adjust element position and size
- Edit element properties in the right property panel

### 3. Configure Data Source Fields
- Click the "Field Management" button at the top
- Add or edit data source fields
- Bind fields in text field properties

### 4. Preview Report
- Click the "PDF Preview" button at the top
- Configure preview server address (if needed)
- View the generated PDF effect

### 5. Export JRXML
- After completing the design, click the "Export" button
- Choose save location to get the JRXML file

## 🔧 Development Guide

### Project Structure
```
src/
├── components/          # Vue components
│   ├── common/         # Common components
│   ├── designer/       # Designer core components
│   ├── elements/       # Report element components
│   ├── modals/         # Modal components
│   └── panels/         # Panel components
├── composables/        # Composables
├── config/             # Configuration files
├── constants/          # Constant definitions
├── locales/            # Internationalization resources
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    └── jrxml/          # JRXML generation and parsing
```

### Add New Element Type
1. Create a new element component in `src/components/elements/` directory
2. Inherit `BaseElement.vue` or implement the same interface
3. Register the new element in `ElementRegistry.ts`
4. Add the new element to the element library

### Run Tests
```bash
pnpm run test
```

### Code Specifications
- Write in TypeScript
- Follow Vue 3 Composition API style
- Component-based design, maintain single responsibility
- Write unit tests to cover core functionality

## 📝 Changelog

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) specification for maintaining changelogs.

### View Changelog History
Please check the [CHANGELOG.md](CHANGELOG.md) file for detailed version changelog history.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

- The copyright of generated JRXML files belongs to you, and you can freely use, modify, distribute, and commercially use them.
- JasperReport is copyrighted by [Jaspersoft Corporation](https://www.jaspersoft.com/).

## 🤝 Contribution Guide

Contributions are welcome! You can:
- Submit Issues to report bugs or suggest new features
- Submit Pull Requests to fix issues or add features
- Improve documentation
- Share usage experience

## 🙏 Acknowledgments

Thanks to all developers and users who have contributed to the project!

If this tool is helpful for your work, please feel free to like, share, contribute, or scan the QR code in the upper right corner of the interface to reward us. Thank you for your support.

## 📞 Contact Information

For questions or suggestions, please contact us through:
- GitHub Issues: [https://github.com/fengyunhe/jrxml_web_designer/issues](https://github.com/fengyunhe/jrxml_web_designer/issues)
- Project Address: [https://github.com/fengyunhe/jrxml_web_designer](https://github.com/fengyunhe/jrxml_web_designer)

---

**JRXML Web Designer** - Making JasperReport Design Easier! 🎉