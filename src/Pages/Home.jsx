import React from "react";
import { motion } from "framer-motion";
import { Check, Zap, Shield, Users } from "lucide-react";
import ImageReduce from "../Components/ImageReduce";
import MergePDF from "../components/MergePDF";
import SplitPDF from "../components/SplitPDF";
import CompressPDF from "../components/CompressPDF";

const Home = () => {
  

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Process PDFs instantly with optimized algorithms. No waiting, no delays.",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "100% Secure",
      description: "Client-side processing ensures your files never leave your device.",
      color: "from-green-400 to-emerald-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Easy to Use",
      description: "Intuitive interface designed for everyone—no technical skills required.",
      color: "from-blue-400 to-indigo-500",
    },
  ];

  const tools = [
    {
      id: "reduce",
      title: "Image Reducer",
      description: "Compress and resize images for exams (SSC, UPSC, GATE, JEE).",
      icon: "🖼️",
    },
    {
      id: "merge",
      title: "Merge PDFs",
      description: "Combine multiple PDFs into one document. Drag to reorder.",
      icon: "📎",
    },
    {
      id: "split",
      title: "Split PDFs",
      description: "Extract individual pages or divide documents with precision.",
      icon: "✂️",
    },
    {
      id: "compress",
      title: "Compress PDFs",
      description: "Reduce file size significantly while maintaining quality.",
      icon: "📦",
    },
  ];

  const stats = [
    { number: "1M+", label: "Files Processed" },
    { number: "50K+", label: "Active Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "0ms", label: "Data Storage" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6"
            >
              <span className="inline-flex items-center rounded-full bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 border border-purple-500/20">
                ✨ Welcome to PDF Pro Suite
              </span>
            </motion.div>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Professional PDF Tools
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                for Everyone
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Process PDFs and images securely. Merge, split, compress, and resize—all in your browser. No uploads, no tracking, no compromises.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a
                href="#tools"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
              >
                Get Started → 
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-slate-400 text-slate-300 font-semibold hover:bg-slate-800/50 transition"
              >
                Learn More
              </a>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-700 pt-12"
          >
           
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built for professionals. Trusted by thousands. Optimized for performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition group"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOOLS SECTION ===== */}
      <section id="tools" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              All Tools at Your Fingertips
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose the tool you need and get started instantly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {tools.map((tool, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:border-purple-400 transition"
              >
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-slate-600">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== IMAGE REDUCER SECTION ===== */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              🖼️ Image Reducer
            </h2>
            <p className="text-lg text-slate-600">
              Perfect for exam photos and professional documents
            </p>
          </motion.div>
          <ImageReduce />
        </div>
      </section>

      {/* ===== MERGE PDF SECTION ===== */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              📎 Merge PDFs
            </h2>
            <p className="text-lg text-slate-600">
              Combine multiple PDFs into one seamlessly
            </p>
          </motion.div>
          <MergePDF />
        </div>
      </section>

      {/* ===== SPLIT PDF SECTION ===== */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              ✂️ Split PDFs
            </h2>
            <p className="text-lg text-slate-600">
              Extract pages with precision
            </p>
          </motion.div>
          <SplitPDF />
        </div>
      </section>

      {/* ===== COMPRESS PDF SECTION ===== */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              📦 Compress PDFs
            </h2>
            <p className="text-lg text-slate-600">
              Reduce file size dramatically
            </p>
          </motion.div>
          <CompressPDF />
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Start using our tools today. No signup required. No limits. 100% free.
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#tools"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-purple-600 font-bold text-lg hover:bg-purple-50 transition"
          >
            Get Started Now →
          </motion.a>
        </motion.div>
      </section>

      {/* ===== FOOTER SECTION ===== */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">PDF Pro Suite</h3>
              <p className="text-sm">Professional PDF tools for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Tools</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#tools" className="hover:text-white transition">Image Reducer</a></li>
                <li><a href="#tools" className="hover:text-white transition">Merge PDFs</a></li>
                <li><a href="#tools" className="hover:text-white transition">Split PDFs</a></li>
                <li><a href="#tools" className="hover:text-white transition">Compress PDFs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="text-sm space-y-2">
                <li><a href="mailto:support@pdfprosuite.com" className="hover:text-white transition">support@pdfprosuite.com</a></li>
                <li className="text-xs">© 2025 PDF Pro Suite</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>Secure • Fast • Free • Always</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;