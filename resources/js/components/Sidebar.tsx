"use client"

import { useState, useEffect } from "react"
import { Link, usePage } from "@inertiajs/react"
import { LogOut, Moon, Sun, Menu, Home, Users, FileText, Calendar, StickyNote } from "lucide-react" // Added StickyNote icon
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useForm } from "@inertiajs/react"
import { toast } from "sonner"

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { post } = useForm()
  const { url } = usePage() // Access current URL from Inertia

  // Helper function to check if the link is active
  const isActive = (path) => url.startsWith(path)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white text-black dark:bg-black dark:text-white transition-all duration-300 z-10",
        isOpen ? "w-60" : "w-20",
      )}
    >
      <div className="flex items-center justify-between px-4 py-5">
        <h1 className={cn("text-lg font-bold transition-all duration-100", !isOpen && "hidden")}>Aicom</h1>
        {/* Toggle Button Icon */}
        <Button variant="ghost" onClick={toggleSidebar}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="mt-5 space-y-2 px-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center px-3 py-2 rounded transition-colors duration-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black",
            isActive("/dashboard") && "bg-black text-white dark:bg-white dark:text-black",
          )}
        >
          <Home className="w-6 h-6 min-w-6" />
          {isOpen && <span className="ml-3">Dashboard</span>}
        </Link>
        <Link
          href="/employees"
          className={cn(
            "flex items-center px-3 py-2 rounded transition-colors duration-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black",
            isActive("/employees") && "bg-black text-white dark:bg-white dark:text-black",
          )}
        >
          <Users className="w-6 h-6 min-w-6" />
          {isOpen && <span className="ml-3">Employees</span>}
        </Link>
        <Link
          href="/payroll"
          className={cn(
            "flex items-center px-3 py-2 rounded transition-colors duration-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black",
            isActive("/payroll") && "bg-black text-white dark:bg-white dark:text-black",
          )}
        >
          <FileText className="w-6 h-6 min-w-6" />
          {isOpen && <span className="ml-3">Payroll</span>}
        </Link>
        <Link
          href="/attendance"
          className={cn(
            "flex items-center px-3 py-2 rounded transition-colors duration-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black",
            isActive("/attendance") && "bg-black text-white dark:bg-white dark:text-black",
          )}
        >
          <Calendar className="w-6 h-6 min-w-6" />
          {isOpen && <span className="ml-3">Attendance</span>}
        </Link>
        
      </nav>

      {/* Dark Mode and Logout Buttons */}
      <div className="absolute bottom-5 w-full px-4">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-2"
          onClick={() => {
            document.documentElement.classList.toggle("dark")
            localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light")
            toast.success(
              document.documentElement.classList.contains("dark") ? "Dark mode enabled" : "Light mode enabled",
            )
          }}
        >
          <Moon className="h-5 w-5 min-w-5 dark:hidden" />
          <Sun className="h-5 w-5 min-w-5 hidden dark:block" />
          {isOpen && <span>Dark Mode</span>}
        </Button>

        <Button
          variant="destructive"
          className="w-full mt-2 flex items-center justify-start gap-2 bg-red-600 transition-all duration-300"
          onClick={() => {
            post("/logout", {
              onSuccess: () => {
                // Clear any local storage items if needed
                localStorage.removeItem("sidebarState")
                localStorage.removeItem("theme")
                localStorage.removeItem("notes")
                // Redirect to login page
                window.location.href = "/login"
              },
              onError: () => {
                toast.error("Logout failed. Please try again.")
              },
            })
          }}
        >
          <LogOut className="h-5 w-5 min-w-5" />
          {isOpen && <span>Log Out</span>}
        </Button>
      </div>
    </aside>
  )
}

export default function AppLayoutTemplate({ children }) {
  const [isOpen, setIsOpen] = useState(localStorage.getItem("sidebarState") === "open" ? true : false) // Persist state

  useEffect(() => {
    const theme = localStorage.getItem("theme")
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [])

  const toggleSidebar = () => {
    setIsOpen((prevState) => {
      const newState = !prevState
      localStorage.setItem("sidebarState", newState ? "open" : "closed") // Persist sidebar state
      return newState
    })
  }

  return (
    <div className="flex">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

      <main
        className={cn(
          "flex-1 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-all duration-300",
          isOpen ? "ml-60" : "ml-20",
        )}
      >
        {children}
      </main>
    </div>
  )
}

