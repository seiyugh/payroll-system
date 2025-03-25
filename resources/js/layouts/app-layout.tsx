"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar" // Make sure the path is correct

export default function AppLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true) // Manage sidebar state here

  // Optional: Set dark mode based on local storage
  useEffect(() => {
    document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark")
  }, [])

  return (
    <div className="flex h-screen">
      {/* Pass isOpen and toggleSidebar props to Sidebar */}
      <Sidebar isOpen={isOpen} toggleSidebar={() => setIsOpen(!isOpen)} />

      {/* Main content area */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

