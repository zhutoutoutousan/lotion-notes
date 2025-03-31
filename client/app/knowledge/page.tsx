"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, ZoomIn, ZoomOut } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import ForceGraph from "@/components/force-graph"

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [zoomLevel, setZoomLevel] = useState([1])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Node
          </Button>
        </div>
      </div>
      <div className="flex w-full items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          className="flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Tabs defaultValue="graph" className="space-y-4">
        <TabsList>
          <TabsTrigger value="graph">Graph View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
        </TabsList>
        <TabsContent value="graph" className="space-y-4">
          <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Knowledge Graph</CardTitle>
                <CardDescription>Visual representation of your knowledge base</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  value={zoomLevel}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={setZoomLevel}
                  className="w-[100px]"
                />
                <ZoomIn className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] w-full border-t">
                <ForceGraph zoom={zoomLevel[0]} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Nodes</CardTitle>
              <CardDescription>All your knowledge nodes in list format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <KnowledgeNode
                  title="Project Ideas"
                  type="Note"
                  connections={["AI Research", "Meeting Notes"]}
                  lastUpdated="2 hours ago"
                />
                <KnowledgeNode
                  title="AI Research"
                  type="Research"
                  connections={["Project Ideas", "Machine Learning Concepts"]}
                  lastUpdated="Yesterday"
                />
                <KnowledgeNode
                  title="Meeting Notes"
                  type="Note"
                  connections={["Project Ideas", "Team Members"]}
                  lastUpdated="3 days ago"
                />
                <KnowledgeNode
                  title="Machine Learning Concepts"
                  type="Reference"
                  connections={["AI Research"]}
                  lastUpdated="1 week ago"
                />
                <KnowledgeNode
                  title="Team Members"
                  type="People"
                  connections={["Meeting Notes"]}
                  lastUpdated="2 weeks ago"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Agents</CardTitle>
              <CardDescription>AI agents that help manage your knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AgentCard
                  name="Research Assistant"
                  description="Finds and summarizes research papers and articles related to your interests"
                  status="Active"
                  lastRun="10 minutes ago"
                />
                <AgentCard
                  name="Note Organizer"
                  description="Automatically categorizes and connects your notes to relevant knowledge nodes"
                  status="Active"
                  lastRun="1 hour ago"
                />
                <AgentCard
                  name="Calendar Manager"
                  description="Helps schedule your calendar and suggests optimal meeting times"
                  status="Active"
                  lastRun="3 hours ago"
                />
                <AgentCard
                  name="Knowledge Connector"
                  description="Identifies connections between different knowledge nodes"
                  status="Inactive"
                  lastRun="2 days ago"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface KnowledgeNodeProps {
  title: string
  type: string
  connections: string[]
  lastUpdated: string
}

function KnowledgeNode({ title, type, connections, lastUpdated }: KnowledgeNodeProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Type: {type}</span>
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-medium">Connections:</span>
        <div className="flex flex-wrap justify-end gap-1 mt-1">
          {connections.map((connection, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {connection}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

interface AgentCardProps {
  name: string
  description: string
  status: "Active" | "Inactive"
  lastRun: string
}

function AgentCard({ name, description, status, lastRun }: AgentCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === "Active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {status}
          </span>
          <span className="text-xs text-muted-foreground">Last run: {lastRun}</span>
        </div>
      </div>
      <Button variant={status === "Active" ? "outline" : "default"} size="sm">
        {status === "Active" ? "Stop" : "Start"}
      </Button>
    </div>
  )
}

