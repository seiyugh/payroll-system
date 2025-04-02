"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar" // Make sure this path matches where you saved the Sidebar component
import { cn } from "@/lib/utils"

export default function AppLayout({ children }) {
  // Use localStorage to persist sidebar state, defaulting to open
  const [isOpen, setIsOpen] = useState(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebarState")
      // Default to open on desktop, closed on mobile
      if (savedState === null) {
        return window.innerWidth > 768
      }
      return savedState === "open"
    }
    return true
  })

  // Set dark mode based on local storage
  useEffect(() => {
    const theme = localStorage.getItem("theme")
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [])

  // Handle session expiration
  useEffect(() => {
    const handleSessionExpired = (e) => {
      // Check for 401 (Unauthorized) or 419 (CSRF token mismatch) status codes
      if (e.detail?.response?.status === 401 || e.detail?.response?.status === 419) {
        // Clear any auth-related local storage
        localStorage.removeItem("sidebarState")

        // Redirect to login with timeout parameter
        window.location.href = "/login?timeout=true"
      }
    }

    document.addEventListener("inertia:error", handleSessionExpired)

    return () => {
      document.removeEventListener("inertia:error", handleSessionExpired)
    }
  }, [])

  // Close sidebar on small screens when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isOpen) {
        setIsOpen(false)
        localStorage.setItem("sidebarState", "closed")
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isOpen])

  const toggleSidebar = () => {
    setIsOpen((prevState) => {
      const newState = !prevState
      localStorage.setItem("sidebarState", newState ? "open" : "closed") // Persist sidebar state
      return newState
    })
  }

  return (
    <div className="flex h-screen overflow-x-hidden">
      {/* Pass isOpen and toggleSidebar props to Sidebar */}
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-all duration-300 p-6",
          isOpen ? "ml-60" : "ml-20",
        )}
      >
        {children}
      </main>
    </div>
  )
}

