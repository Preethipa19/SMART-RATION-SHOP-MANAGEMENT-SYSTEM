import { useState, useEffect } from "react";
import { FaRobot, FaPaperPlane, FaTimes } from "react-icons/fa";

const responses = {
  "what is smart ration shop?": "It is a digital system to distribute ration efficiently and transparently.",
  "how to apply for ration card?": "Visit the official Tamil Nadu Civil Supplies website and follow the instructions under 'Apply for Ration Card'.",
  "what schemes are available?": "Current schemes include Free Rice Scheme, LPG subsidy, and digital card integration.",
  "how to link aadhaar?": "You can link Aadhaar at the nearest ration shop or through the TNeGA portal.",
  "what is tnpds?": "TNPDS stands for Tamil Nadu Public Distribution System — it's a digital platform for managing ration cards and distribution.",
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm here to help you with your ration queries 😊" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);

    setTimeout(() => {
      const response =
        responses[userMessage.toLowerCase()] || "Sorry, I don't understand that. Try asking something else!";
      setMessages((prev) => [...prev, { from: "bot", text: response }]);
    }, 500);

    setInput("");
  };

  return (
    <div className="relative">
      {isOpen ? (
        <div className="w-72 h-96 bg-white text-black rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-yellow-400 p-3 flex justify-between items-center">
            <h2 className="font-bold text-lg">Ration Chatbot</h2>
            <button onClick={() => setIsOpen(false)}>
              <FaTimes className="text-black" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 space-y-2 overflow-y-auto animate-fade-in">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.from === "user"
                    ? "bg-blue-500 text-white self-end ml-auto"
                    : "bg-gray-200 text-black self-start mr-auto"
                } transition-all duration-300 ease-in-out`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-2 border-t flex items-center space-x-2">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-1 text-sm"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} className="text-blue-600 hover:text-blue-800">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      ) : (
        <button
          className="bg-yellow-400 hover:bg-yellow-300 text-black p-4 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <FaRobot className="text-xl" />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
