import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DataPanel } from "@/components/DataPanel"
import Sidebar from "@/components/sidebar"
import AIChatPanelWrapper from "@/components/ai-chat-panel-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lotion Notes",
  description: "A note-taking app with AI capabilities",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ">
              {children}
            </main>
            <DataPanel />
          </div>
          <AIChatPanelWrapper />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'