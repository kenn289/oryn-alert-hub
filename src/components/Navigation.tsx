"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Activity, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleNavigation = (section: string) => {
    setIsOpen(false)
    // If we're on the dashboard or any other page, navigate to home first, then scroll to section
    if (window.location.pathname !== '/') {
      window.location.href = `/#${section}`
    } else {
      // If we're on the home page, just scroll to the section
      const element = document.getElementById(section)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      } else {
        // If element not found, navigate to home with hash
        window.location.href = `/#${section}`
      }
    }
  }

  if (!mounted) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold gradient-text">Oryn</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <span className="text-sm font-medium text-muted-foreground">Features</span>
              <span className="text-sm font-medium text-muted-foreground">Pricing</span>
              <span className="text-sm font-medium text-muted-foreground">Docs</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                🌙
              </Button>
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="gradient" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">Oryn</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleNavigation('features')} 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => handleNavigation('pricing')} 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => handleNavigation('docs')} 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Docs
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </Button>
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="gradient" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => handleNavigation('features')} 
                className="text-sm font-medium hover:text-primary transition-colors text-left"
              >
                Features
              </button>
              <button 
                onClick={() => handleNavigation('pricing')} 
                className="text-sm font-medium hover:text-primary transition-colors text-left"
              >
                Pricing
              </button>
              <button 
                onClick={() => handleNavigation('docs')} 
                className="text-sm font-medium hover:text-primary transition-colors text-left"
              >
                Docs
              </button>
              <div className="flex items-center space-x-4 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-9 h-9 p-0"
                >
                  {theme === "dark" ? "☀️" : "🌙"}
                </Button>
                {user ? (
                  <>
                    <Link href="/dashboard" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex-1">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth" className="flex-1">
                      <Button variant="gradient" size="sm" className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
