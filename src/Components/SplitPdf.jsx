import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudUpload,
  FileText,
  Download,
  Loader,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

/**
 * Production-ready SplitPDF component
 * - Drag & drop or click upload
 * - Shows page count before splitting
 * - Split into individual pages with progress
 * - Download all or individual pages
 * - Bulk operations (download all, clear)
 * - Accessible, responsive UI
 */

const humanSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isPdfFile = (file) => {
  if (!file) return false;
  if (file.type === "application/pdf") return true;
  return file.name?.toLowerCase().endsWith(".pdf");
};

const SplitPDF = () => {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [splitPages, setSplitPages] = useState(null); // Array of { url, pageNum, size }
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (splitPages) {
        splitPages.forEach((p) => {
          if (p.url) URL.revokeObjectURL(p.url);
        });
      }
    };
  }, [splitPages]);

  const handleFileSet = (f) => {
    setError("");
    setSplitPages(null);
    setPages(null);
    if (!isPdfFile(f)) {
      setError("Only PDF files are supported.");
      return false;
    }
    if (f.size === 0) {
      setError("Selected file is empty.");
      return false;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("File must be under 100 MB.");
      return false;
    }
    setFile(f);
    return true;
  };

  const readPdfPages = async (f) => {
    try {
      setProgress("Reading PDF...");
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pageCount = pdf.getPageCount();
      setPages(pageCount);
      setProgress("");
    } catch (err) {
      console.error("readPdf error:", err);
      setError("Failed to read PDF. The file may be corrupted.");
      setProgress("");
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const f = files[0];
      const ok = handleFileSet(f);
      if (ok) readPdfPages(f);
    }
  };

  const onFileInputChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = handleFileSet(f);
    if (ok) readPdfPages(f);
  };

  const split = async () => {
    setError("");
    if (!file) {
      setError("Please upload a PDF first.");
      return;
    }

    setIsSplitting(true);
    setProgress("Loading PDF...");
    setSplitPages(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });
      const pageIndices = pdfDoc.getPageIndices();

      const results = [];

      for (let i = 0; i < pageIndices.length; i++) {
        setProgress(`Splitting page ${i + 1} / ${pageIndices.length}...`);

        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndices[i]]);
        newPdf.addPage(copiedPage);

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        results.push({
          url,
          pageNum: i + 1,
          size: blob.size,
        });
      }

      setSplitPages(results);
      setProgress("Completed");
    } catch (err) {
      console.error("split error:", err);
      setError("Failed to split PDF. Try a different file.");
    } finally {
      setIsSplitting(false);
      setTimeout(() => setProgress(""), 1500);
    }
  };

  const downloadAll = async () => {
    if (!splitPages || splitPages.length === 0) return;

    try {
      setProgress("Preparing download...");
      for (let i = 0; i < splitPages.length; i++) {
        const p = splitPages[i];
        const a = document.createElement("a");
        a.href = p.url;
        a.download = `${file.name.replace(".pdf", "")}_page_${p.pageNum}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Stagger downloads
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      setProgress("All pages downloaded");
      setTimeout(() => setProgress(""), 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to download all pages.");
    }
  };

  const downloadSingle = (p) => {
    const a = document.createElement("a");
    a.href = p.url;
    a.download = `${file.name.replace(".pdf", "")}_page_${p.pageNum}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const reset = () => {
    setFile(null);
    setPages(null);
    setSplitPages((prev) => {
      if (prev) {
        prev.forEach((p) => {
          if (p.url) URL.revokeObjectURL(p.url);
        });
      }
      return null;
    });
    setIsSplitting(false);
    setProgress("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Split PDF</h2>
        <p className="text-sm text-gray-600">
          Extract individual pages from your PDF. Each page becomes a separate
          file.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Upload & Controls */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <label className="text-sm font-semibold text-gray-700">
            Upload PDF
          </label>

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`rounded-lg p-6 border-2 text-center transition cursor-pointer ${
              dragActive
                ? "border-sky-500 bg-sky-50"
                : "border-dashed border-gray-300 bg-gray-50 hover:border-sky-300"
            }`}
            role="button"
            tabIndex={0}
            aria-label="Drop PDF here or click to upload"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={onFileInputChange}
              className="hidden"
            />
            <CloudUpload className="mx-auto text-sky-500 w-8 h-8" />
            <div className="mt-2 text-sm text-gray-700">
              {file ? file.name : "Drag & drop PDF here, or click to browse"}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {file
                ? `${humanSize(file.size)} • ${pages ?? "..."} page(s)`
                : "Supported: PDF (max 100 MB)"}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-semibold text-gray-800">File Info</div>
              <div className="text-xs text-gray-600 mt-2 space-y-1">
                <div>
                  <span className="font-medium">Name:</span> {file?.name || "-"}
                </div>
                <div>
                  <span className="font-medium">Size:</span>{" "}
                  {file ? humanSize(file.size) : "-"}
                </div>
                <div>
                  <span className="font-medium">Pages:</span>{" "}
                  {pages ?? "Not read yet"}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-700 flex items-start gap-2"
              >
                <AlertCircle className="flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <button
              onClick={split}
              disabled={!file || isSplitting}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 font-medium`}
            >
              {isSplitting ? (
                <>
                  <Loader className="animate-spin w-5 h-5" /> Splitting...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" /> Split PDF
                </>
              )}
            </button>

            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 inline-flex items-center gap-2 font-medium"
            >
              <Trash2 className="w-5 h-5" /> Reset
            </button>
          </div>

          <AnimatePresence>
            {progress && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"
              >
                {progress}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RIGHT: Results */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <label className="text-sm font-semibold text-gray-700">
            Split Results
          </label>

          {splitPages && splitPages.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Successfully split into {splitPages.length} page(s)
                </div>
              </div>

              <button
                onClick={downloadAll}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
              >
                <Download className="w-5 h-5" /> Download All Pages
              </button>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {splitPages.map((p, idx) => (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-gray-50 border rounded-lg p-3 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {p.pageNum}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800">
                          Page {p.pageNum}
                        </div>
                        <div className="text-xs text-gray-500">
                          {humanSize(p.size)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadSingle(p)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                Tip: Click "Download All Pages" to save all pages at once, or
                download individual pages as needed.
              </div>
            </motion.div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="mx-auto text-gray-300 w-12 h-12" />
              <p className="mt-3 text-sm text-gray-600">
                {file
                  ? "Click 'Split PDF' to begin splitting into individual pages"
                  : "Upload a PDF to see split results here"}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SplitPDF;