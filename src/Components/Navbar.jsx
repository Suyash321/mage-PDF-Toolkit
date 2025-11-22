import { Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto flex justify-between items-center px-6 py-3">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <span className="text-white font-bold text-xl">📄</span>
            </div>
            <span className="ml-2 font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              DocTools Pro
            </span>
          </motion.div>
        </Link>

       {/* Desktop Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex items-center gap-1"
        >
          <NavLink to="/" label="Home" />
          <NavLink to="/ImageReduce" label="Image Reduce" />
          <NavLink to="/remove-bg" label="Remove BG" />
          
          {/* PDF Tools Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 text-gray-700 font-medium hover:text-blue-600 transition flex items-center gap-1 rounded-lg hover:bg-gray-50">
              PDF Tools
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pt-2">
              <NavDropdownLink to="/merge-pdf" label="Merge PDF" icon="🔗" />
              <NavDropdownLink to="/compress-pdf" label="Compress PDF" icon="🗜️" />
              <NavDropdownLink to="/split-pdf" label="Split PDF" icon="✂️" />
            </div>
          </div>
        </motion.div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-gray-50 border-t border-gray-100"
          >
            <div className="container mx-auto px-6 py-4 space-y-2">
              <MobileNavLink to="/" label="Home" onClick={() => setMenuOpen(false)} />
              <MobileNavLink to="/ImageReduce" label="Image Reduce" onClick={() => setMenuOpen(false)} />
              <MobileNavLink to="/remove-bg" label="Remove BG" onClick={() => setMenuOpen(false)} />
              <MobileNavLink to="/merge-pdf" label="Merge PDF" onClick={() => setMenuOpen(false)} />
              <MobileNavLink to="/compress-pdf" label="Compress PDF" onClick={() => setMenuOpen(false)} />
              <MobileNavLink to="/split-pdf" label="Split PDF" onClick={() => setMenuOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Helper Components
const NavLink = ({ to, label }) => (
  <Link 
    to={to} 
    className="px-4 py-2 text-gray-700 font-medium hover:text-blue-600 transition rounded-lg hover:bg-gray-50"
  >
    {label}
  </Link>
);

const NavDropdownLink = ({ to, label, icon }) => (
  <Link 
    to={to} 
    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition flex items-center gap-2"
  >
    <span>{icon}</span> {label}
  </Link>
);

const MobileNavLink = ({ to, label, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="block px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
  >
    {label}
  </Link>
);

export default Navbar;