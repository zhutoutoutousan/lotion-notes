"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, FileText, Network, Sparkles } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder.svg?height=80&width=80" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>John Doe</CardTitle>
                <CardDescription>john.doe@example.com</CardDescription>
                <div className="flex space-x-2 mt-2">
                  <Badge variant="outline">Knowledge Explorer</Badge>
                  <Badge variant="outline">AI Enthusiast</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Bio</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Product manager with a passion for AI and knowledge management. I love exploring new ways to organize
                  and connect information.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Stats</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">127 Notes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">54 Knowledge Nodes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">32 Calendar Events</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">3 Active AI Agents</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Knowledge Progress</CardTitle>
            <CardDescription>Track your learning progress across different areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Concepts</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Machine Learning</span>
                  <span>60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Product Management</span>
                  <span>90%</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>UX Design</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Data Analysis</span>
                  <span>70%</span>
                </div>
                <Progress value={70} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="settings">Profile Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  title="Added a new note"
                  description="Project Ideas"
                  time="10 minutes ago"
                  icon={FileText}
                />
                <ActivityItem
                  title="Connected knowledge nodes"
                  description="Connected 'AI Research' to 'Project Ideas'"
                  time="1 hour ago"
                  icon={Network}
                />
                <ActivityItem
                  title="Added calendar event"
                  description="Team Brainstorming"
                  time="3 hours ago"
                  icon={Calendar}
                />
                <ActivityItem
                  title="AI agent completed task"
                  description="Research agent found 5 relevant articles"
                  time="Yesterday"
                  icon={Sparkles}
                />
                <ActivityItem title="Updated note" description="Meeting Notes" time="Yesterday" icon={FileText} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Milestones you've reached</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AchievementCard
                  title="Knowledge Explorer"
                  description="Created 50+ knowledge nodes"
                  progress={100}
                  completed={true}
                />
                <AchievementCard title="Note Taker" description="Created 100+ notes" progress={100} completed={true} />
                <AchievementCard
                  title="Connection Maker"
                  description="Created 30+ connections between nodes"
                  progress={80}
                  completed={false}
                />
                <AchievementCard
                  title="AI Collaborator"
                  description="Used AI agents for 20+ tasks"
                  progress={75}
                  completed={false}
                />
                <AchievementCard
                  title="Game Master"
                  description="Created 5+ knowledge games"
                  progress={40}
                  completed={false}
                />
                <AchievementCard
                  title="Calendar Optimizer"
                  description="Used AI to schedule 10+ events"
                  progress={60}
                  completed={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
  icon: React.ElementType
}

function ActivityItem({ title, description, time, icon: Icon }: ActivityItemProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="rounded-full bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-xs text-muted-foreground">{time}</div>
    </div>
  )
}

interface AchievementCardProps {
  title: string
  description: string
  progress: number
  completed: boolean
}

function AchievementCard({ title, description, progress, completed }: AchievementCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {completed && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  )
}

function ProfileSettingsForm() {
  const [name, setName] = useState("John Doe")
  const [email, setEmail] = useState("john.doe@example.com")
  const [bio, setBio] = useState(
    "Product manager with a passion for AI and knowledge management. I love exploring new ways to organize and connect information.",
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}

