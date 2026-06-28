"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Minus } from "lucide-react";
import { ChatMessage as ChatMessageType, CVAnalysisResult } from "@/lib/chatbot/types";
import { generateResponse } from "@/lib/chatbot/response-engine";
import { ChatMessage } from "./chat-message";
import { CVUploadButton } from "./cv-upload-button";
import { QuickSuggestions } from "./quick-suggestions";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "bot",
          content: "Bonjour ! Je suis l'assistant IA de CSF. 👋\n\nJe suis là pour répondre à vos questions sur nos formations, nos services ou analyser votre profil. Comment puis-je vous aider ?",
          timestamp: new Date(),
          isMarkdown: true
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string = inputValue) => {
    if (!text.trim()) return;

    const newUserMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate thinking time
    setTimeout(() => {
      const botResponseText = generateResponse(text);
      const newBotMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: botResponseText,
        timestamp: new Date(),
        isMarkdown: true
      };
      setMessages(prev => [...prev, newBotMessage]);
      setIsTyping(false);
    }, 600 + Math.random() * 400); // 600-1000ms delay
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleCVUpload = async (file: File) => {
    setIsUploading(true);
    
    // Add a message from user indicating upload
    const uploadMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: `📄 Envoi du CV : ${file.name}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, uploadMessage]);
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/chatbot/analyze-cv", {
        method: "POST",
        body: formData,
      });

      const data: CVAnalysisResult = await response.json();

      let botReply = "";
      if (data.success) {
        botReply = `${data.advice}\n\n**Recommandation : ${data.recommendation.courseName}**\n\nCompétences détectées : ${data.detectedSkills.map(s => s.category).join(', ')}.\n\n[En savoir plus sur ce cursus](${data.recommendation.link})`;
      } else {
        botReply = "Désolé, je n'ai pas pu analyser ce document. Assurez-vous qu'il s'agit bien d'un PDF contenant du texte lisible.";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: botReply,
        timestamp: new Date(),
        isMarkdown: true
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "Une erreur de connexion est survenue lors de l'analyse du CV.",
        timestamp: new Date(),
        isMarkdown: true
      }]);
    } finally {
      setIsUploading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div 
          className="mb-4 bg-white w-[90vw] sm:w-[380px] h-[80vh] sm:h-[550px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#335FA1] to-[#2B5E94] text-white p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Assistant CSF</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> En ligne
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <Minus size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#f8fafc]">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {/* Quick Suggestions (show if we have less than 4 messages) */}
            {messages.length < 4 && (
              <QuickSuggestions onSelect={handleSendMessage} />
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-[#f0f4f8] rounded-2xl rounded-tl-none px-4 py-3 border-l-4 border-l-[#33A182] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#33A182] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#33A182] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#33A182] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#335FA1]/30 focus-within:border-[#335FA1] transition-all">
              <CVUploadButton onUpload={handleCVUpload} isUploading={isUploading} />
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-gray-700 placeholder-gray-400"
                disabled={isUploading}
              />
              
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isUploading}
                className="p-2 bg-[#335FA1] text-white rounded-full hover:bg-[#2B5E94] transition-colors disabled:opacity-50 disabled:hover:bg-[#335FA1] flex-shrink-0"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[9px] text-gray-400">100% Local AI • Aucun transfert de données externe</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="w-14 h-14 bg-gradient-to-tr from-[#335FA1] to-[#2B5E94] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 relative group"
        >
          {/* Notification ping animation */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#335FA1] opacity-20 animate-ping"></span>
          <MessageSquare size={24} />
          
          {/* Tooltip */}
          <span className="absolute right-16 bg-white text-[#335FA1] px-3 py-1.5 rounded-lg text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
            Besoin d'aide ?
          </span>
        </button>
      )}
    </div>
  );
}
