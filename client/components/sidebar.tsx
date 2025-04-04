"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, ClipboardList, BookOpen, Settings, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const pathname = usePathname()

  const navigation = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Calendar', href: '/calendar', icon: Calendar },
    { title: 'Tasks', href: '/tasks', icon: ClipboardList },
    { title: 'Knowledge', href: '/knowledge', icon: BookOpen },
    { title: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex items-center gap-2 p-4 border-b">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-primary"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
        <span className="font-bold text-lg">Lotion Notes</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                pathname === item.href ? "bg-muted text-foreground" : ""
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button className="w-full" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>
    </div>
  )
}

