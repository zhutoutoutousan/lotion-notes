"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Save, Eye, Network, Gamepad } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { World3D } from "@/components/world-3d";
import { SideScrollingGame } from "@/components/side-scrolling-game";
import { ModeToggle } from "@/components/mode-toggle";

// Dynamically import the KnowledgeGraph component with no SSR
const KnowledgeGraph = dynamic(
  () => import("@/components/knowledge-graph").then((mod) => mod.KnowledgeGraph),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div> }
);

// Define interfaces for our data types
interface Node {
  id: string;
  label: string;
  type?: string;
  level?: number;
}

interface Edge {
  source: string;
  target: string;
  label?: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export default function EditorPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [markdown, setMarkdown] = useState("");
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [activeTab, setActiveTab] = useState<"preview" | "graph" | "world" | "game">("preview");
  const [nightMode, setNightMode] = useState(false);
  const [particleEffects, setParticleEffects] = useState(true);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [isEditingGraph, setIsEditingGraph] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState<Array<{id: string, title: string, updatedAt: number}>>([]);
  const [selectedNote, setSelectedNote] = useState<{id: string, title: string, updatedAt: number} | null>(null);

  // Extract nodes from markdown content
  useEffect(() => {
    if (markdown) {
      const lines = markdown.split('\n');
      const nodes: Node[] = [];
      const edges: Edge[] = [];
      
      let currentNodeId: string | null = null;
      
      lines.forEach((line, index) => {
        // Extract headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          const nodeId = `heading-${index}`;
          
          nodes.push({
            id: nodeId,
            label: text,
            type: "heading",
            level
          });
          
          // Connect to previous node if exists
          if (currentNodeId) {
            edges.push({
              source: currentNodeId,
              target: nodeId,
              label: "contains"
            });
          }
          
          currentNodeId = nodeId;
        } 
        // Extract paragraphs (non-empty lines that aren't headings)
        else if (line.trim() && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('1.')) {
          const nodeId = `paragraph-${index}`;
          
          nodes.push({
            id: nodeId,
            label: line.length > 30 ? line.substring(0, 30) + '...' : line,
            type: "paragraph"
          });
          
          // Connect to previous node if exists
          if (currentNodeId) {
            edges.push({
              source: currentNodeId,
              target: nodeId,
              label: "contains"
            });
          }
          
          currentNodeId = nodeId;
        }
        // Extract list items
        else if (line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/)) {
          const nodeId = `list-${index}`;
          const text = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
          
          nodes.push({
            id: nodeId,
            label: text,
            type: "list"
          });
          
          // Connect to previous node if exists
          if (currentNodeId) {
            edges.push({
              source: currentNodeId,
              target: nodeId,
              label: "contains"
            });
          }
          
          currentNodeId = nodeId;
        }
      });
      
      setGraphData({ nodes, edges });
    }
  }, [markdown]);

  // Toggle night mode
  const toggleNightMode = () => {
    setNightMode(!nightMode);
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Toggle particle effects
  const toggleParticleEffects = () => {
    setParticleEffects(!particleEffects);
  };

  // Handle node selection from the graph
  const handleNodeSelect = (node: Node) => {
    if (isEditingGraph) {
      setEditingNode(node);
    }
    // You could also scroll to the corresponding section in the editor
    // or highlight the relevant text
  };

  // Handle edge selection from the graph
  const handleEdgeSelect = (edge: Edge) => {
    if (isEditingGraph) {
      setEditingEdge(edge);
    }
  };

  // Save node edits
  const saveNodeEdit = (updatedNode: Node) => {
    setGraphData(prevData => {
      const updatedNodes = prevData.nodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      );
      return { ...prevData, nodes: updatedNodes };
    });
    setEditingNode(null);
  };

  // Save edge edits
  const saveEdgeEdit = (updatedEdge: Edge) => {
    setGraphData(prevData => {
      const updatedEdges = prevData.edges.map(edge => 
        edge.source === updatedEdge.source && edge.target === updatedEdge.target 
          ? updatedEdge : edge
      );
      return { ...prevData, edges: updatedEdges };
    });
    setEditingEdge(null);
  };

  // Add a new node
  const addNode = (newNode: Node) => {
    setGraphData(prevData => ({
      ...prevData,
      nodes: [...prevData.nodes, newNode]
    }));
  };

  // Add a new edge
  const addEdge = (newEdge: Edge) => {
    setGraphData(prevData => ({
      ...prevData,
      edges: [...prevData.edges, newEdge]
    }));
  };

  // Delete a node
  const deleteNode = (nodeId: string) => {
    setGraphData(prevData => ({
      nodes: prevData.nodes.filter(node => node.id !== nodeId),
      edges: prevData.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      )
    }));
  };

  // Delete an edge
  const deleteEdge = (source: string, target: string) => {
    setGraphData(prevData => ({
      ...prevData,
      edges: prevData.edges.filter(edge => 
        !(edge.source === source && edge.target === target)
      )
    }));
  };

  // Toggle graph editing mode
  const toggleGraphEditing = () => {
    setIsEditingGraph(!isEditingGraph);
  };

  // Save the current document
  const saveDocument = () => {
    // Here you would implement the actual save functionality
    // For now, we'll just show a toast notification
    toast.success("Document saved successfully!");
  };

  const handleCreateNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: "New Note",
      updatedAt: Date.now()
    };
    setNotes([...notes, newNote]);
    setSelectedNote(newNote);
    setTitle(newNote.title);
    setMarkdown("");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={`bg-element-${i}`}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              background: `hsl(${Math.random() * 360}, 70%, 60%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Main content container with rotation */}
      <div className="absolute inset-4 rotate-[-1deg] transform-gpu">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Sidebar - positioned diagonally */}
          <div className="col-span-3 bg-black/30 backdrop-blur-md p-4 rounded-lg transform rotate-[-2deg] translate-y-4 shadow-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Lotion Notes</h1>
              <div className="transform rotate-12">
                <ModeToggle />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-2 rounded cursor-pointer transform transition-all hover:scale-105 ${
                      selectedNote?.id === note.id
                        ? "bg-purple-500/50 text-white"
                        : "hover:bg-purple-500/20 text-purple-200"
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="font-medium truncate">{note.title}</div>
                    <div className="text-xs text-purple-300/70 truncate">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="mt-4 p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              onClick={handleCreateNote}
            >
              New Note
            </button>
          </div>

          {/* Editor - positioned with a slight tilt */}
          <div className="col-span-5 bg-black/20 backdrop-blur-sm p-4 rounded-lg transform rotate-[1deg] translate-y-[-1rem] shadow-2xl border border-blue-500/30">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold mb-4 bg-transparent border-b border-purple-500/50 focus:outline-none focus:border-purple-400 text-purple-200 placeholder-purple-500/50"
              placeholder="Note title"
            />
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[calc(100%-4rem)] bg-transparent focus:outline-none resize-none text-purple-200 placeholder-purple-500/50"
              placeholder="Start writing your note..."
            />
          </div>

          {/* Preview/Graph/World/Game Tabs - positioned with a different tilt */}
          <div className="col-span-4 bg-black/20 backdrop-blur-sm rounded-lg transform rotate-[2deg] translate-y-4 shadow-2xl border border-indigo-500/30 overflow-hidden">
            {/* Tab buttons - arranged in a circle */}
            <div className="relative h-16 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-purple-500/30 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-blue-500/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-indigo-500/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-purple-500/50"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex space-x-1">
                  <button
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      activeTab === "preview"
                        ? "bg-purple-500 text-white"
                        : "bg-purple-500/20 text-purple-300"
                    }`}
                    onClick={() => setActiveTab("preview")}
                  >
                    P
                  </button>
                  <button
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      activeTab === "graph"
                        ? "bg-blue-500 text-white"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                    onClick={() => setActiveTab("graph")}
                  >
                    G
                  </button>
                  <button
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      activeTab === "world"
                        ? "bg-indigo-500 text-white"
                        : "bg-indigo-500/20 text-indigo-300"
                    }`}
                    onClick={() => setActiveTab("world")}
                  >
                    W
                  </button>
                  <button
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      activeTab === "game"
                        ? "bg-pink-500 text-white"
                        : "bg-pink-500/20 text-pink-300"
                    }`}
                    onClick={() => setActiveTab("game")}
                  >
                    S
                  </button>
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="h-[calc(100%-4rem)] overflow-hidden">
              {activeTab === "preview" && (
                <div className="h-full overflow-y-auto p-4 prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-purple-400 mb-4" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-purple-300 mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-purple-200 mb-2" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="text-lg font-bold text-purple-100 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-purple-400 pl-4 italic my-4" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a className="text-purple-400 hover:text-purple-300 underline" {...props} />
                      ),
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              )}
              {activeTab === "graph" && (
                <div className="h-full">
                  <KnowledgeGraph nodes={graphData.nodes} edges={graphData.edges} onNodeSelect={handleNodeSelect} />
                </div>
              )}
              {activeTab === "world" && (
                <div className="h-full">
                  <World3D nodes={graphData.nodes} edges={graphData.edges} onNodeSelect={handleNodeSelect} />
                </div>
              )}
              {activeTab === "game" && (
                <div className="h-full">
                  <SideScrollingGame nodes={graphData.nodes} edges={graphData.edges} onNodeSelect={handleNodeSelect} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating action buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button className="w-12 h-12 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button className="w-12 h-12 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Add some CSS for the floating animation */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 10s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
} 