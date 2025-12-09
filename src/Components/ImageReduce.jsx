import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Loader,
  AlertCircle,
  Check,
  Image as ImageIcon,
} from "lucide-react";

const DEFAULT_EXAM_SIZES = {
  "JEE Main": {
    photo: { width: 350, height: 450, maxKB: 100 },
    signature: { width: 160, height: 50, maxKB: 30 },
  },
  NEET: {
    photo: { width: 350, height: 450, maxKB: 100 },
    signature: { width: 160, height: 50, maxKB: 30 },
  },
  SSC: {
    photo: { width: 200, height: 230, maxKB: 50 },
    signature: { width: 140, height: 60, maxKB: 20 },
  },
  UPSC: {
    photo: { width: 300, height: 350, maxKB: 40 },
    signature: { width: 200, height: 80, maxKB: 20 },
  },
  GATE: {
    photo: { width: 240, height: 320, maxKB: 50 },
    signature: { width: 200, height: 60, maxKB: 20 },
  },
};

function bytesToKB(bytes) {
  return +(bytes / 1024).toFixed(1);
}

const ImageReduce = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState("jpeg");
  const [exam, setExam] = useState("");
  const [docType, setDocType] = useState("photo"); // "photo" | "signature"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [originalImage, setOriginalImage] = useState(null); // { url, sizeKB }
  const [resizedImage, setResizedImage] = useState(null); // { url, sizeKB }
  const [dragActive, setDragActive] = useState(false);
  const [examSizes, setExamSizes] = useState(DEFAULT_EXAM_SIZES);
  const [examSizesLoading, setExamSizesLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Helper: current config from exam + docType
  const getCurrentConfig = () => {
    if (!exam || !docType) return null;
    const examCfg = examSizes?.[exam];
    if (!examCfg) return null;
    return examCfg[docType] || null;
  };

  // Fetch exam sizes from backend once
  useEffect(() => {
    let mounted = true;
    const endpoint = "http://localhost:3001/api/exam-sizes";

    const fetchSizes = async () => {
      try {
        setExamSizesLoading(true);
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        // backend returns: { examSizes: {...} }
        const sizes = data?.examSizes || data;
        if (sizes && typeof sizes === "object") {
          setExamSizes(sizes);
        }
      } catch (e) {
        // keep defaults
      } finally {
        if (mounted) setExamSizesLoading(false);
      }
    };

    fetchSizes();
    return () => {
      mounted = false;
    };
  }, []);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (originalImage?.url) URL.revokeObjectURL(originalImage.url);
      if (resizedImage?.url) URL.revokeObjectURL(resizedImage.url);
    };
  }, [originalImage, resizedImage]);

  const validateAndSetFile = (file) => {
    setError("");
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG and WEBP are supported");
      return;
    }
    if (originalImage?.url) URL.revokeObjectURL(originalImage.url);
    if (resizedImage?.url) URL.revokeObjectURL(resizedImage.url);

    const originalUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setOriginalImage({ url: originalUrl, sizeKB: bytesToKB(file.size) });
    setResizedImage(null);
    setSuccess(false);
  };

  const handleFileChange = (e) => validateAndSetFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer?.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleExamChange = (value) => {
    setExam(value);
    setError("");
    const cfg = value ? examSizes?.[value]?.[docType] : null;
    if (cfg) {
      setCustomWidth(String(cfg.width));
      setCustomHeight(String(cfg.height));
    } else {
      setCustomWidth("");
      setCustomHeight("");
    }
  };

  const handleDocTypeChange = (value) => {
    setDocType(value);
    setError("");
    if (exam) {
      const cfg = examSizes?.[exam]?.[value];
      if (cfg) {
        setCustomWidth(String(cfg.width));
        setCustomHeight(String(cfg.height));
      } else {
        setCustomWidth("");
        setCustomHeight("");
      }
    }
  };

  // Resize with canvas
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const bmp = await createImageBitmap(selectedFile);
      let targetW = 0;
      let targetH = 0;

      const cfg = getCurrentConfig();

      if (cfg) {
        targetW = Number(cfg.width) || 0;
        targetH = Number(cfg.height) || 0;
      } else {
        targetW = parseInt(customWidth || "0", 10);
        targetH = parseInt(customHeight || "0", 10);
      }

      if (!targetW || !targetH) {
        targetW = Math.round(bmp.width * 0.5);
        targetH = Math.round(bmp.height * 0.5);
      }

      targetW = Math.min(targetW, bmp.width);
      targetH = Math.min(targetH, bmp.height);

      const scale = Math.min(targetW / bmp.width, targetH / bmp.height);
      const outW = Math.max(1, Math.round(bmp.width * scale));
      const outH = Math.max(1, Math.round(bmp.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bmp, 0, 0, outW, outH);

      const mime =
        format === "png"
          ? "image/png"
          : format === "webp"
          ? "image/webp"
          : "image/jpeg";
      const q =
        mime === "image/png" ? 1.0 : Math.max(0.01, Number(quality) / 100);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, mime, q)
      );
      if (!blob) throw new Error("Failed to create image blob");

      const url = URL.createObjectURL(blob);
      setResizedImage({ url, sizeKB: bytesToKB(blob.size) });
      setSuccess(true);
    } catch (e) {
      setError(e?.message || "Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    const a = document.createElement("a");
    a.href = resizedImage.url;
    a.download = `reduced-image.${format === "jpeg" ? "jpg" : format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const resetForm = () => {
    if (originalImage?.url) URL.revokeObjectURL(originalImage.url);
    if (resizedImage?.url) URL.revokeObjectURL(resizedImage.url);
    setSelectedFile(null);
    setOriginalImage(null);
    setResizedImage(null);
    setCustomWidth("");
    setCustomHeight("");
    setQuality(80);
    setFormat("jpeg");
    setExam("");
    setDocType("photo");
    setError("");
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const compressionRatio =
    originalImage && resizedImage
      ? ((1 - resizedImage.sizeKB / originalImage.sizeKB) * 100).toFixed(1)
      : 0;

  const currentCfg = getCurrentConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Image Reducer
          </h1>
          <p className="text-gray-600 text-lg">
            Compress and resize images instantly with custom or exam-wise
            presets
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Uploader + Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Upload & Configure
            </h2>

            <motion.div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              animate={dragActive ? { scale: 1.02 } : { scale: 1 }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-blue-300 bg-blue-50 hover:border-blue-500"
              }`}
            >
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                {selectedFile ? selectedFile.name : "Click or drag image here"}
              </p>
              <p className="text-gray-500 text-sm">
                Supported: JPG, PNG, WebP up to 50MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </motion.div>

            {/* Exam + docType */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Select Exam (Optional)
                </label>
                <select
                  value={exam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  disabled={examSizesLoading}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">
                    {examSizesLoading ? "Loading exam sizes..." : "Custom Size"}
                  </option>
                  {Object.keys(examSizes).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {exam && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Document Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["photo", "signature"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleDocTypeChange(type)}
                        className={`py-2 px-4 rounded-lg font-semibold capitalize transition ${
                          docType === type
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {currentCfg && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preset: {currentCfg.width}×{currentCfg.height} px
                      {currentCfg.maxKB && `, Max ~${currentCfg.maxKB} KB`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Custom size */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  placeholder="Width"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  placeholder="Height"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>
            </motion.div>

            {/* Quality */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <label className="block text-gray-700 font-semibold">
                  Quality
                </label>
                <span className="text-blue-600 font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-gray-500 text-sm mt-1">
                Higher = Better Quality, Larger File
              </p>
            </div>

            {/* Format */}
            <div className="mt-6">
              <label className="block text-gray-700 font-semibold mb-3">
                Output Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["jpeg", "png", "webp"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`py-2 px-4 rounded-lg font-semibold transition ${
                      format === fmt
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 text-sm">
                    Image processed successfully! Compressed by{" "}
                    {compressionRatio}%{" "}
                    {currentCfg && currentCfg.maxKB && resizedImage
                      ? `(Target ≤ ~${
                          currentCfg.maxKB
                        } KB, got ${resizedImage.sizeKB.toFixed(1)} KB)`
                      : ""}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process Image
                  </>
                )}
              </button>
              {selectedFile && (
                <button
                  onClick={resetForm}
                  className="px-6 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Reset
                </button>
              )}
            </div>
          </motion.div>

          {/* Right: Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Results</h2>

            {originalImage && resizedImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 font-semibold mb-3 text-center">
                      Original
                    </p>
                    <div className="bg-gray-200 rounded-lg p-4 flex items-center justify-center min-h-48">
                      <img
                        src={originalImage.url}
                        alt="Original"
                        className="max-w-full max-h-48 object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      {originalImage.sizeKB} KB
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 font-semibold mb-3 text-center">
                      Reduced
                    </p>
                    <div className="bg-gray-200 rounded-lg p-4 flex items-center justify-center min-h-48">
                      <img
                        src={resizedImage.url}
                        alt="Resized"
                        className="max-w-full max-h-48 object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      {resizedImage.sizeKB} KB
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">Reduction</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {compressionRatio}%
                      </p>
                    </div>
                    <div className="text-center border-l border-r border-blue-200">
                      <p className="text-gray-600 text-sm">Size Saved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(originalImage.sizeKB - resizedImage.sizeKB).toFixed(
                          1
                        )}{" "}
                        KB
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm">Format</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Reduced Image
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center min-h-96">
                <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-600 text-center">
                  {loading
                    ? "Processing your image..."
                    : "Upload and process an image to see results"}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 bg-white rounded-2xl shadow-lg p-8"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Tips</h3>
          <ul className="grid md:grid-cols-2 gap-4 text-gray-600">
            <li>✓ Use exam presets for correct photo/signature dimensions</li>
            <li>✓ Adjust quality if file size is still too large</li>
            <li>✓ WebP format usually gives smallest size</li>
            <li>✓ For strict govt rules, always re-check notification PDF</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default ImageReduce;
