"use client";

import { useState, useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Edit, Check, X } from "lucide-react";

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
  onEdgeSelect?: (edge: Edge) => void;
  isEditing?: boolean;
  showLabels?: boolean;
}

export function KnowledgeGraph({
  nodes,
  edges,
  onNodeSelect,
  onEdgeSelect,
  isEditing = false,
  showLabels = true
}: KnowledgeGraphProps) {
  const [formattedData, setFormattedData] = useState<{ nodes: Node[]; links: any[] }>({
    nodes: [],
    links: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [draggingNode, setDraggingNode] = useState<Node | null>(null);
  const graphRef = useRef<any>(null);

  // Format nodes and edges for the graph
  useEffect(() => {
    try {
      setLoading(true);
      
      // Format nodes with colors based on type
      const formattedNodes = nodes.map(node => ({
        ...node,
        color: getNodeColor(node.type)
      }));
      
      // Format edges
      const formattedLinks = edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        label: edge.label
      }));
      
      setFormattedData({
        nodes: formattedNodes,
        links: formattedLinks
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Error formatting graph data:", err);
      setError("Failed to format graph data");
      setLoading(false);
    }
  }, [nodes, edges]);

  // Get node color based on type
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

  // Handle zoom in
  const handleZoomIn = () => {
    if (graphRef.current) {
      const newZoom = zoom * 1.2;
      graphRef.current.zoom(newZoom);
      setZoom(newZoom);
    }
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (graphRef.current) {
      const newZoom = zoom / 1.2;
      graphRef.current.zoom(newZoom);
      setZoom(newZoom);
    }
  };

  // Handle reset zoom
  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1);
      setZoom(1);
    }
  };

  // Handle node click
  const handleNodeClick = (node: any) => {
    const selectedNode: Node = {
      id: node.id,
      label: node.label,
      type: node.type,
      level: node.level
    };
    
    setSelectedNode(selectedNode);
    
    if (onNodeSelect) {
      onNodeSelect(selectedNode);
    }
  };

  // Handle edge click
  const handleEdgeClick = (link: any) => {
    const selectedEdge: Edge = {
      source: link.source.id || link.source,
      target: link.target.id || link.target,
      label: link.label
    };
    
    setSelectedEdge(selectedEdge);
    
    if (onEdgeSelect) {
      onEdgeSelect(selectedEdge);
    }
  };

  // Handle node drag
  const handleNodeDrag = (node: Node) => {
    if (isEditing) {
      // Node is being dragged
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-2">Loading graph...</span>
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

  // If no nodes are available, show a message with a sample node
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h3 className="text-lg font-bold mb-2">No Knowledge Graph Data</h3>
        <p className="text-gray-500 mb-4">Start adding nodes to your knowledge graph to see them here.</p>
        <Button 
          onClick={() => {
            // Add a sample node to demonstrate the graph
            const sampleNode = {
              id: `node-${Date.now()}`,
              label: "Sample Node",
              type: "paragraph"
            };
            if (onNodeSelect) {
              onNodeSelect(sampleNode);
            }
          }}
        >
          Add Sample Node
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ForceGraph2D
        ref={graphRef}
        graphData={formattedData}
        nodeLabel="label"
        nodeColor={node => node.color}
        nodeRelSize={6}
        linkColor={() => "#666666"}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        onLinkClick={handleEdgeClick}
        onNodeDrag={handleNodeDrag}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          // Handle undefined values for x and y
          const x = node.x || 0;
          const y = (node.y || 0) + 10;
          ctx.fillText(label, x, y);
        }}
        cooldownTicks={100}
        linkCurvature={0.2}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => "#666666"}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={isEditing}
        nodeCanvasObjectMode={() => showLabels ? 'replace' : 'append'}
      />
      
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleZoomIn}
          className="bg-white dark:bg-gray-800"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleZoomOut}
          className="bg-white dark:bg-gray-800"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleResetZoom}
          className="bg-white dark:bg-gray-800"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {isEditing && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">Editing Mode</h3>
          <p className="text-sm mb-2">Drag nodes to reposition them</p>
          <p className="text-sm">Click nodes or edges to edit them</p>
        </div>
      )}
      
      {selectedNode && !isEditing && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="text-lg font-bold text-white mb-2">{selectedNode.label}</h3>
          <p className="text-gray-300 text-sm">Type: {selectedNode.type || "Unknown"}</p>
          {selectedNode.level && (
            <p className="text-gray-300 text-sm">Level: {selectedNode.level}</p>
          )}
        </div>
      )}
      
      {selectedEdge && !isEditing && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="text-lg font-bold text-white mb-2">Connection</h3>
          <p className="text-gray-300 text-sm">
            From: {nodes.find(n => n.id === selectedEdge.source)?.label || selectedEdge.source}
          </p>
          <p className="text-gray-300 text-sm">
            To: {nodes.find(n => n.id === selectedEdge.target)?.label || selectedEdge.target}
          </p>
          {selectedEdge.label && (
            <p className="text-gray-300 text-sm">Label: {selectedEdge.label}</p>
          )}
        </div>
      )}
    </div>
  );
} 