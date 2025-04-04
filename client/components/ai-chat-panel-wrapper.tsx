"use client"

import { usePathname } from "next/navigation"
import AIChatPanel from "./ai-chat-panel"

export default function AIChatPanelWrapper() {
  const pathname = usePathname()
  
  // Don't show the AI Chat panel on the home page
  if (pathname === "/") {
    return null
  }
  
  return <AIChatPanel />
} 