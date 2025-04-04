import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, FileText, Network, Sparkles } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">+5 in the last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Knowledge Nodes</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">54</div>
                <p className="text-xs text-muted-foreground">+12 in the last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">Next: Team Meeting (Tomorrow)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Agents Active</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Research, Calendar, Notes</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ActivityList />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Upcoming Schedule</CardTitle>
                <CardDescription>Your calendar for the next 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingSchedule />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ActivityList() {
  const activities = [
    {
      id: 1,
      type: "note",
      title: "Project Ideas",
      time: "10 minutes ago",
    },
    {
      id: 2,
      type: "knowledge",
      title: "Connected 'AI Research' to 'Project Ideas'",
      time: "1 hour ago",
    },
    {
      id: 3,
      type: "calendar",
      title: "Added 'Team Brainstorming' event",
      time: "3 hours ago",
    },
    {
      id: 4,
      type: "agent",
      title: "Research agent completed task",
      time: "Yesterday",
    },
    {
      id: 5,
      type: "note",
      title: "Meeting Notes",
      time: "Yesterday",
    },
  ]

  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{activity.title}</p>
            <p className="text-sm text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function UpcomingSchedule() {
  const events = [
    {
      id: 1,
      title: "Team Meeting",
      time: "10:00 AM - 11:00 AM",
      participants: ["You", "John", "Sarah", "Mike"],
    },
    {
      id: 2,
      title: "Project Review",
      time: "1:00 PM - 2:00 PM",
      participants: ["You", "Manager"],
    },
    {
      id: 3,
      title: "Client Call",
      time: "3:30 PM - 4:00 PM",
      participants: ["You", "Client"],
    },
  ]

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex items-center space-x-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{event.title}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              <span>{event.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

