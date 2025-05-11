import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Chatbot from "./chatbot";

const MasterWelcome = () => {
  const navigate = useNavigate();
  const [showChatbot, setShowChatbot] = useState(false);

  const flashMessages = [
    "Free Rice Scheme extended till Dec 2025",
    "Smart Card holders receive 1kg extra sugar in April",
    "OTP-based authentication for ration collection is now active",
    "Ration card linking with Aadhaar is mandatory",
    "Use your smart card for quick digital verification",
  ];

  const handleNext = () => {
    navigate("/welcome");
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center text-white flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{
        backgroundImage: `url('https://www.financialexpress.com/wp-content/uploads/2018/03/ration-shop-reu.jpg')`,
      }}
    >
      {/* Flash Notifications */}
      <div className="absolute top-0 left-0 w-full bg-yellow-400 text-black py-2 text-sm font-semibold z-30 shadow-md">
        <div className="marquee whitespace-nowrap overflow-hidden">
          <div className="inline-block animate-marquee px-4">
            {flashMessages.map((msg, index) => (
              <span key={index} className="mr-10">🔔 {msg}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col justify-center items-center text-center max-w-3xl mt-24 bg-black bg-opacity-50 p-6 rounded-lg">
        <h2 className="text-2xl md:text-3xl font-semibold mb-2 animate-fade-in">
          Welcome to
        </h2>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-snug text-yellow-400 animate-fade-in">
          Smart Ration Shop Management System
        </h1>
        <p className="text-lg md:text-xl mb-8 text-gray-300 animate-fade-in">
          Seamless, transparent, and digital way to manage your ration shop.
        </p>
        <button
          onClick={handleNext}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-full transition duration-300 shadow-lg transform hover:scale-105 animate-bounce"
        >
          Get Started
        </button>
      </div>

      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-full shadow-lg z-50 transition-transform transform hover:scale-110"
      >
        {showChatbot ? "Close Chat" : "Need Help?"}
      </button>

      {/* Chatbot Pop-up */}
      {showChatbot && (
        <div className="fixed bottom-20 right-6 z-40 w-80 max-w-[90vw] bg-white rounded-lg shadow-lg overflow-hidden animate-slide-up">
          <Chatbot />
        </div>
      )}
    </div>
  );
};

export default MasterWelcome;