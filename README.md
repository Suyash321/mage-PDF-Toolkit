# 🖼️ Image & PDF Toolkit

Professional image reducer and PDF processing tools - all in your browser, completely free!

## ✨ Features

- 📸 **Image Reducer** - Resize & compress images for competitive exams (SSC, UPSC, JEE, NEET, GATE, etc.)
- 📎 **Merge PDFs** - Combine multiple PDF files into one
- ✂️ **Split PDFs** - Extract pages from PDF documents
- 📦 **Compress PDFs** - Reduce PDF file sizes

## 🚀 Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express
- **APIs:** Gemini API (exam sizes), Remove.bg API (background removal)

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/image-pdf-toolkit.git
cd image-pdf-toolkit
```

### Install dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### Setup Environment Variables

Create `server/.env` file:
```env
REMOVEBG_API_KEY=your_removebg_key
GEMINI_API_KEY=your_gemini_key
PORT=3001
```

**Get API Keys:**
- Gemini API: https://aistudio.google.com/app/apikey
- Remove.bg API: https://www.remove.bg/api

## 🎯 Running Locally

### Start Backend Server
```bash
cd server
npm start
```
Server runs at: `http://localhost:3001`

### Start Frontend (in new terminal)
```bash
npm run dev
```
Frontend runs at: `http://localhost:5173`

## 📁 Project Structure

```
image-pdf-toolkit/
├── src/
│   ├── Components/
│   │   ├── ImageReduce.jsx
│   │   ├── MergePDF.jsx
│   │   ├── SplitPDF.jsx
│   │   └── CompressPDF.jsx
│   ├── Pages/
│   │   └── Home.jsx
│   └── App.jsx
├── server/
│   ├── index.js
│   └── package.json
└── README.md
```

## 🌐 Live Demo

🔗 [Live Demo](https://your-username.github.io/image-pdf-toolkit)

## 📄 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 👨‍💻 Author

Your Name - [GitHub](https://github.com/YOUR_USERNAME)