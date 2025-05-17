import "./App.css";
import Home from "./components/Home";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import VideoCall from "./components/VideoCall";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-call/:userId" element={<VideoCall />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
