import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Download, Loader, AlertCircle, Check } from "lucide-react";

const Removebg = () => {
  const [preview, setPreview] = useState(null); // data URL for preview
  const [file, setFile] = useState(null); // actual File object
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    setSuccess(false);
    setProcessedImage(null);

    if (!f.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      setError("Image size must be less than 12MB");
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const removeBackground = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("image", file); // multer expects field 'image'

      const resp = await fetch("http://localhost:3001/api/remove-bg", {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Failed to remove background");
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error processing image");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "removed-bg.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setPreview(null);
    setFile(null);
    setProcessedImage(null);
    setError("");
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Remove Background
          </h1>
          <p className="text-gray-600 text-lg">Remove image backgrounds instantly with AI precision</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Image</h2>

            <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition bg-blue-50" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">Click to upload or drag and drop</p>
              <p className="text-gray-500 text-sm">PNG, JPG, JPEG up to 12MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {preview && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-6">
                <p className="text-gray-600 font-semibold mb-3">Preview:</p>
                <img src={preview} alt="Uploaded" className="w-full h-64 object-contain rounded-lg border border-gray-200" />
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-700 text-sm">Background removed successfully!</p>
              </motion.div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={removeBackground} disabled={!preview || loading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Remove Background"
                )}
              </button>
              {preview && (
                <button onClick={resetForm} className="px-6 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition">
                  Reset
                </button>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Result</h2>

            {processedImage ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 flex items-center justify-center min-h-64">
                  <img src={processedImage} alt="Processed" className="max-w-full max-h-64 object-contain" />
                </div>

                <button onClick={downloadImage} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Image
                </button>
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center min-h-64">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <p className="text-gray-600 text-center">{loading ? "Processing your image..." : "Upload and process an image to see the result here"}</p>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">ℹ️ How it works</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Upload any image (JPG, PNG)</li>
            <li>✓ AI automatically detects and removes the background</li>
            <li>✓ Download the result as PNG with transparent background</li>
            <li>✓ Free to use with high accuracy</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Removebg;