import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext";

const Home = () => {
  const { socket } = useSocketContext();
  const navigate = useNavigate();
  const handleJoinRoom = (userId) => {
    navigate(`/video-call/${userId}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="w-full max-w-md flex flex-col items-center justify-center space-y-12">
        {/* Logo/Brand Element */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full opacity-75 blur"></div>
          <div className="relative bg-white rounded-full p-1 flex items-center justify-center">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-white"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold font-display title-gradient animate-pulse-slow">
          Baat-Cheet
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-center text-lg max-w-xs">
          Connect and converse in real-time with Janna
        </p>

        {/* Buttons Container */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-lg flex-1"
            onClick={() => handleJoinRoom("janna")}
          >
            Janna
          </button>
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-lg flex-1"
            onClick={() => handleJoinRoom("baccha")}
          >
            Baccha
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-gray-500 text-sm mt-8">
          Start your conversation journey today
        </p>
      </div>
    </div>
  );
};

export default Home;
