"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading graph...</div>
});

interface Node {
  id: string;
  label: string;
  type?: string;
  level?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  [key: string]: any;
}

interface Edge {
  source: string;
  target: string;
  label?: string;
}

interface KnowledgeGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect?: (node: Node) => void;
}

export function KnowledgeGraph({ nodes, edges, onNodeSelect }: KnowledgeGraphProps) {
  const [formattedData, setFormattedData] = useState<any>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [editingMode, setEditingMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    try {
      const formattedNodes = nodes.map(node => ({
        ...node,
        val: 1,
        color: getNodeColor(node.type),
      }));

      const formattedLinks = edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        label: edge.label,
      }));

      setFormattedData({
        nodes: formattedNodes,
        links: formattedLinks,
      });
      setLoading(false);
    } catch (err) {
      setError("Error formatting graph data");
      setLoading(false);
    }
  }, [nodes, edges]);

  const getNodeColor = (type?: string) => {
    switch (type) {
      case "heading":
        return "#9333ea"; // Purple
      case "list":
        return "#ec4899"; // Pink
      case "paragraph":
        return "#3b82f6"; // Blue
      default:
        return "#10b981"; // Green
    }
  };

  const handleZoomIn = () => {
    if (graphRef.current) {
      const newZoom = zoom * 1.2;
      graphRef.current.zoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const newZoom = zoom / 1.2;
      graphRef.current.zoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1);
      setZoom(1);
    }
  };

  const handleNodeClick = (node: any) => {
    const selectedNode: Node = {
      id: node.id,
      label: node.label || node.id,
      type: node.type,
      level: node.level,
      x: node.x,
      y: node.y,
      vx: node.vx,
      vy: node.vy,
      fx: node.fx,
      fy: node.fy,
    };
    setSelectedNode(selectedNode);
    if (onNodeSelect) {
      onNodeSelect(selectedNode);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
        >
          -
        </button>
        <button
          onClick={handleResetZoom}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
        >
          Reset
        </button>
        <button
          onClick={() => setEditingMode(!editingMode)}
          className={`${
            editingMode ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"
          } text-white p-2 rounded-full`}
        >
          {editingMode ? "Done" : "Edit"}
        </button>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={formattedData}
        nodeLabel="label"
        nodeColor={node => node.color}
        nodeRelSize={6}
        linkColor={() => "#4b5563"}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />

      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="text-lg font-bold text-white mb-2">{selectedNode.label}</h3>
          <p className="text-gray-300 text-sm">Type: {selectedNode.type || "Unknown"}</p>
          {selectedNode.level && (
            <p className="text-gray-300 text-sm">Level: {selectedNode.level}</p>
          )}
        </div>
      )}
    </div>
  );
} 