import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Trash2, ArrowUp, ArrowDown, FileText, DownloadCloud } from "lucide-react";

/**
 * Production-level MergePDF component
 * - Drag & drop or click upload
 * - File list with page count, size, reorder (drag/drop + up/down), remove
 * - Merge with progress + error handling
 * - Accessible controls and responsive layout
 */

const MAX_FILES = 20;
const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB total recommended

const humanSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const MergePDF = () => {
  const [items, setItems] = useState([]); // { id, file, name, size, pages }
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(""); // textual progress
  const dragIndexRef = useRef(null);

  // Dropzone
  const onDrop = useCallback(
    async (acceptedFiles) => {
      setError("");
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const newFiles = [];
      for (const f of acceptedFiles) {
        if (items.length + newFiles.length >= MAX_FILES) {
          setError(`Cannot add more than ${MAX_FILES} files.`);
          break;
        }
        if (f.type !== "application/pdf") {
          setError("Only PDF files are allowed.");
          continue;
        }
        if (f.size <= 0) {
          setError(`File ${f.name} seems empty.`);
          continue;
        }
        // create placeholder item; load pages asynchronously
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        newFiles.push({
          id,
          file: f,
          name: f.name,
          size: f.size,
          pages: null,
        });
      }

      if (newFiles.length === 0) return;
      setItems((prev) => [...prev, ...newFiles]);

      // Load page counts in background
      for (const nf of newFiles) {
        try {
          const arrayBuffer = await nf.file.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          setItems((prev) =>
            prev.map((it) => (it.id === nf.id ? { ...it, pages: pdf.getPageCount() } : it))
          );
        } catch (err) {
          console.error("Failed to read PDF", nf.name, err);
          setItems((prev) => prev.map((it) => (it.id === nf.id ? { ...it, pages: 0 } : it)));
        }
      }
    },
    [items.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    maxFiles: MAX_FILES,
  });

  // Reorder helpers
  const moveItem = (from, to) => {
    setItems((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const onDragStart = (e, index) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDropItem = (e, index) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === undefined) return;
    if (from === index) return;
    moveItem(from, index);
    dragIndexRef.current = null;
  };

  // Merge PDFs
  const mergePDFs = async () => {
    setError("");
    setMergedUrl(null);

    if (items.length < 2) {
      setError("Select at least two PDF files to merge.");
      return;
    }

    // total size guard
    const totalSize = items.reduce((s, it) => s + (it.size || 0), 0);
    if (totalSize > MAX_SIZE_BYTES) {
      setError("Total file size too large. Try fewer or smaller PDFs.");
      return;
    }

    setIsProcessing(true);
    setProgress("Creating new document...");

    try {
      const mergedDoc = await PDFDocument.create();

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        setProgress(`Processing ${i + 1} / ${items.length}: ${it.name}`);
        const arrayBuffer = await it.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copied = await mergedDoc.copyPages(pdf, pdf.getPageIndices());
        copied.forEach((p) => mergedDoc.addPage(p));
      }

      setProgress("Saving merged PDF...");
      const pdfBytes = await mergedDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      // cleanup previous URL
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
      setProgress("Done");
    } catch (err) {
      console.error("Merge failed:", err);
      setError("Failed to merge PDFs. Try re-uploading the files.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(""), 2000);
    }
  };

  // Clear all
  const clearAll = () => {
    setItems([]);
    setMergedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError("");
    setProgress("");
  };

  useEffect(() => {
    // revoke merged URL on unmount
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200 mt-10">
      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 mb-3"
      >
        Merge PDFs
      </motion.h2>
      <p className="text-sm text-gray-600 mb-6">
        Drag & drop PDF files or click to upload. Reorder as needed, then merge into a single PDF.
      </p>

      <div
        {...getRootProps()}
        className={`border-2 rounded-lg p-6 cursor-pointer transition text-center ${
          isDragActive ? "border-sky-500 bg-sky-50" : "border-dashed border-gray-300 bg-gray-50 hover:border-sky-300"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-700">{isDragActive ? "Drop your files here..." : "Drag & drop PDFs here or click to browse"}</p>
        <p className="text-xs text-gray-400 mt-1">Allowed: PDF only. Max files: {MAX_FILES}.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Selected PDFs</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAll}
                className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100"
                aria-label="Clear all files"
              >
                Clear
              </button>
              <div className="text-xs text-gray-500">{items.length} file(s)</div>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {items.map((it, idx) => (
                <motion.div
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex items-center justify-between bg-white border rounded p-3 shadow-sm"
                  draggable
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDrop={(e) => onDropItem(e, idx)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                      <FileText />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{it.name}</div>
                      <div className="text-xs text-gray-500">
                        {it.pages !== null ? `${it.pages} page(s)` : "Reading pages..."} • {humanSize(it.size)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => idx > 0 && moveItem(idx, idx - 1)}
                      title="Move up"
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label={`Move ${it.name} up`}
                    >
                      <ArrowUp />
                    </button>
                    <button
                      onClick={() => idx < items.length - 1 && moveItem(idx, idx + 1)}
                      title="Move down"
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label={`Move ${it.name} down`}
                    >
                      <ArrowDown />
                    </button>
                    <button
                      onClick={() => removeItem(it.id)}
                      title="Remove"
                      className="p-1 rounded hover:bg-red-50 text-red-600"
                      aria-label={`Remove ${it.name}`}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length === 0 && (
              <div className="text-sm text-gray-500 p-3 border rounded bg-gray-50">No files selected.</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Actions</h3>
            <div className="text-xs text-gray-500">{mergedUrl ? "Merged ready" : "Not merged yet"}</div>
          </div>

          <div className="bg-white border rounded p-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={mergePDFs}
                disabled={isProcessing || items.length < 2}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60`}
              >
                {isProcessing ? "Merging..." : "Merge PDFs"}
              </button>

              {mergedUrl && (
                <a
                  href={mergedUrl}
                  download="merged.pdf"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <DownloadCloud /> Download
                </a>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <strong>Progress:</strong> {progress || (isProcessing ? "Working..." : "Idle")}
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

            <div className="text-xs text-gray-500">
              Tip: Reorder files to set the pages order in the final merged PDF.
            </div>
          </div>

          {/* quick stats */}
          <div className="bg-gray-50 border rounded p-3 text-sm text-gray-600">
            <div>Total files: <strong>{items.length}</strong></div>
            <div className="mt-1">Total size: <strong>{humanSize(items.reduce((s, it) => s + (it.size || 0), 0))}</strong></div>
            <div className="mt-1">Estimated pages: <strong>{items.reduce((s, it) => s + (it.pages || 0), 0)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergePDF;