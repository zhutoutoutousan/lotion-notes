"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";

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

interface World3DProps {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect?: (node: Node) => void;
}

// Node component for rendering individual nodes
function NodeMesh({ node, position, onClick }: { node: Node; position: [number, number, number]; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Rotate the node
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

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

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshPhongMaterial 
        color={getNodeColor(node.type)} 
        emissive={getNodeColor(node.type)}
        emissiveIntensity={0.5}
      />
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1}
      >
        {node.label}
      </Text>
    </mesh>
  );
}

// Edge component for rendering connections between nodes
function EdgeLine({ 
  source, 
  target, 
  color = "#666666" 
}: { 
  source: [number, number, number]; 
  target: [number, number, number]; 
  color?: string;
}) {
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...source, ...target])}
          itemSize={3}
          args={[new Float32Array([...source, ...target]), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color={color} transparent opacity={0.5} />
    </line>
  );
}

// Nightclub lights component
function NightclubLights() {
  const lightColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
  
  return (
    <>
      {lightColors.map((color, index) => {
        const angle = (index / lightColors.length) * Math.PI * 2;
        const x = Math.cos(angle) * 5;
        const y = Math.sin(angle) * 5;
        
        return (
          <pointLight 
            key={index} 
            position={[x, y, 0]} 
            color={color} 
            intensity={1} 
            distance={10} 
          />
        );
      })}
    </>
  );
}

// Error boundary component to catch WebGL errors
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('WebGL') || event.message.includes('THREE')) {
        setHasError(true);
        setErrorMessage(event.message);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-4">
        <h3 className="text-lg font-bold mb-2">WebGL Error</h3>
        <p className="text-sm mb-4">{errorMessage || 'A WebGL error occurred'}</p>
        <button 
          className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Main scene component
function Scene({ nodes, edges, onNodeSelect }: { nodes: Node[]; edges: Edge[]; onNodeSelect?: (node: Node) => void }) {
  const [nodePositions, setNodePositions] = useState<Record<string, [number, number, number]>>({});
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Initialize node positions
  useEffect(() => {
    const positions: Record<string, [number, number, number]> = {};
    
    nodes.forEach(node => {
      positions[node.id] = [
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      ];
    });
    
    setNodePositions(positions);
  }, [nodes]);
  
  // Handle node selection
  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[1, 1, 1]} intensity={1} />
      <NightclubLights />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Render nodes */}
      {nodes.map(node => {
        const position = nodePositions[node.id] || [0, 0, 0];
        return (
          <NodeMesh 
            key={node.id} 
            node={node} 
            position={position} 
            onClick={() => handleNodeClick(node)} 
          />
        );
      })}
      
      {/* Render edges */}
      {edges.map((edge, index) => {
        const sourcePos = nodePositions[edge.source] || [0, 0, 0];
        const targetPos = nodePositions[edge.target] || [0, 0, 0];
        return (
          <EdgeLine 
            key={`${edge.source}-${edge.target}-${index}`} 
            source={sourcePos} 
            target={targetPos} 
          />
        );
      })}
      
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
}

// Main component
export function World3D({ nodes, edges, onNodeSelect }: World3DProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [contextLost, setContextLost] = useState(false);
  
  // Set a timeout to ensure loading state is updated
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle node selection from the Scene component
  const handleNodeSelect = (node: Node) => {
    setSelectedNode(node);
  };
  
  // Handle WebGL context loss
  const handleContextLost = () => {
    setContextLost(true);
    setError("WebGL context lost. Please refresh the page.");
  };
  
  // Add event listener for WebGL context loss
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
      };
    }
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error || contextLost) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-4">
        <h3 className="text-lg font-bold mb-2">Error</h3>
        <p className="text-sm mb-4">{error || "WebGL context lost"}</p>
        <button 
          className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full">
      <ErrorBoundary>
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 75 }} 
          gl={{ 
            powerPreference: "high-performance",
            antialias: true,
            alpha: false,
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
            logarithmicDepthBuffer: false,
            precision: "highp",
            premultipliedAlpha: true
          }}
          dpr={[1, 2]} // Limit pixel ratio to prevent performance issues
          performance={{ min: 0.5 }} // Allow performance scaling
        >
          <Scene 
            nodes={nodes} 
            edges={edges} 
            onNodeSelect={handleNodeSelect} 
          />
        </Canvas>
      </ErrorBoundary>
      
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