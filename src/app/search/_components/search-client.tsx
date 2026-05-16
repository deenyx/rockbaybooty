'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { searchMembers, sendFriendRequest } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { MemberSearchFilters, MemberSearchResult } from '@/lib/types'

type SearchPageClientProps = {
  initialResults?: MemberSearchResult[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
}

export default function SearchPageClient({ initialResults = [] }: SearchPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<MemberSearchResult[]>(initialResults)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [lastActive, setLastActive] = useState<MemberSearchFilters['lastActive']>('any')
  const [pendingFriendRequestId, setPendingFriendRequestId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const debounceId = window.setTimeout(async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await searchMembers(
          {
            q: searchQuery.trim() || undefined,
            onlineOnly,
            hasPhoto,
            lastActive,
            limit: 24,
          },
          controller.signal
        )

        setResults(response.members)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(err instanceof Error ? err.message : 'Unable to search members.')
      } finally {
        setIsLoading(false)
      }
    }, 220)

    return () => {
      window.clearTimeout(debounceId)
      controller.abort()
    }
  }, [searchQuery, onlineOnly, hasPhoto, lastActive])

  async function handleSendFriendRequest(memberId: string) {
    if (pendingFriendRequestId) return

    setPendingFriendRequestId(memberId)
    setError('')

    try {
      await sendFriendRequest(memberId)
      setResults((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                friendshipStatus: 'outgoing_pending',
              }
            : member
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send friend request.')
    } finally {
      setPendingFriendRequestId(null)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants}>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
                Find Your <span className="bg-gradient-to-r from-champagne to-burgundy-500 bg-clip-text text-transparent">Next Connection</span>
              </h1>
              <p className="text-text-muted text-lg mt-2">Discover amazing members in the community</p>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" />
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-bg-surface/50 border-border-subtle/50 hover:border-primary/30 focus:border-primary/50"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="border-border-subtle/50 hover:border-primary/30"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Advanced Filters</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Narrow results by activity and profile quality.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    type="button"
                    variant={onlineOnly ? 'default' : 'outline'}
                    className="w-full justify-start border-border-subtle/50 hover:border-primary/30"
                    onClick={() => setOnlineOnly((current) => !current)}
                  >
                    Online Only
                  </Button>
                  <Button
                    type="button"
                    variant={hasPhoto ? 'default' : 'outline'}
                    className="w-full justify-start border-border-subtle/50 hover:border-primary/30"
                    onClick={() => setHasPhoto((current) => !current)}
                  >
                    Has Photo
                  </Button>
                  <Button
                    type="button"
                    variant={lastActive === 'today' ? 'default' : 'outline'}
                    className="w-full justify-start border-border-subtle/50 hover:border-primary/30"
                    onClick={() => setLastActive((current) => (current === 'today' ? 'any' : 'today'))}
                  >
                    Active Today
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error && (
          <motion.div variants={itemVariants}>
            <p className="rounded-xl border border-rose-400/35 bg-rose-500/20 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          </motion.div>
        )}

        {/* Results Section */}
        <motion.div variants={itemVariants}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-text-primary">
                {isLoading ? 'Loading...' : `${results.length} Members Found`}
              </h2>
              {results.length > 0 && (
                <p className="text-text-muted text-sm">Sort by: Latest • Popular • Most Active</p>
              )}
            </div>

            {/* Results Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 8 }).map((_, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                    <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50 overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : results.length > 0 ? (
                results.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50 hover:border-primary/30 overflow-hidden cursor-pointer transition-all group">
                      {/* Avatar Placeholder */}
                      <div className="relative h-48 bg-gradient-to-br from-burgundy-600/20 to-champagne/10 overflow-hidden">
                        {member.isOnline && (
                          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/80 backdrop-blur-sm">
                            <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
                            <span className="text-xs font-semibold text-white">Online</span>
                          </div>
                        )}
                          {member.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.avatarUrl}
                              alt={`${member.displayName} avatar`}
                              className="h-full w-full object-cover"
                            />
                          )}
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 via-transparent to-transparent" />
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <div>
                          <p className="text-lg font-semibold text-text-primary">
                            {member.displayName}
                          </p>
                          <p className="text-sm text-text-muted">
                            {member.age && member.age > 0 ? `${member.age}` : 'Age hidden'}
                          </p>
                        </div>

                        {member.location && (
                          <p className="text-sm text-text-muted">{member.location}</p>
                        )}

                        {member.interests && member.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {member.interests.slice(0, 3).map((interest, iIdx) => (
                              <Badge
                                key={iIdx}
                                variant="secondary"
                                className="text-xs bg-champagne/20 text-champagne"
                              >
                                {interest}
                              </Badge>
                            ))}
                            {member.interests.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-champagne/20 text-champagne"
                              >
                                +{member.interests.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="text-xs"
                            disabled={
                              pendingFriendRequestId === member.id ||
                              member.friendshipStatus === 'friends' ||
                              member.friendshipStatus === 'outgoing_pending'
                            }
                            onClick={() => {
                              void handleSendFriendRequest(member.id)
                            }}
                          >
                            {member.friendshipStatus === 'friends'
                              ? 'Friends'
                              : member.friendshipStatus === 'outgoing_pending'
                                ? 'Requested'
                                : pendingFriendRequestId === member.id
                                  ? 'Sending...'
                                  : 'Add Friend'}
                          </Button>
                          <Link
                            href={`${ROUTES.MESSAGES}/${member.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-border-subtle/50 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            Message
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                // Empty State
                <motion.div
                  variants={itemVariants}
                  className="col-span-full"
                >
                  <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50 py-12">
                    <CardContent className="text-center space-y-4">
                      <Search className="h-12 w-12 text-text-muted mx-auto opacity-50" />
                      <div>
                        <p className="text-lg font-semibold text-text-primary">No members found</p>
                        <p className="text-text-muted">Try adjusting your filters or search terms</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
