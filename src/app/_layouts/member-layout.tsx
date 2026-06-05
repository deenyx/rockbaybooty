'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { MEMBER_MENU_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MemberLayoutProps {
  children: React.ReactNode
  initialUser?: {
    username: string
    firstName: string
    displayName: string
    avatarUrl?: string
  }
  isBurner?: boolean
}

const iconMap: { [key: string]: React.ReactNode } = {
  Dashboard: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Search: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Community: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Profile: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
    </svg>
  ),
  Messages: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Videos: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  Friends: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Camera: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim().slice(0, 1))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {MEMBER_MENU_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-text-muted hover:bg-bg-surface/50'
              )}
            >
              {iconMap[item.label] || <div className="h-5 w-5" />}
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          </Link>
        )
      })}
    </nav>
  )
}

export default function MemberLayout({ children, initialUser, isBurner }: MemberLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Close sidebar when route changes
  React.useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  async function handleSignOut() {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue with redirect even if API call fails to avoid trapping users.
    }

    router.replace('/welcome')
    router.refresh()
  }

  const currentPageTitle = MEMBER_MENU_ITEMS.find(item => item.href === pathname)?.label || 'Dashboard'

  return (
    <div className="min-h-screen relative bg-bg-base dark:bg-bg-base">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'url(/3.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Dark Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-bg-base/80 via-bg-base/60 to-bg-base/80" />

      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <motion.div
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 280 }}
          className="hidden md:flex flex-col fixed left-0 top-0 h-full bg-bg-surface/50 backdrop-blur-md border-r border-border-subtle shadow-xl"
        >
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-burgundy-500 to-champagne flex items-center justify-center text-white font-bold text-sm">
                {initialUser ? getInitials(initialUser.displayName || initialUser.firstName) : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {initialUser?.displayName || initialUser?.firstName || 'User'}
                </p>
                <p className="text-xs text-text-muted truncate">
                  @{initialUser?.username || 'username'}
                </p>
                {isBurner && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Read-only Mode
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <SidebarNav />
          </div>

          <div className="p-4 border-t border-border-subtle">
            <Button
              variant="outline"
              className="w-full text-xs"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 md:ml-[280px] flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-bg-surface/50 backdrop-blur-md border-b border-border-subtle px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <h1 className="text-lg font-semibold text-text-primary">{currentPageTitle}</h1>
            <div className="w-10" />
          </div>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden fixed inset-0 bg-black/50 z-30"
                />
                <motion.div
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  className="md:hidden fixed left-0 top-0 h-full w-80 bg-bg-surface/95 backdrop-blur-md z-40 flex flex-col shadow-xl"
                >
                  <div className="p-6 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-burgundy-500 to-champagne flex items-center justify-center text-white font-bold text-sm">
                        {initialUser ? getInitials(initialUser.displayName || initialUser.firstName) : 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {initialUser?.displayName || initialUser?.firstName || 'User'}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          @{initialUser?.username || 'username'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <SidebarNav />
                  </div>

                  <div className="p-4 border-t border-border-subtle">
                    <Button
                      variant="outline"
                      className="w-full text-xs"
                      size="sm"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pt-16 md:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
