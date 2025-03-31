"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Users } from "lucide-react"

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>
      <Tabs defaultValue="my-calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-calendar">My Calendar</TabsTrigger>
          <TabsTrigger value="shared">Shared Calendars</TabsTrigger>
          <TabsTrigger value="ai-schedule">AI Scheduling</TabsTrigger>
        </TabsList>
        <TabsContent value="my-calendar" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Select a date to view events</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Events for {date?.toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <EventCard
                    title="Team Meeting"
                    time="10:00 AM - 11:00 AM"
                    description="Weekly team sync to discuss project progress"
                    attendees={[
                      { name: "John Doe", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Jane Smith", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Bob Johnson", avatar: "/placeholder.svg?height=32&width=32" },
                    ]}
                    tags={["Work", "Important"]}
                  />
                  <EventCard
                    title="Lunch Break"
                    time="12:00 PM - 1:00 PM"
                    description="Lunch with the design team at the new restaurant"
                    attendees={[
                      { name: "Alice Williams", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Charlie Brown", avatar: "/placeholder.svg?height=32&width=32" },
                    ]}
                    tags={["Personal"]}
                  />
                  <EventCard
                    title="Project Review"
                    time="2:00 PM - 3:00 PM"
                    description="Review the latest project deliverables with the client"
                    attendees={[
                      { name: "David Miller", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Emma Davis", avatar: "/placeholder.svg?height=32&width=32" },
                    ]}
                    tags={["Work", "Client"]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="shared" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Shared With Me</CardTitle>
                <CardDescription>Calendars shared by others</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">Work Calendar</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Jane Smith</p>
                      <p className="text-sm text-muted-foreground">Team Calendar</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>BJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Bob Johnson</p>
                      <p className="text-sm text-muted-foreground">Project Calendar</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Shared Calendars
                </Button>
              </CardFooter>
            </Card>
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Combined View</CardTitle>
                <CardDescription>View all shared calendars in one place</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <EventCard
                    title="Team Brainstorming"
                    time="9:00 AM - 10:30 AM"
                    description="Brainstorming session for the new project"
                    attendees={[
                      { name: "John Doe", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Jane Smith", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Bob Johnson", avatar: "/placeholder.svg?height=32&width=32" },
                    ]}
                    tags={["Work", "Team"]}
                    owner="Jane Smith"
                  />
                  <EventCard
                    title="Client Meeting"
                    time="1:00 PM - 2:00 PM"
                    description="Meeting with the client to discuss requirements"
                    attendees={[
                      { name: "Bob Johnson", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
                    ]}
                    tags={["Work", "Client"]}
                    owner="Bob Johnson"
                  />
                  <EventCard
                    title="Project Deadline"
                    time="5:00 PM"
                    description="Deadline for submitting the project deliverables"
                    attendees={[
                      { name: "John Doe", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Jane Smith", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "Bob Johnson", avatar: "/placeholder.svg?height=32&width=32" },
                      { name: "You", avatar: "/placeholder.svg?height=32&width=32" },
                    ]}
                    tags={["Work", "Deadline"]}
                    owner="John Doe"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="ai-schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Scheduling Assistant</CardTitle>
              <CardDescription>Let AI help you schedule your day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Based on your calendar and preferences, here's a suggested schedule:</p>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Morning Focus Block</h3>
                    <p className="text-sm text-muted-foreground">8:00 AM - 10:00 AM</p>
                    <p className="text-sm mt-2">
                      I've blocked this time for deep work on your priority tasks. Your energy levels are typically
                      highest in the morning.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Team Meeting</h3>
                    <p className="text-sm text-muted-foreground">10:00 AM - 11:00 AM</p>
                    <p className="text-sm mt-2">
                      Your regular team meeting is scheduled here. I've made sure to give you time to prepare
                      beforehand.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Lunch Break</h3>
                    <p className="text-sm text-muted-foreground">12:00 PM - 1:00 PM</p>
                    <p className="text-sm mt-2">
                      Taking a proper lunch break helps maintain your productivity for the afternoon.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Email & Communication Block</h3>
                    <p className="text-sm text-muted-foreground">1:00 PM - 2:00 PM</p>
                    <p className="text-sm mt-2">
                      I've allocated this time for catching up on emails and messages to avoid constant interruptions.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Project Work</h3>
                    <p className="text-sm text-muted-foreground">2:00 PM - 4:30 PM</p>
                    <p className="text-sm mt-2">This block is for focused work on your current project deliverables.</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium">Daily Wrap-up</h3>
                    <p className="text-sm text-muted-foreground">4:30 PM - 5:00 PM</p>
                    <p className="text-sm mt-2">Time to review what you've accomplished and plan for tomorrow.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Adjust Preferences</Button>
              <Button>Apply Schedule</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface EventCardProps {
  title: string
  time: string
  description: string
  attendees: { name: string; avatar: string }[]
  tags: string[]
  owner?: string
}

function EventCard({ title, time, description, attendees, tags, owner }: EventCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{time}</p>
        </div>
        {owner && (
          <Badge variant="outline" className="text-xs">
            {owner}'s Calendar
          </Badge>
        )}
      </div>
      <p className="text-sm mt-2">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {attendees.map((attendee, i) => (
            <Avatar key={i} className="border-2 border-background h-8 w-8">
              <AvatarImage src={attendee.avatar} alt={attendee.name} />
              <AvatarFallback>{attendee.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex space-x-2">
          {tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

