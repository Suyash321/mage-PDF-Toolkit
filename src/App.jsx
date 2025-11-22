import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Navbar from "./Components/Navbar";
import ImageReduce from "./Components/ImageReduce";
import Removebg from "./Components/Removebg";
import MergePDF from "./Components/MergePDF";
import SplitPDF from "./Components/SplitPDF";
import CompressPDF from "./Components/CompressPDF";

function App() {
  return (
    <Router>
      <>
        <Navbar />
        <div className="mt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ImageReduce" element={<ImageReduce />} /> 
            <Route path="/remove-bg" element={<Removebg />} />
            
            <Route path="/merge-pdf" element={<MergePDF />} />
            <Route path="/split-pdf" element={<SplitPDF />} />
            <Route path="/compress-pdf" element={<CompressPDF />} />
          </Routes>
        </div>
      </>
    </Router>
  );
}

export default App;