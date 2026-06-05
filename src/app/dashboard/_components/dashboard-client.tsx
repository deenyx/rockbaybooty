'use client'

import React from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Users, Zap, Heart, TrendingUp, MapPin, Compass, Copy, ExternalLink } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

type DashboardViewData = {
  user: {
    id: string
    username: string
    accountName: string
    firstName: string
    displayName: string
    personalCode: string
  }
  profile: {
    age: number | null
    location: string
    bio: string
    lookingFor: string[]
    interests: string[]
    avatarUrl: string
    city: string
    state: string
    country: string
    gender: string
    genderOther: string
    sexualOrientation: string
    orientationOther: string
  }
}

type DashboardClientProps = {
  initialData: DashboardViewData
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

function getDefaultArea(profile: DashboardViewData['profile']) {
  const cityStateCountry = [profile.city, profile.state, profile.country].filter(Boolean)

  if (cityStateCountry.length > 0) {
    return cityStateCountry.join(', ')
  }

  if (profile.location && profile.location !== 'Preview mode') {
    return profile.location
  }

  return 'Downtown'
}


export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { user, profile } = initialData
  const defaultArea = getDefaultArea(profile)
  const [startArea, setStartArea] = React.useState(defaultArea)
  const [destination, setDestination] = React.useState('')
  const [travelMode, setTravelMode] = React.useState<'driving' | 'walking' | 'transit'>('driving')
  const [activeMapQuery, setActiveMapQuery] = React.useState(defaultArea)
  const [copied, setCopied] = React.useState(false)

  const quickDestinations = ['Coffee shop', 'Cocktail bar', 'Lounge', 'Dinner spot', 'Hotel lobby']

  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(activeMapQuery)}&output=embed`
  const routeUrl = destination.trim()
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startArea)}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMapQuery)}`

  const meetupSummary = destination.trim()
    ? `Meetup plan: starting around ${startArea}, destination ${destination}, mode ${travelMode}.`
    : `Meetup plan: exploring options around ${startArea}.`

  async function copyMeetupSummary() {
    try {
      await navigator.clipboard.writeText(meetupSummary)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  function searchMap() {
    if (destination.trim()) {
      setActiveMapQuery(`${startArea} to ${destination}`)
      return
    }

    setActiveMapQuery(startArea)
  }

  const statCards = [
    {
      title: 'Profile Views',
      value: '2,845',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Connections',
      value: '128',
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Likes Received',
      value: '342',
      icon: Heart,
      gradient: 'from-pink-500 to-pink-600',
    },
    {
      title: 'Engagement',
      value: '89%',
      icon: Zap,
      gradient: 'from-yellow-500 to-yellow-600',
    },
  ]

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Top Section */}
        <motion.div variants={itemVariants}>
          <div className="mb-8 rounded-3xl border border-border-subtle/60 bg-gradient-to-br from-bg-surface/60 to-bg-surface/20 p-5 backdrop-blur-md md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Member Dashboard</p>
                <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">Your Activity Overview</h1>
                <p className="text-sm text-text-muted md:text-base">Here's what's happening with your profile.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={ROUTES.SEARCH}
                  className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-300/15"
                >
                  Discover Members
                </Link>
                <Link
                  href={ROUTES.FRIENDS}
                  className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/15"
                >
                  View Friends
                </Link>
                <Link
                  href={ROUTES.MESSAGES}
                  className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/15"
                >
                  Open Messages
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                whileHover={{ y: -5, boxShadow: '0 20px 25px -5 rgba(0, 0, 0, 0.3)' }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-text-muted">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
                    <p className="text-xs text-text-muted mt-2">+12.5% from last month</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Profile Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-burgundy-500/10 via-transparent to-champagne/10 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-2xl">Your Profile</CardTitle>
                <CardDescription>Your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-text-muted mb-1">Display Name</p>
                    <p className="text-lg font-semibold text-text-primary">{user.displayName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-1">Username</p>
                    <p className="text-lg font-semibold text-text-primary">@{user.username}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-text-muted mb-1">Member Marker</p>
                  <p className="text-base font-semibold text-champagne">{user.accountName} + @{user.username}</p>
                </div>

                {profile.bio && (
                  <div>
                    <p className="text-sm text-text-muted mb-2">Bio</p>
                    <p className="text-text-primary">{profile.bio}</p>
                  </div>
                )}

                {profile.location && (
                  <div>
                    <p className="text-sm text-text-muted mb-1">Location</p>
                    <p className="text-text-primary">{profile.location}</p>
                  </div>
                )}

                {profile.age && (
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm text-text-muted mb-1">Age</p>
                      <p className="text-text-primary">{profile.age}</p>
                    </div>
                    {profile.gender && (
                      <div>
                        <p className="text-sm text-text-muted mb-1">Gender</p>
                        <p className="text-text-primary capitalize">{profile.gender}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Interests Card */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50 h-full">
              <CardHeader>
                <CardTitle className="text-lg">Interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {profile.interests && profile.interests.length > 0 ? (
                    profile.interests.map((interest, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge variant="secondary" className="bg-champagne/20 text-champagne hover:bg-champagne/30">
                          {interest}
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted">No interests added yet</p>
                  )}
                </div>

                {profile.lookingFor && profile.lookingFor.length > 0 && (
                  <div className="pt-4 border-t border-border-subtle">
                    <p className="text-sm font-semibold text-text-muted mb-2">Looking For</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.lookingFor.map((item, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge variant="default" className="bg-burgundy-600 text-white hover:bg-burgundy-700">
                            {item}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-bg-surface/50 to-bg-surface/20 border-border-subtle/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your activity over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Profile updated', time: '2 hours ago' },
                  { action: 'New connection established', time: '5 hours ago' },
                  { action: 'Profile viewed by 12 members', time: '1 day ago' },
                  { action: 'Received 3 new messages', time: '2 days ago' },
                ].map((activity, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between py-3 border-b border-border-subtle/30 last:border-0"
                  >
                    <p className="text-text-primary">{activity.action}</p>
                    <p className="text-xs text-text-muted">{activity.time}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Map Planner */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-border-subtle/50 bg-gradient-to-br from-bg-surface/50 to-bg-surface/20">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="h-5 w-5 text-champagne" />
                    Map Planner
                  </CardTitle>
                  <CardDescription>Plan meetups without leaving your dashboard.</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100">
                  Area-first privacy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-muted">Start Area</p>
                  <Input
                    value={startArea}
                    onChange={(event) => setStartArea(event.target.value)}
                    placeholder="City, state, or district"
                  />
                </div>
                <div className="md:col-span-1">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-muted">Destination</p>
                  <Input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="Coffee shop near Midtown"
                  />
                </div>
                <div className="md:col-span-1">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-text-muted">Travel Mode</p>
                  <div className="flex gap-2">
                    {(['driving', 'walking', 'transit'] as const).map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={travelMode === mode ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTravelMode(mode)}
                        className="capitalize"
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickDestinations.map((spot) => (
                  <Button
                    key={spot}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDestination(`${spot} near ${startArea}`)
                    }}
                  >
                    {spot}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={searchMap} className="gap-2">
                  <Compass className="h-4 w-4" />
                  Update Map
                </Button>
                <Button type="button" variant="outline" onClick={copyMeetupSummary} className="gap-2">
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy Meetup Plan'}
                </Button>
                <a
                  href={routeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button type="button" variant="secondary" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Full Map
                  </Button>
                </a>
              </div>

              <div className="rounded-xl border border-border-subtle/60 bg-black/10 p-2">
                <iframe
                  title="Member meetup map"
                  src={mapEmbedUrl}
                  className="h-[320px] w-full rounded-lg border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-xs text-amber-100">
                Keep exact addresses in direct messages only after both members agree. Start with city or district-level planning by default.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
