'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarDays, Search, Store, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants'

const modules = [
  {
    id: 'members',
    title: 'Member Search',
    description: 'Discover and connect with verified members in the community.',
    href: ROUTES.COMMUNITY_MEMBERS,
    badge: 'Browse',
    icon: Search,
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Find upcoming events and meetups hosted by the community.',
    href: ROUTES.COMMUNITY_EVENTS,
    badge: 'Explore',
    icon: CalendarDays,
  },
  {
    id: 'classifieds',
    title: 'Classifieds',
    description: 'Browse listings, services, and exclusive content from members.',
    href: ROUTES.COMMUNITY_CLASSIFIEDS,
    badge: 'Discover',
    icon: Store,
  },
]

export default function CommunityHubClient() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-md md:p-8"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Welcome to</p>
          <h1 className="mt-3 text-4xl font-semibold text-foreground md:text-5xl">
            Community Hub
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            Connect with verified members, discover events, and explore exclusive content in one place.
          </p>
        </motion.section>

        <section className="grid gap-5 md:grid-cols-3">
          {modules.map((module, index) => {
            const Icon = module.icon
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <Link href={module.href} className="block h-full">
                  <Card className="h-full border-border/60 bg-card/65 transition-colors hover:border-primary/40">
                    <CardHeader className="space-y-4">
                      <div className="inline-flex w-fit rounded-xl border border-border/80 bg-background/50 p-3 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-xl">{module.title}</CardTitle>
                          <Badge variant="secondary">{module.badge}</Badge>
                        </div>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-end text-sm text-muted-foreground">
                        Open module
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Quick snapshot of what is moving in the community this week.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/45 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Members Joined</p>
                <p className="mt-2 text-3xl font-semibold">42</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/45 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Events This Month</p>
                <p className="mt-2 text-3xl font-semibold">9</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  )
}
