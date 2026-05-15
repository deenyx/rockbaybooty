'use client'

import React from 'react'
import { motion, type Variants } from 'framer-motion'
import { Users, Zap, Heart, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type DashboardViewData = {
  user: {
    id: string
    username: string
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


export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { user, profile } = initialData

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
        {/* Welcome Section */}
        <motion.div variants={itemVariants}>
          <div className="space-y-2 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
              Welcome back, <span className="bg-gradient-to-r from-champagne to-burgundy-500 bg-clip-text text-transparent">{user.displayName || user.firstName}</span>
            </h1>
            <p className="text-text-muted text-lg">Here's what's happening with your profile</p>
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
      </motion.div>
    </div>
  )
}
