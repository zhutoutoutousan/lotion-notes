"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Stars, Text, PerspectiveCamera, Environment, useEnvironment, PointerLockControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

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
  particleEffects?: boolean;
}

// Performance settings
const MAX_NODES_PER_SECTION = 20; // Maximum nodes to render at once
const NODE_LOAD_DISTANCE = 30; // Distance to load nodes around player
const NODE_UNLOAD_DISTANCE = 40; // Distance to unload nodes from player
const CHUNK_SIZE = 16; // Size of each terrain chunk
const RENDER_DISTANCE = 3; // Number of chunks to render in each direction
const GRAVITY = 0.01; // Gravity strength
const JUMP_FORCE = 0.15; // Jump force
const MOVEMENT_SPEED = 0.15; // Movement speed
const COLLISION_RADIUS = 0.5; // Player collision radius

// Create a custom hook for terrain height calculation with cached noise generator
function useTerrainHeight() {
  // Create a cached noise generator
  const noiseGenerator = useMemo(() => new SimplexNoise(), []);
  
  // Return a function that uses the cached generator
  return useCallback((x: number, z: number): number => {
    // Generate height using multiple noise octaves
    const height = Math.floor(
      noiseGenerator.noise(x * 0.01, z * 0.01) * 5 +
      noiseGenerator.noise(x * 0.05, z * 0.05) * 2 +
      noiseGenerator.noise(x * 0.1, z * 0.1)
    );
    
    return Math.max(0, height);
  }, [noiseGenerator]);
}

// FPS Controls component with physics and collision
function FPSControls() {
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const isGrounded = useRef(false);
  const playerHeight = 1.7;
  const jumpCooldown = useRef(0);
  const getTerrainHeight = useTerrainHeight();
  const lastPosition = useRef(new THREE.Vector3(0, 0, 0));
  const collisionRadius = useRef(0.5); // Player collision radius
  
  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support both WASD and arrow keys
      if (e.key.toLowerCase() === 'arrowup' || e.key.toLowerCase() === 'w') {
        keys.current['w'] = true;
      } else if (e.key.toLowerCase() === 'arrowdown' || e.key.toLowerCase() === 's') {
        keys.current['s'] = true;
      } else if (e.key.toLowerCase() === 'arrowleft' || e.key.toLowerCase() === 'a') {
        keys.current['a'] = true;
      } else if (e.key.toLowerCase() === 'arrowright' || e.key.toLowerCase() === 'd') {
        keys.current['d'] = true;
      } else if (e.key.toLowerCase() === ' ') {
        keys.current[' '] = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Support both WASD and arrow keys
      if (e.key.toLowerCase() === 'arrowup' || e.key.toLowerCase() === 'w') {
        keys.current['w'] = false;
      } else if (e.key.toLowerCase() === 'arrowdown' || e.key.toLowerCase() === 's') {
        keys.current['s'] = false;
      } else if (e.key.toLowerCase() === 'arrowleft' || e.key.toLowerCase() === 'a') {
        keys.current['a'] = false;
      } else if (e.key.toLowerCase() === 'arrowright' || e.key.toLowerCase() === 'd') {
        keys.current['d'] = false;
      } else if (e.key.toLowerCase() === ' ') {
        keys.current[' '] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Handle movement and physics in the animation frame
  useFrame((state, delta) => {
    // Store last position for collision detection
    lastPosition.current.copy(camera.position);
    
    // Apply gravity
    if (!isGrounded.current) {
      velocity.current.y -= GRAVITY;
    }
    
    // Handle jumping
    if (keys.current[' '] && isGrounded.current && jumpCooldown.current <= 0) {
      velocity.current.y = JUMP_FORCE;
      isGrounded.current = false;
      jumpCooldown.current = 10; // Cooldown frames
    }
    
    // Decrease jump cooldown
    if (jumpCooldown.current > 0) {
      jumpCooldown.current--;
    }
    
    // Calculate movement direction
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    // Forward/backward movement
    if (keys.current['w']) {
      moveDirection.z -= 1;
    }
    if (keys.current['s']) {
      moveDirection.z += 1;
    }
    
    // Left/right movement
    if (keys.current['a']) {
      moveDirection.x -= 1;
    }
    if (keys.current['d']) {
      moveDirection.x += 1;
    }
    
    // Normalize movement direction
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      
      // Apply movement speed
      moveDirection.multiplyScalar(MOVEMENT_SPEED);
      
      // Rotate movement direction based on camera rotation
      moveDirection.applyQuaternion(camera.quaternion);
      
      // Update velocity
      velocity.current.x = moveDirection.x;
      velocity.current.z = moveDirection.z;
    } else {
      // Apply friction when not moving
      velocity.current.x *= 0.9;
      velocity.current.z *= 0.9;
    }
    
    // Update position
    const newPosition = camera.position.clone().add(velocity.current);
    
    // Check for collisions with terrain
    const terrainHeight = getTerrainHeight(newPosition.x, newPosition.z);
    
    // Ground collision
    if (newPosition.y - playerHeight < terrainHeight) {
      newPosition.y = terrainHeight + playerHeight;
      velocity.current.y = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }
    
    // Check for collisions with terrain walls
    // Sample points around the player to detect wall collisions
    const samplePoints = [
      new THREE.Vector2(newPosition.x + collisionRadius.current, newPosition.z),
      new THREE.Vector2(newPosition.x - collisionRadius.current, newPosition.z),
      new THREE.Vector2(newPosition.x, newPosition.z + collisionRadius.current),
      new THREE.Vector2(newPosition.x, newPosition.z - collisionRadius.current),
      new THREE.Vector2(newPosition.x + collisionRadius.current * 0.707, newPosition.z + collisionRadius.current * 0.707),
      new THREE.Vector2(newPosition.x - collisionRadius.current * 0.707, newPosition.z + collisionRadius.current * 0.707),
      new THREE.Vector2(newPosition.x + collisionRadius.current * 0.707, newPosition.z - collisionRadius.current * 0.707),
      new THREE.Vector2(newPosition.x - collisionRadius.current * 0.707, newPosition.z - collisionRadius.current * 0.707),
    ];
    
    // Check each sample point for terrain height
    let maxHeight = -Infinity;
    for (const point of samplePoints) {
      const height = getTerrainHeight(point.x, point.y);
      maxHeight = Math.max(maxHeight, height);
    }
    
    // If the player is below the terrain, push them up
    if (newPosition.y - playerHeight < maxHeight) {
      newPosition.y = maxHeight + playerHeight;
      velocity.current.y = 0;
      isGrounded.current = true;
    }
    
    // Check for collisions with terrain walls (horizontal movement)
    const currentHeight = getTerrainHeight(camera.position.x, camera.position.z);
    const newHeight = getTerrainHeight(newPosition.x, newPosition.z);
    
    // If moving up a steep slope, prevent movement
    if (newHeight - currentHeight > 1.0 && !isGrounded.current) {
      newPosition.x = camera.position.x;
      newPosition.z = camera.position.z;
      velocity.current.x = 0;
      velocity.current.z = 0;
    }
    
    // Update camera position
    camera.position.copy(newPosition);
  });
  
  return (
    <PointerLockControls 
      makeDefault
      selector=".fps-controls-button"
    />
  );
}

// Knowledge item component for rendering knowledge nodes as items
function KnowledgeItem({ node, position, onClick }: { node: Node; position: [number, number, number]; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Rotate the item slightly for a more natural look
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const getItemColor = (type?: string) => {
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

  // Determine the item type based on node type
  const getItemType = (type?: string) => {
    switch (type) {
      case "heading":
        return "scroll";
      case "list":
        return "book";
      case "paragraph":
        return "tome";
      default:
        return "scroll";
    }
  };

  const itemType = getItemType(node.type);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        {itemType === "scroll" && (
          <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
        )}
        {itemType === "book" && (
          <boxGeometry args={[0.2, 0.3, 0.1]} />
        )}
        {itemType === "tome" && (
          <boxGeometry args={[0.25, 0.35, 0.15]} />
        )}
        <meshPhongMaterial 
          color={getItemColor(node.type)} 
          emissive={getItemColor(node.type)}
          emissiveIntensity={0.2}
        />
      </mesh>
      <Text
        position={[0, itemType === "scroll" ? 0.2 : 0.25, 0.06]}
        fontSize={0.05}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.25}
        rotation={[0, 0, 0]}
      >
        {node.label}
      </Text>
    </group>
  );
}

// Minecraft-style block component
function Block({ position, color = "#8B4513" }: { position: [number, number, number]; color?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Tree component
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 2, 0.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Tree leaves */}
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[1.5, 2, 4]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <coneGeometry args={[1.2, 1.5, 4]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    </group>
  );
}

// Chunk component for terrain generation
function Chunk({ 
  position, 
  noiseGenerator, 
  nodes, 
  onNodeSelect 
}: { 
  position: [number, number, number]; 
  noiseGenerator: SimplexNoise; 
  nodes: Node[];
  onNodeSelect?: (node: Node) => void;
}) {
  // Use useMemo to generate terrain only once per chunk
  const { blocks, trees, knowledgeItems } = useMemo(() => {
    const newBlocks: Array<{position: [number, number, number], type: string}> = [];
    const newTrees: Array<[number, number, number]> = [];
    const newKnowledgeItems: Array<{node: Node, position: [number, number, number]}> = [];
    
    // Generate terrain using noise
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = position[0] * CHUNK_SIZE + x;
        const worldZ = position[2] * CHUNK_SIZE + z;
        
        // Generate height using multiple noise octaves
        const height = Math.floor(
          noiseGenerator.noise(worldX * 0.01, worldZ * 0.01) * 5 +
          noiseGenerator.noise(worldX * 0.05, worldZ * 0.05) * 2 +
          noiseGenerator.noise(worldX * 0.1, worldZ * 0.1)
        );
        
        // Add blocks for terrain
        for (let y = 0; y <= height; y++) {
          // Determine block type based on height
          let blockType = "dirt";
          if (y === height) {
            blockType = "grass";
          } else if (y < height - 3) {
            blockType = "stone";
          }
          
          newBlocks.push({
            position: [x, y, z],
            type: blockType
          });
        }
        
        // Randomly place trees
        if (height > 0 && Math.random() < 0.02) {
          newTrees.push([x, height + 1, z]);
        }
        
        // Randomly place knowledge items
        if (height > 0 && Math.random() < 0.01 && nodes.length > 0) {
          const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
          newKnowledgeItems.push({
            node: randomNode,
            position: [x, height + 1, z]
          });
        }
      }
    }
    
    return { blocks: newBlocks, trees: newTrees, knowledgeItems: newKnowledgeItems };
  }, [position, noiseGenerator, nodes]);
  
  return (
    <group position={[position[0] * CHUNK_SIZE, 0, position[2] * CHUNK_SIZE]}>
      {/* Render blocks */}
      {blocks.map((block, index) => (
        <Block 
          key={`block-${index}`} 
          position={block.position} 
          color={
            block.type === "grass" ? "#7CFC00" : 
            block.type === "dirt" ? "#8B4513" : 
            block.type === "stone" ? "#808080" : "#8B4513"
          } 
        />
      ))}
      
      {/* Render trees */}
      {trees.map((treePos, index) => (
        <Tree key={`tree-${index}`} position={treePos} />
      ))}
      
      {/* Render knowledge items */}
      {knowledgeItems.map(({ node, position }, index) => (
        <KnowledgeItem 
          key={`item-${index}`} 
          node={node} 
          position={position} 
          onClick={() => onNodeSelect && onNodeSelect(node)} 
        />
      ))}
    </group>
  );
}

// Main scene component
function Scene({ nodes, edges, onNodeSelect }: { nodes: Node[]; edges: Edge[]; onNodeSelect?: (node: Node) => void }) {
  const { camera } = useThree();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(0, 20, 0));
  const [visibleChunks, setVisibleChunks] = useState<Array<[number, number, number]>>([]);
  const noiseGenerator = useMemo(() => new SimplexNoise(), []);
  
  // Create a cache for generated chunks
  const chunkCache = useRef<Map<string, React.ReactNode>>(new Map());
  
  // Update camera position for chunk loading
  useFrame(() => {
    setCameraPosition(camera.position.clone());
    
    // Calculate which chunks should be visible based on camera position
    const chunkX = Math.floor(camera.position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(camera.position.z / CHUNK_SIZE);
    
    const newVisibleChunks: Array<[number, number, number]> = [];
    
    // Generate chunks within render distance
    for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
      for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
        newVisibleChunks.push([chunkX + x, 0, chunkZ + z]);
      }
    }
    
    setVisibleChunks(newVisibleChunks);
  });
  
  // Handle node selection
  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };
  
  // Generate chunk components only once and cache them
  const getChunkComponent = (chunkPos: [number, number, number]) => {
    const key = `${chunkPos[0]},${chunkPos[1]},${chunkPos[2]}`;
    
    // Check if chunk is already in cache
    if (chunkCache.current.has(key)) {
      return chunkCache.current.get(key);
    }
    
    // Create new chunk component
    const chunkComponent = (
      <Chunk 
        key={`chunk-${key}`} 
        position={chunkPos} 
        noiseGenerator={noiseGenerator}
        nodes={nodes}
        onNodeSelect={handleNodeClick}
      />
    );
    
    // Add to cache
    chunkCache.current.set(key, chunkComponent);
    
    return chunkComponent;
  };
  
  return (
    <>
      <Sky sunPosition={[100, 10, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Render visible chunks using cached components */}
      {visibleChunks.map((chunkPos) => getChunkComponent(chunkPos))}
      
      <FPSControls />
      
      <PerspectiveCamera makeDefault position={[0, 20, 0]} />
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

// Main component
export function World3D({ nodes, edges, onNodeSelect, particleEffects = true }: World3DProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    setContextLost(true);
    setError("WebGL context lost. Please refresh the page.");
  };
  
  // Handle WebGL context restored
  const handleContextRestored = () => {
    setContextLost(false);
    setError(null);
  };
  
  // Add event listeners for WebGL context loss/restore
  useEffect(() => {
    const canvas = canvasRef.current || document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
      
      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }
  }, []);
  
  // Toggle performance mode
  const togglePerformanceMode = () => {
    setPerformanceMode(!performanceMode);
  };

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
    <div className="w-full h-full relative">
      <ErrorBoundary>
        <Canvas 
          ref={canvasRef}
          camera={{ position: [0, 20, 0], fov: 75 }} 
          gl={{ 
            powerPreference: "high-performance",
            antialias: !performanceMode,
            alpha: false,
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
            logarithmicDepthBuffer: false,
            precision: performanceMode ? "mediump" : "highp",
            premultipliedAlpha: true
          }}
          dpr={performanceMode ? 1 : [1, 2]} // Limit pixel ratio in performance mode
          performance={{ min: performanceMode ? 0.3 : 0.5 }} // Allow more aggressive performance scaling
        >
          <Scene 
            nodes={nodes} 
            edges={edges} 
            onNodeSelect={handleNodeSelect} 
          />
        </Canvas>
      </ErrorBoundary>
      
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <button 
            className="fps-controls-button px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors text-lg font-bold"
            onClick={() => setIsLocked(true)}
          >
            Click to Enter FPS Mode
          </button>
        </div>
      )}
      
      {isLocked && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded text-white text-sm">
          <p>WASD: Move | Mouse: Look | SPACE: Jump | ESC: Exit</p>
        </div>
      )}
      
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button 
          className="px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors text-sm"
          onClick={togglePerformanceMode}
        >
          {performanceMode ? "High Quality" : "Performance Mode"}
        </button>
      </div>
      
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
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