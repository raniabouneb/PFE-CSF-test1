"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Minimize2 } from "lucide-react"
import type { ChatMessage, CVAnalysisResult } from "@/lib/chatbot/types"
import { generateResponse, formatCVAnalysisResult, generateCVSuggestions } from "@/lib/chatbot/response-engine"
import { ChatMessageBubble } from "./chat-message"
import { QuickSuggestions } from "./quick-suggestions"
import { CVUploadButton } from "./cv-upload-button"

const WELCOME_MESSAGE = `Bonjour ! Je suis l'**Assistant CSF** 🤖

Je suis là pour répondre à toutes vos questions sur nos **formations**, **reconversions**, **certifications**, **services** et bien plus.

💡 **Astuce :** Uploadez votre CV (PDF) via l'icône 📎 pour obtenir une recommandation de parcours personnalisée !`

const INITIAL_SUGGESTIONS = [
  "📚 Formations disponibles",
  "🔄 Reconversion métier",
  "📄 Analyser mon CV",
  "📞 Contact",
]

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: new Date(),
  }
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isAnalyzingCV, setIsAnalyzingCV] = useState(false)
  const [cvFileName, setCvFileName] = useState<string>()
  const [hasWelcomed, setHasWelcomed] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen && !hasWelcomed) {
      setMessages([createMessage("assistant", WELCOME_MESSAGE)])
      setHasWelcomed(true)
    }
  }, [isOpen, hasWelcomed])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    setShowSuggestions(false)
    setInput("")

    const userMsg = createMessage("user", trimmed)
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400))

    const response = generateResponse(trimmed)
    const botMsg = createMessage("assistant", response.message)
    setMessages((prev) => [...prev, botMsg])
    setSuggestions(response.suggestions)
    setShowSuggestions(true)
    setIsTyping(false)
  }, [isTyping])

  const handleCVUpload = useCallback(async (file: File) => {
    if (isAnalyzingCV || isTyping) return

    setCvFileName(file.name)
    setShowSuggestions(false)

    const userMsg = createMessage("user", `📄 Analyse de mon CV : ${file.name}`)
    setMessages((prev) => [...prev, userMsg])
    setIsAnalyzingCV(true)
    setIsTyping(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/chatbot/analyze-cv", {
        method: "POST",
        body: formData,
      })

      const data: CVAnalysisResult = await res.json()
      const formatted = formatCVAnalysisResult(data)
      const botMsg = createMessage("assistant", formatted)
      setMessages((prev) => [...prev, botMsg])
      setSuggestions(generateCVSuggestions())
      setShowSuggestions(true)
    } catch {
      const errorMsg = createMessage(
        "assistant",
        "❌ **Erreur**\n\nImpossible d'analyser votre CV. Veuillez réessayer ou nous contacter à contact@csf.tn.",
      )
      setMessages((prev) => [...prev, errorMsg])
      setSuggestions(INITIAL_SUGGESTIONS)
      setShowSuggestions(true)
    } finally {
      setIsAnalyzingCV(false)
      setIsTyping(false)
      setCvFileName(undefined)
    }
  }, [isAnalyzingCV, isTyping])

  const handleSuggestionSelect = (suggestion: string) => {
    if (suggestion.includes("Analyser mon CV") || suggestion.includes("📄")) {
      return
    }
    sendMessage(suggestion.replace(/^[^\s]+\s/, ""))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer animate-pulse hover:animate-none"
          style={{
            background: "linear-gradient(135deg, #335FA1 0%, #2B5E94 100%)",
          }}
          aria-label="Ouvrir l'assistant CSF"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden
            bottom-0 right-0 w-full h-full
            sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[550px] sm:max-h-[calc(100vh-48px)]"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #335FA1 0%, #2B5E94 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">Assistant CSF</h3>
                <p className="text-xs text-white/70">Conseil · Solution · Formation</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Réduire"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto py-3 space-y-1 min-h-0">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 px-4 py-2 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-[#33A182] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#f0f4f8] rounded-2xl px-4 py-3 border-l-[3px] border-[#33A182]">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#1e3a5f] mr-2">
                      {isAnalyzingCV ? "Analyse du CV en cours" : "L'assistant réfléchit"}
                    </span>
                    <span className="w-1.5 h-1.5 bg-[#335FA1] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-[#335FA1] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-[#335FA1] rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <QuickSuggestions
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            visible={showSuggestions && !isTyping}
          />

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0"
          >
            <CVUploadButton
              onFileSelect={handleCVUpload}
              isLoading={isAnalyzingCV}
              fileName={cvFileName}
              disabled={isTyping}
            />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 text-sm rounded-full border border-[#e2e8f0] bg-white text-[#1e3a5f] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#335FA1]/30 focus:border-[#335FA1] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-full text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #335FA1 0%, #2B5E94 100%)",
              }}
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
