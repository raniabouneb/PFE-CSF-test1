"use client";

import { ChatMessage as ChatMessageType } from "@/lib/chatbot/types";
import { User, Bot } from "lucide-react";
import React from "react";

interface ChatMessageProps {
  message: ChatMessageType;
}

// Simple markdown parser for bold (**text**) and links ([text](url))
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\n)/g);
  
  return parts.map((part, index) => {
    if (part === "\n") {
      return <br key={index} />;
    }
    
    // Bold
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    
    // Links
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return (
        <a 
          key={index} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#335FA1] underline hover:text-[#2B5E94]"
        >
          {linkMatch[1]}
        </a>
      );
    }
    
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser ? "ml-2 bg-[#335FA1] text-white" : "mr-2 bg-[#f0f4f8] border border-gray-200 text-[#33A182]"
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        {/* Message Bubble */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${
            isUser 
              ? "bg-[#335FA1] text-white rounded-tr-none" 
              : "bg-[#f0f4f8] text-[#1e3a5f] rounded-tl-none border-l-4 border-l-[#33A182]"
          }`}>
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message.isMarkdown ? renderMarkdown(message.content) : message.content}
            </div>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
      </div>
    </div>
  );
}
