"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const togglePanel = () => {
    setIsOpen(!isOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      // Simulate AI response - replace with actual API call
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "This is a simulated AI response. Replace this with actual API integration." }
        ])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error sending message:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      {!isOpen ? (
        <Button
          onClick={togglePanel}
          className="rounded-full h-12 w-12 p-0 shadow-lg bg-primary hover:bg-primary/90"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-[350px] h-[450px] flex flex-col shadow-lg">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-medium">AI Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePanel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                <p>Ask me anything about your notes and tasks</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex w-max max-w-[80%] rounded-lg px-3 py-2",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex w-max max-w-[80%] rounded-lg px-3 py-2 bg-muted">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
} 