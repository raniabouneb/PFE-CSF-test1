"use client"

import { Bot, User } from "lucide-react"
import type { ChatMessage } from "@/lib/chatbot/types"

interface ChatMessageBubbleProps {
  message: ChatMessage
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, lineIndex) => {
    if (line.startsWith("• ") || line.startsWith("- ")) {
      elements.push(
        <li key={`li-${lineIndex}`} className="ml-4 list-disc">
          {renderInlineMarkdown(line.slice(2))}
        </li>,
      )
      return
    }

    if (line.trim() === "") {
      elements.push(<br key={`br-${lineIndex}`} />)
      return
    }

    elements.push(
      <p key={`p-${lineIndex}`} className={lineIndex > 0 ? "mt-1" : ""}>
        {renderInlineMarkdown(line)}
      </p>,
    )
  })

  return elements
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        const [, label, href] = linkMatch
        const isExternal = href.startsWith("http")
        parts.push(
          <a
            key={match.index}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="underline text-[#335FA1] hover:text-[#2B5E94] font-medium"
          >
            {label}
          </a>,
        )
      }
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={`flex gap-2 px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-[#335FA1] text-white"
            : "bg-[#33A182] text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-[#335FA1] text-white rounded-br-md"
              : "bg-[#f0f4f8] text-[#1e3a5f] border-l-[3px] border-[#33A182] rounded-bl-md"
          }`}
        >
          <div className="break-words">{renderMarkdown(message.content)}</div>
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
