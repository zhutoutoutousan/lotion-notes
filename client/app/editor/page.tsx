"use client";

import { useState, useRef, useEffect } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import dynamic from "next/dynamic";
import { parseMarkdownToGraph } from "@/lib/utils/markdown-parser";

// Dynamically import the World3D component with a loading fallback
const World3D = dynamic(() => import("@/components/world-3d").then(mod => mod.World3D), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  ),
  ssr: false
});

export default function EditorPage() {
  const [markdown, setMarkdown] = useState(`# Welcome to Lotion Notes

## Features
* Multi-modal editor
* Knowledge graph visualization
* 3D world representation

## Getting Started
1. Write your notes in markdown
2. See them visualized in different ways
3. Explore connections in 3D

## Tips
- Use headings to create main nodes
- Use lists for related concepts
- Add paragraphs for detailed explanations`);

  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [activeTab, setActiveTab] = useState("editor");
  const [nightMode, setNightMode] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = parseMarkdownToGraph(markdown);
    setGraphData(data);
  }, [markdown]);

  useEffect(() => {
    if (!particlesRef.current || !showParticles) return;

    const createParticle = () => {
      const particle = document.createElement("div");
      particle.className = "absolute w-1 h-1 bg-white rounded-full";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.opacity = Math.random().toString();
      particle.style.transform = `scale(${Math.random()})`;
      particlesRef.current?.appendChild(particle);

      const animation = particle.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(0)`, opacity: 0 },
        ],
        {
          duration: Math.random() * 2000 + 1000,
          easing: "cubic-bezier(0,0,0.2,1)",
        }
      );

      animation.onfinish = () => {
        particle.remove();
      };
    };

    const interval = setInterval(createParticle, 100);

    return () => {
      clearInterval(interval);
      if (particlesRef.current) {
        particlesRef.current.innerHTML = "";
      }
    };
  }, [showParticles]);

  return (
    <div className={`min-h-screen ${nightMode ? "bg-black text-white" : "bg-white text-black"}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
            Lotion Notes Editor
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setNightMode(!nightMode)}
              className={`px-4 py-2 rounded-full ${
                nightMode ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-200 hover:bg-gray-300"
              } transition-colors`}
            >
              {nightMode ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => setShowParticles(!showParticles)}
              className={`px-4 py-2 rounded-full ${
                showParticles ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-200 hover:bg-gray-300"
              } transition-colors`}
            >
              ✨
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "editor"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "preview"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "graph"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            Knowledge Graph
          </button>
          <button
            onClick={() => setActiveTab("3d")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "3d"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            3D World
          </button>
        </div>

        <div className="relative h-[calc(100vh-12rem)]">
          {showParticles && (
            <div
              ref={particlesRef}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            />
          )}

          {activeTab === "editor" && (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className={`w-full h-full p-4 rounded-lg resize-none ${
                nightMode
                  ? "bg-gray-900 text-white border-gray-700"
                  : "bg-white text-black border-gray-300"
              } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          )}

          {activeTab === "preview" && (
            <div className={`w-full h-full p-4 rounded-lg overflow-auto ${
              nightMode ? "bg-gray-900" : "bg-white"
            }`}>
              <MarkdownPreview content={markdown} />
            </div>
          )}

          {activeTab === "graph" && (
            <div className="w-full h-full rounded-lg overflow-hidden bg-gray-900">
              <KnowledgeGraph
                nodes={graphData.nodes}
                edges={graphData.edges}
                onNodeSelect={(node) => console.log("Selected node:", node)}
              />
            </div>
          )}

          {activeTab === "3d" && (
            <div className="w-full h-full rounded-lg overflow-hidden bg-gray-900">
              <World3D
                nodes={graphData.nodes}
                edges={graphData.edges}
                onNodeSelect={(node) => console.log("Selected node:", node)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 