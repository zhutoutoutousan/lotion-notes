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
  title: {
    default: "Lotion Notes - AI-Powered Note Taking App",
    template: "%s | Lotion Notes"
  },
  description: "A modern note-taking application with AI capabilities. Organize your thoughts, create connections, and enhance your productivity with intelligent features.",
  keywords: ["note taking", "AI notes", "productivity", "knowledge management", "digital notes", "AI assistant"],
  authors: [{ name: "Lotion Notes Team" }],
  creator: "Lotion Notes",
  publisher: "Lotion Notes",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://lotion-notes.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Lotion Notes - AI-Powered Note Taking App",
    description: "A modern note-taking application with AI capabilities. Organize your thoughts, create connections, and enhance your productivity with intelligent features.",
    url: 'https://lotion-notes.vercel.app',
    siteName: 'Lotion Notes',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lotion Notes - AI-Powered Note Taking App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Lotion Notes - AI-Powered Note Taking App",
    description: "A modern note-taking application with AI capabilities. Organize your thoughts, create connections, and enhance your productivity with intelligent features.",
    images: ['/twitter-image.png'],
    creator: '@lotionnotes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
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