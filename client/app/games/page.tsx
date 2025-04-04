"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function GamesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Knowledge Games</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Game
          </Button>
        </div>
      </div>
      <Tabs defaultValue="my-games" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-games">My Games</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>
        <TabsContent value="my-games" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <GameCard
              title="AI Concepts Quiz"
              description="Test your knowledge of AI concepts and terminology"
              type="Quiz"
              progress={75}
              lastPlayed="Yesterday"
            />
            <GameCard
              title="Knowledge Graph Explorer"
              description="Navigate through your knowledge graph to find connections"
              type="Explorer"
              progress={30}
              lastPlayed="3 days ago"
            />
            <GameCard
              title="Memory Match"
              description="Match related concepts to strengthen your memory"
              type="Memory"
              progress={50}
              lastPlayed="1 week ago"
            />
            <GameCard
              title="Concept Crossword"
              description="Solve crossword puzzles based on your knowledge base"
              type="Puzzle"
              progress={20}
              lastPlayed="2 weeks ago"
            />
          </div>
        </TabsContent>
        <TabsContent value="discover" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <GameCard
              title="Flashcard Challenge"
              description="Test your memory with flashcards generated from your notes"
              type="Flashcards"
              isNew={true}
            />
            <GameCard
              title="Knowledge Race"
              description="Race against time to answer questions about your knowledge base"
              type="Timed Quiz"
              isNew={true}
            />
            <GameCard
              title="Concept Connections"
              description="Draw connections between related concepts"
              type="Connection"
              isNew={true}
            />
            <GameCard
              title="Knowledge Sudoku"
              description="Fill in the grid with concepts from your knowledge base"
              type="Puzzle"
              isNew={true}
            />
            <GameCard
              title="Mind Map Challenge"
              description="Create a mind map of a topic from memory"
              type="Mind Map"
              isNew={true}
            />
            <GameCard
              title="Knowledge Trivia"
              description="Play trivia games based on your knowledge base"
              type="Trivia"
              isNew={true}
            />
          </div>
        </TabsContent>
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Game</CardTitle>
              <CardDescription>Design your own knowledge game to help reinforce learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <GameTemplateCard
                  title="Quiz Game"
                  description="Create a quiz with multiple-choice questions"
                  difficulty="Easy"
                />
                <GameTemplateCard
                  title="Matching Game"
                  description="Create a game where players match related concepts"
                  difficulty="Medium"
                />
                <GameTemplateCard
                  title="Crossword Puzzle"
                  description="Generate a crossword puzzle from your knowledge base"
                  difficulty="Hard"
                />
                <GameTemplateCard
                  title="Flashcards"
                  description="Create flashcards for quick knowledge review"
                  difficulty="Easy"
                />
                <GameTemplateCard
                  title="Word Search"
                  description="Hide words from your knowledge base in a grid"
                  difficulty="Medium"
                />
                <GameTemplateCard
                  title="Custom Game"
                  description="Design a completely custom game from scratch"
                  difficulty="Expert"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface GameCardProps {
  title: string
  description: string
  type: string
  progress?: number
  lastPlayed?: string
  isNew?: boolean
}

function GameCard({ title, description, type, progress, lastPlayed, isNew = false }: GameCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge>{type}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {lastPlayed && <p className="text-xs text-muted-foreground">Last played: {lastPlayed}</p>}
          </div>
        )}
        {isNew && (
          <div className="flex items-center justify-center h-20">
            <Badge variant="outline" className="text-sm">
              New Game Available
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full">{progress !== undefined ? "Continue" : "Start"}</Button>
      </CardFooter>
    </Card>
  )
}

interface GameTemplateCardProps {
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard" | "Expert"
}

function GameTemplateCard({ title, description, difficulty }: GameTemplateCardProps) {
  return (
    <Card className="cursor-pointer hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge
            variant="outline"
            className={
              difficulty === "Easy"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : difficulty === "Medium"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : difficulty === "Hard"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }
          >
            {difficulty}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}

