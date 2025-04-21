"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, ClipboardList, BookOpen, Settings, PlusCircle, Languages, Pencil, Newspaper, Database, Heart, LifeBuoy, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Calendar', href: '/calendar', icon: Calendar },
    { title: 'Tasks', href: '/tasks', icon: ClipboardList },
    { title: 'Knowledge', href: '/knowledge', icon: BookOpen },
    { title: 'Language Learning', href: '/language', icon: Languages },
    { title: 'Life Guide', href: '/life-guide', icon: LifeBuoy },
    { title: 'Health Tracking', href: '/health-tracking', icon: Heart },
    { title: 'News Explorer', href: '/news', icon: Newspaper },
    { title: 'Database', href: '/database', icon: Database },
    { title: 'Stock Scanner', href: '/stock-scanner', icon: LineChart },
    { title: 'Editor', href: '/editor', icon: Pencil },
    { title: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-[60px] items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🧴</span>
          <span>Lotion Notes</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                pathname === item.href && "bg-muted text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Note
          </Link>
        </Button>
      </div>
    </div>
  );
}

