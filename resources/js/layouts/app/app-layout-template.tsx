"use client"

import { useState, useEffect } from "react"
import { Link } from "@inertiajs/react"
import { LogOut, Moon, Sun, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-64 bg-black text-white transition-transform",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between px-4 py-5">
        <h1 className="text-lg font-bold">Payroll System</h1>
        <Button variant="ghost" onClick={toggleSidebar}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>
      <nav className="mt-5 space-y-2 px-4">
        <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-800">
          Dashboard
        </Link>
        <Link href="/employees" className="block px-3 py-2 rounded hover:bg-gray-800">
          Employees
        </Link>
        <Link href="/payroll" className="block px-3 py-2 rounded hover:bg-gray-800">
          Payroll
        </Link>
        <Link href="/attendance" className="block px-3 py-2 rounded hover:bg-gray-800">
          Attendance
        </Link>
      </nav>
      <div className="absolute bottom-5 w-full px-4">
        <Button
          variant="ghost"
          className="w-full flex justify-between"
          onClick={() => {
            document.documentElement.classList.toggle("dark")
            localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light")
          }}
        >
          <span>Dark Mode</span>
          <Moon className="h-5 w-5 dark:hidden" />
          <Sun className="h-5 w-5 hidden dark:block" />
        </Button>
        <Button
          variant="destructive"
          className="w-full mt-2 flex items-center justify-center gap-2"
          onClick={() => (window.location.href = "/logout")}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}

export default function AppLayoutTemplate({ children }) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark")
  }, [])

  return (
    <div className="flex">
      <Sidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} />
      <main className="flex-1 min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white p-6 ml-64">
        <Button variant="ghost" className="absolute left-2 top-2 md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <Menu className="w-6 h-6" />
        </Button>
        {children}
      </main>
    </div>
  )
}

