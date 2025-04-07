"use client";

import { useEffect, useRef, useState } from "react";
import { Node, Edge } from "../types/graph";

interface SideScrollingGameProps {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect: (node: Node) => void;
}

interface GameState {
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    velocityX: number;
    velocityY: number;
    isJumping: boolean;
    isGrounded: boolean;
    direction: number; // 1 for right, -1 for left
    frame: number; // For animation
    frameCount: number; // For animation
  };
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: string; // 'normal', 'moving', 'breakable'
    moveDirection?: number;
    moveDistance?: number;
    moveSpeed?: number;
    originalX?: number;
    health?: number;
  }>;
  items: Array<{
    node: Node;
    x: number;
    y: number;
    width: number;
    height: number;
    collected: boolean;
    type: string; // 'normal', 'powerup', 'key'
    frame: number; // For animation
    content?: string;
  }>;
  enemies: Array<{
    node: Node;
    x: number;
    y: number;
    width: number;
    height: number;
    direction: number;
    speed: number;
    type: string; // 'normal', 'flying', 'shooting'
    health: number;
    frame: number; // For animation
    lastShot: number; // For shooting enemies
    content?: string;
  }>;
  projectiles: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    velocityX: number;
    velocityY: number;
    isEnemy: boolean;
  }>;
  camera: {
    x: number;
    y: number;
  };
  backgrounds: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number; // Parallax speed
    color: string;
  }>;
  score: number;
  gameOver: boolean;
  level: number;
  powerups: {
    doubleJump: boolean;
    speedBoost: boolean;
    invincible: boolean;
    timeRemaining: number;
  };
  floatingTexts?: Array<{
    text: string;
    x: number;
    y: number;
    life: number;
    color: string;
  }>;
}

export function SideScrollingGame({ nodes, edges, onNodeSelect }: SideScrollingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 100,
      y: 300,
      width: 30,
      height: 50,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isGrounded: false,
      direction: 1,
      frame: 0,
      frameCount: 0,
    },
    platforms: [],
    items: [],
    enemies: [],
    projectiles: [],
    camera: {
      x: 0,
      y: 0,
    },
    backgrounds: [],
    score: 0,
    gameOver: false,
    level: 1,
    powerups: {
      doubleJump: false,
      speedBoost: false,
      invincible: false,
      timeRemaining: 0,
    },
  });
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [lastTime, setLastTime] = useState<number>(0);
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    velocityX: number;
    velocityY: number;
    life: number;
  }>>([]);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Create particles
  const createParticles = (x: number, y: number, count: number, color: string) => {
    const newParticles = Array.from({ length: count }).map(() => ({
      x,
      y,
      size: Math.random() * 3 + 1,
      color,
      velocityX: (Math.random() - 0.5) * 5,
      velocityY: (Math.random() - 0.5) * 5,
      life: Math.random() * 30 + 10,
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Initialize game
  const initializeGame = () => {
    console.log("Initializing game with nodes:", nodes);
    
    // Create backgrounds for parallax effect
    const newBackgrounds = [
      { x: 0, y: 0, width: 3000, height: 600, speed: 0.1, color: "#0a0a2a" }, // Far background
      { x: 0, y: 0, width: 3000, height: 600, speed: 0.3, color: "#1a1a4a" }, // Mid background
      { x: 0, y: 0, width: 3000, height: 600, speed: 0.5, color: "#2a2a6a" }, // Near background
    ];

    // Create platforms - generate more platforms based on nodes
    const newPlatforms: GameState['platforms'] = [];
    
    // Base platforms - ensure there's always a starting platform
    newPlatforms.push({ x: 0, y: 400, width: 800, height: 20, type: "normal" });
    newPlatforms.push({ x: 900, y: 350, width: 200, height: 20, type: "normal" });
    newPlatforms.push({ x: 1200, y: 300, width: 200, height: 20, type: "normal" });
    newPlatforms.push({ x: 1500, y: 250, width: 200, height: 20, type: "normal" });
    newPlatforms.push({ x: 1800, y: 200, width: 200, height: 20, type: "normal" });
    
    // Add platforms based on nodes
    if (nodes && nodes.length > 0) {
      console.log("Creating platforms from nodes:", nodes.length);
      
      // Create a platform for each node
      nodes.forEach((node, index) => {
        const x = 2000 + index * 300;
        const y = 300 + Math.sin(index * 0.5) * 50; // Vary height for visual interest
        
        // Add different types of platforms
        if (index % 5 === 0) {
          // Moving platform
          newPlatforms.push({ 
            x, 
            y, 
            width: 150, 
            height: 20, 
            type: "moving",
            moveDirection: 1,
            moveDistance: 100,
            moveSpeed: 1,
            originalX: x
          });
        } else if (index % 7 === 0) {
          // Breakable platform
          newPlatforms.push({ 
            x, 
            y, 
            width: 100, 
            height: 20, 
            type: "breakable",
            health: 2
          });
        } else {
          // Normal platform
          newPlatforms.push({ 
            x, 
            y, 
            width: 200, 
            height: 20, 
            type: "normal" 
          });
        }
      });
    } else {
      console.log("No nodes provided, creating default platforms");
      
      // If no nodes, add more default platforms to ensure there's terrain
      for (let i = 0; i < 10; i++) {
        const x = 2000 + i * 300;
        const y = 300 + Math.sin(i * 0.5) * 50;
        
        if (i % 3 === 0) {
          // Moving platform
          newPlatforms.push({ 
            x, 
            y, 
            width: 150, 
            height: 20, 
            type: "moving",
            moveDirection: 1,
            moveDistance: 100,
            moveSpeed: 1,
            originalX: x
          });
        } else if (i % 5 === 0) {
          // Breakable platform
          newPlatforms.push({ 
            x, 
            y, 
            width: 100, 
            height: 20, 
            type: "breakable",
            health: 2
          });
        } else {
          // Normal platform
          newPlatforms.push({ 
            x, 
            y, 
            width: 200, 
            height: 20, 
            type: "normal" 
          });
        }
      }
    }

    console.log("Created platforms:", newPlatforms.length);

    // Create items from nodes with different types
    const newItems = nodes && nodes.length > 0 
      ? nodes.map((node, index) => ({
          node,
          x: 1000 + index * 200, // Spread items out more
          y: Math.random() * 300 + 100, // Vary height
          width: 20,
          height: 20,
          collected: false,
          type: index % 5 === 0 ? "powerup" : index % 7 === 0 ? "key" : "normal",
          frame: 0,
          content: node.content || `Note ${index + 1}`,
        }))
      : [
          // Default items if no nodes
          {
            node: { id: "default-1", label: "Item 1" },
            x: 1000,
            y: 200,
            width: 20,
            height: 20,
            collected: false,
            type: "normal",
            frame: 0,
            content: "Welcome to the game!",
          },
          {
            node: { id: "default-2", label: "Powerup" },
            x: 1200,
            y: 150,
            width: 20,
            height: 20,
            collected: false,
            type: "powerup",
            frame: 0,
            content: "You found a powerup!",
          },
          {
            node: { id: "default-3", label: "Key" },
            x: 1400,
            y: 250,
            width: 20,
            height: 20,
            collected: false,
            type: "key",
            frame: 0,
            content: "This is a key item!",
          }
        ];

    console.log("Created items:", newItems.length);

    // Create enemies from nodes with different types
    const newEnemies: GameState['enemies'] = [];
    
    // Add some default enemies
    newEnemies.push({
      node: nodes && nodes.length > 0 ? nodes[0] : { id: "default", label: "Enemy" },
      x: 500,
      y: 350,
      width: 30,
      height: 30,
      direction: 1,
      speed: 1.5,
      type: "normal",
      health: 1,
      frame: 0,
      lastShot: 0,
      content: nodes && nodes.length > 0 ? nodes[0].content || "Enemy 1" : "Default enemy",
    });
    
    newEnemies.push({
      node: nodes && nodes.length > 1 ? nodes[1] : { id: "default", label: "Flying Enemy" },
      x: 800,
      y: 200,
      width: 30,
      height: 30,
      direction: 1,
      speed: 1,
      type: "flying",
      health: 2,
      frame: 0,
      lastShot: 0,
      content: nodes && nodes.length > 1 ? nodes[1].content || "Flying Enemy" : "Default flying enemy",
    });
    
    newEnemies.push({
      node: nodes && nodes.length > 2 ? nodes[2] : { id: "default", label: "Shooting Enemy" },
      x: 1200,
      y: 250,
      width: 30,
      height: 30,
      direction: 1,
      speed: 0.5,
      type: "shooting",
      health: 1,
      frame: 0,
      lastShot: 0,
      content: nodes && nodes.length > 2 ? nodes[2].content || "Shooting Enemy" : "Default shooting enemy",
    });
    
    // Add enemies based on nodes
    if (nodes && nodes.length > 3) {
      console.log("Creating enemies from nodes:", nodes.length - 3);
      
      nodes.slice(3).forEach((node, index) => {
        const x = 1500 + index * 300;
        const y = 300 + Math.sin(index * 0.7) * 50;
        
        // Add different types of enemies
        if (index % 3 === 0) {
          // Flying enemy
          newEnemies.push({
            node,
            x,
            y,
            width: 30,
            height: 30,
            direction: 1,
            speed: 1 + Math.random(),
            type: "flying",
            health: 2,
            frame: 0,
            lastShot: 0,
            content: node.content || `Flying Enemy ${index + 1}`,
          });
        } else if (index % 5 === 0) {
          // Shooting enemy
          newEnemies.push({
            node,
            x,
            y,
            width: 30,
            height: 30,
            direction: 1,
            speed: 0.5,
            type: "shooting",
            health: 1,
            frame: 0,
            lastShot: 0,
            content: node.content || `Shooting Enemy ${index + 1}`,
          });
        } else {
          // Normal enemy
          newEnemies.push({
            node,
            x,
            y,
            width: 30,
            height: 30,
            direction: 1,
            speed: 1 + Math.random() * 2,
            type: "normal",
            health: 1,
            frame: 0,
            lastShot: 0,
            content: node.content || `Enemy ${index + 1}`,
          });
        }
      });
    } else {
      console.log("No nodes or not enough nodes, creating default enemies");
      
      // If no nodes or not enough nodes, add more default enemies
      for (let i = 0; i < 5; i++) {
        const x = 1500 + i * 300;
        const y = 300 + Math.sin(i * 0.7) * 50;
        
        if (i % 3 === 0) {
          // Flying enemy
          newEnemies.push({
            node: { id: `default-flying-${i}`, label: "Flying Enemy" },
            x,
            y,
            width: 30,
            height: 30,
            direction: 1,
            speed: 1 + Math.random(),
            type: "flying",
            health: 2,
            frame: 0,
            lastShot: 0,
            content: `Default flying enemy ${i + 1}`,
          });
        } else if (i % 5 === 0) {
          // Shooting enemy
          newEnemies.push({
            node: { id: `default-shooting-${i}`, label: "Shooting Enemy" },
            x,
            y,
            width: 30,
            height: 30,
            direction: 1,
            speed: 0.5,
            type: "shooting",
            health: 1,
            frame: 0,
            lastShot: 0,
            content: `Default shooting enemy ${i + 1}`,
          });
        } else {
          // Normal enemy
          newEnemies.push({
            node: { id: `default-${i}`, label: "Enemy" },
            x,
            y,
            width: 30,
            height: 30,
            direction: 1,
            speed: 1 + Math.random() * 2,
            type: "normal",
            health: 1,
            frame: 0,
            lastShot: 0,
            content: `Default enemy ${i + 1}`,
          });
        }
      }
    }

    console.log("Created enemies:", newEnemies.length);

    // Update game state with the new platforms, items, and enemies
    setGameState((prev) => {
      const updatedState = {
        ...prev,
        platforms: newPlatforms,
        items: newItems,
        enemies: newEnemies,
        backgrounds: newBackgrounds,
      };
      console.log("Updated game state:", updatedState);
      return updatedState;
    });
  };

  // Initialize game on mount
  useEffect(() => {
    initializeGame();

    // Set up keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [nodes]);

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    if (!debugMode) {
      initializeGame();
    }
  };

  // Game loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Function to restart the game
    const restartGame = () => {
      // Create particles for death effect
      createParticles(gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2, 50, "#e94560");
      
      // Reset player position and state
      setGameState((prev) => ({
        ...prev,
        player: {
          x: 100,
          y: 300,
          width: 30,
          height: 50,
          velocityX: 0,
          velocityY: 0,
          isJumping: false,
          isGrounded: false,
          direction: 1,
          frame: 0,
          frameCount: 0,
        },
        camera: {
          x: 0,
          y: 0,
        },
        score: 0,
        gameOver: false,
        powerups: {
          doubleJump: false,
          speedBoost: false,
          invincible: false,
          timeRemaining: 0,
        },
      }));
      setParticles([]);
    };

    // Game loop function
    const update = (timestamp: number) => {
      if (gameState.gameOver) {
        // Automatically restart the game after a short delay
        setTimeout(() => {
          restartGame();
        }, 1000);
        return;
      }

      // Calculate delta time
      const deltaTime = timestamp - lastTime;
      setLastTime(timestamp);

      // Update powerup timers
      if (gameState.powerups.timeRemaining > 0) {
        setGameState(prev => ({
          ...prev,
          powerups: {
            ...prev.powerups,
            timeRemaining: prev.powerups.timeRemaining - deltaTime / 1000,
          }
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          powerups: {
            doubleJump: false,
            speedBoost: false,
            invincible: false,
            timeRemaining: 0,
          }
        }));
      }

      // Update player position based on keys
      const newPlayer = { ...gameState.player };

      // Horizontal movement
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        // Check for sprint (shift key)
        const isSprinting = keys["Shift"] || keys["shift"];
        newPlayer.velocityX = isSprinting ? -10 : (gameState.powerups.speedBoost ? -8 : -5);
        newPlayer.direction = -1;
      } else if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        // Check for sprint (shift key)
        const isSprinting = keys["Shift"] || keys["shift"];
        newPlayer.velocityX = isSprinting ? 10 : (gameState.powerups.speedBoost ? 8 : 5);
        newPlayer.direction = 1;
      } else {
        newPlayer.velocityX = 0;
      }

      // Jumping
      if ((keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "]) && !newPlayer.isJumping && newPlayer.isGrounded) {
        // Check for sprint jump (shift key)
        const isSprinting = keys["Shift"] || keys["shift"];
        newPlayer.velocityY = isSprinting ? -18 : -15;
        newPlayer.isJumping = true;
        newPlayer.isGrounded = false;
        createParticles(newPlayer.x + newPlayer.width / 2, newPlayer.y + newPlayer.height, 10, "#533483");
      } else if ((keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "]) && newPlayer.isJumping && !newPlayer.isGrounded) {
        // Double jump - allow a second jump while in the air
        newPlayer.velocityY = -12;
        newPlayer.isJumping = false; // Prevent triple jump
        createParticles(newPlayer.x + newPlayer.width / 2, newPlayer.y + newPlayer.height, 15, "#533483");
      }

      // Apply gravity
      newPlayer.velocityY += 0.8;
      newPlayer.y += newPlayer.velocityY;

      // Check if player fell into the void (below the screen)
      if (newPlayer.y > canvas.height + 100) {
        // Warp player back to the starter platform
        newPlayer.x = 100;
        newPlayer.y = 300;
        newPlayer.velocityX = 0;
        newPlayer.velocityY = 0;
        newPlayer.isJumping = false;
        newPlayer.isGrounded = true;
        
        // Create particles for the warp effect
        createParticles(newPlayer.x + newPlayer.width / 2, newPlayer.y + newPlayer.height, 30, "#533483");
        
        // Update camera to follow player
        setGameState(prev => ({
          ...prev,
          camera: {
            x: 0,
            y: 0,
          }
        }));
      }

      // Update player animation frame
      if (Math.abs(newPlayer.velocityX) > 0) {
        newPlayer.frameCount += deltaTime / 100;
        if (newPlayer.frameCount > 5) {
          newPlayer.frame = (newPlayer.frame + 1) % 4;
          newPlayer.frameCount = 0;
        }
      } else {
        newPlayer.frame = 0;
      }

      // Check platform collisions
      newPlayer.isGrounded = false;
      const newPlatforms = gameState.platforms.map(platform => {
        const newPlatform = { ...platform };
        
        // Move platforms that are moving
        if (platform.type === "moving" && platform.moveDirection !== undefined && 
            platform.moveDistance !== undefined && platform.moveSpeed !== undefined && 
            platform.originalX !== undefined) {
          newPlatform.x += platform.moveSpeed * platform.moveDirection;
          
          // Change direction if reached the limit
          if (Math.abs(newPlatform.x - platform.originalX) > platform.moveDistance) {
            newPlatform.moveDirection = -platform.moveDirection;
          }
        }
        
        // Check collision with player
        if (
          newPlayer.x + newPlayer.width > newPlatform.x &&
          newPlayer.x < newPlatform.x + newPlatform.width &&
          newPlayer.y + newPlayer.height > newPlatform.y &&
          newPlayer.y + newPlayer.height < newPlatform.y + newPlatform.height + 10 &&
          newPlayer.velocityY > 0
        ) {
          newPlayer.y = newPlatform.y - newPlayer.height;
          newPlayer.velocityY = 0;
          newPlayer.isGrounded = true;
          newPlayer.isJumping = false;
          
          // Break platform if it's breakable and player is falling fast
          if (newPlatform.type === "breakable" && newPlatform.health !== undefined && 
              newPlayer.velocityY > 10) {
            newPlatform.health--;
            if (newPlatform.health <= 0) {
              createParticles(newPlatform.x + newPlatform.width / 2, newPlatform.y, 20, "#e94560");
              return null; // Remove the platform
            }
          }
        }
        
        return newPlatform;
      }).filter(Boolean) as typeof gameState.platforms;

      // Update player position
      newPlayer.x += newPlayer.velocityX;

      // Check item collisions
      const newItems = gameState.items.map((item) => {
        if (
          !item.collected &&
          newPlayer.x + newPlayer.width > item.x &&
          newPlayer.x < item.x + item.width &&
          newPlayer.y + newPlayer.height > item.y &&
          newPlayer.y < item.y + item.height
        ) {
          onNodeSelect(item.node);
          
          // Apply powerup effects
          if (item.type === "powerup") {
            const powerupType = Math.floor(Math.random() * 3);
            setGameState(prev => ({
              ...prev,
              powerups: {
                doubleJump: powerupType === 0 ? true : prev.powerups.doubleJump,
                speedBoost: powerupType === 1 ? true : prev.powerups.speedBoost,
                invincible: powerupType === 2 ? true : prev.powerups.invincible,
                timeRemaining: 10, // 10 seconds
              }
            }));
            createParticles(item.x + item.width / 2, item.y + item.height / 2, 30, "#ffcc00");
          } else {
            createParticles(item.x + item.width / 2, item.y + item.height / 2, 15, "#0f3460");
          }
          
          // Show markdown content when collecting an item
          if (item.content) {
            // Create a floating text effect with the markdown content
            const floatingText = {
              text: item.content,
              x: item.x,
              y: item.y,
              life: 120, // 2 seconds at 60fps
              color: item.type === "powerup" ? "#ffcc00" : "#0f3460",
            };
            
            setGameState(prev => ({
              ...prev,
              floatingTexts: [...(prev.floatingTexts || []), floatingText],
            }));
          }
          
          return { ...item, collected: true };
        }
        
        // Animate items
        item.frame = (item.frame + deltaTime / 500) % 1;
        
        return item;
      });

      // Check enemy collisions and update enemies
      const newEnemies = gameState.enemies.map((enemy) => {
        // Move enemy
        const newEnemy = { ...enemy };
        
        if (newEnemy.type === "flying") {
          // Flying enemies move in a sine wave pattern
          newEnemy.y += Math.sin(timestamp / 500) * 0.5;
        } else {
          // Ground enemies move on platforms
          newEnemy.x += newEnemy.speed * newEnemy.direction;
          
          // Change direction if at platform edge
          for (const platform of newPlatforms) {
            if (
              newEnemy.x + newEnemy.width > platform.x + platform.width &&
              newEnemy.direction > 0
            ) {
              newEnemy.direction = -1;
            } else if (
              newEnemy.x < platform.x &&
              newEnemy.direction < 0
            ) {
              newEnemy.direction = 1;
            }
          }
        }
        
        // Shooting enemies fire projectiles
        if (newEnemy.type === "shooting" && timestamp - newEnemy.lastShot > 2000) {
          const projectile = {
            x: newEnemy.x + newEnemy.width / 2,
            y: newEnemy.y + newEnemy.height / 2,
            width: 10,
            height: 10,
            velocityX: newEnemy.direction * 5,
            velocityY: 0,
            isEnemy: true,
          };
          
          setGameState(prev => ({
            ...prev,
            projectiles: [...prev.projectiles, projectile],
          }));
          
          newEnemy.lastShot = timestamp;
        }
        
        // Animate enemies
        newEnemy.frame = (newEnemy.frame + deltaTime / 300) % 1;
        
        // Check collision with player
        if (
          newPlayer.x + newPlayer.width > newEnemy.x &&
          newPlayer.x < newEnemy.x + newEnemy.width &&
          newPlayer.y + newPlayer.height > newEnemy.y &&
          newPlayer.y < newEnemy.y + newEnemy.height
        ) {
          if (!gameState.powerups.invincible) {
            // Instead of setting game over, restart the game
            restartGame();
            return newEnemy;
          } else {
            // If invincible, damage the enemy instead
            newEnemy.health--;
            if (newEnemy.health <= 0) {
              createParticles(newEnemy.x + newEnemy.width / 2, newEnemy.y + newEnemy.height / 2, 20, "#e94560");
              return null; // Remove the enemy
            }
          }
        }
        
        return newEnemy;
      }).filter(Boolean) as typeof gameState.enemies;

      // Update projectiles
      const newProjectiles = gameState.projectiles.map(projectile => {
        const newProjectile = { ...projectile };
        newProjectile.x += newProjectile.velocityX;
        newProjectile.y += newProjectile.velocityY;
        
        // Check if projectile is out of bounds
        if (
          newProjectile.x < 0 ||
          newProjectile.x > 3000 ||
          newProjectile.y < 0 ||
          newProjectile.y > 600
        ) {
          return null;
        }
        
        // Check collision with player
        if (
          newProjectile.isEnemy &&
          newPlayer.x + newPlayer.width > newProjectile.x &&
          newPlayer.x < newProjectile.x + newProjectile.width &&
          newPlayer.y + newPlayer.height > newProjectile.y &&
          newPlayer.y < newProjectile.y + newProjectile.height
        ) {
          if (!gameState.powerups.invincible) {
            // Instead of setting game over, restart the game
            restartGame();
            return null;
          }
          createParticles(newProjectile.x, newProjectile.y, 10, "#e94560");
          return null;
        }
        
        return newProjectile;
      }).filter(Boolean) as typeof gameState.projectiles;

      // Update camera position
      const newCamera = {
        x: Math.max(0, newPlayer.x - canvas.width / 3),
        y: Math.max(0, newPlayer.y - canvas.height / 2),
      };

      // Update score
      const newScore = gameState.score + newItems.filter((item) => item.collected).length - gameState.items.filter((item) => item.collected).length;

      // Update particles
      const updatedParticles = particles.map(particle => {
        const newParticle = { ...particle };
        newParticle.x += newParticle.velocityX;
        newParticle.y += newParticle.velocityY;
        newParticle.life--;
        newParticle.size = Math.max(0, newParticle.size - 0.1);
        
        if (newParticle.life <= 0 || newParticle.size <= 0) {
          return null;
        }
        
        return newParticle;
      }).filter(Boolean) as typeof particles;
      
      setParticles(updatedParticles);

      // Update floating texts
      const newFloatingTexts = (gameState.floatingTexts || []).map(text => {
        const newText = { ...text };
        newText.y -= 0.5; // Float upward
        newText.life--;
        
        if (newText.life <= 0) {
          return null;
        }
        
        return newText;
      }).filter(Boolean) as typeof gameState.floatingTexts;

      // Update game state
      setGameState((prev) => ({
        ...prev,
        player: newPlayer,
        platforms: newPlatforms,
        items: newItems,
        enemies: newEnemies,
        projectiles: newProjectiles,
        camera: newCamera,
        score: newScore,
        floatingTexts: newFloatingTexts,
      }));

      // Draw everything
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw parallax backgrounds
      for (const bg of gameState.backgrounds) {
        ctx.fillStyle = bg.color;
        ctx.fillRect(
          (bg.x - newCamera.x * bg.speed) % canvas.width,
          bg.y - newCamera.y * bg.speed,
          bg.width,
          bg.height
        );
      }

      // Draw platforms
      for (const platform of newPlatforms) {
        if (platform.type === "normal") {
          ctx.fillStyle = "#16213e";
        } else if (platform.type === "moving") {
          ctx.fillStyle = "#0f3460";
        } else if (platform.type === "breakable") {
          ctx.fillStyle = platform.health === 2 ? "#e94560" : "#ff6b6b";
        }
        
        ctx.fillRect(
          platform.x - newCamera.x,
          platform.y - newCamera.y,
          platform.width,
          platform.height
        );
      }

      // Draw items
      for (const item of newItems) {
        if (!item.collected) {
          if (item.type === "normal") {
            ctx.fillStyle = "#0f3460";
          } else if (item.type === "powerup") {
            // Animate powerup
            const hue = (timestamp / 20) % 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          } else if (item.type === "key") {
            ctx.fillStyle = "#ffcc00";
          }
          
          // Draw with animation
          const size = item.type === "powerup" ? 20 + Math.sin(item.frame * Math.PI * 2) * 5 : 20;
          ctx.fillRect(
            item.x - newCamera.x + (20 - size) / 2,
            item.y - newCamera.y + (20 - size) / 2,
            size,
            size
          );
        }
      }

      // Draw enemies
      for (const enemy of newEnemies) {
        if (enemy.type === "normal") {
          ctx.fillStyle = "#e94560";
        } else if (enemy.type === "flying") {
          ctx.fillStyle = "#ff6b6b";
        } else if (enemy.type === "shooting") {
          ctx.fillStyle = "#ff4757";
        }
        
        // Draw with animation
        const size = 30 + Math.sin(enemy.frame * Math.PI * 2) * 3;
        ctx.fillRect(
          enemy.x - newCamera.x + (30 - size) / 2,
          enemy.y - newCamera.y + (30 - size) / 2,
          size,
          size
        );
      }

      // Draw projectiles
      for (const projectile of newProjectiles) {
        ctx.fillStyle = projectile.isEnemy ? "#ff4757" : "#533483";
        ctx.beginPath();
        ctx.arc(
          projectile.x - newCamera.x,
          projectile.y - newCamera.y,
          projectile.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw player
      ctx.fillStyle = gameState.powerups.invincible ? 
        `hsl(${(timestamp / 20) % 360}, 100%, 50%)` : "#533483";
      
      // Draw player with animation
      const playerSize = 30 + Math.sin(newPlayer.frame * Math.PI / 2) * 5;
      ctx.fillRect(
        newPlayer.x - newCamera.x + (newPlayer.width - playerSize) / 2,
        newPlayer.y - newCamera.y + (newPlayer.height - playerSize) / 2,
        playerSize,
        playerSize
      );

      // Draw particles
      for (const particle of updatedParticles) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 40;
        ctx.beginPath();
        ctx.arc(
          particle.x - newCamera.x,
          particle.y - newCamera.y,
          particle.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw floating texts
      for (const text of newFloatingTexts || []) {
        ctx.fillStyle = text.color;
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(text.text, text.x - newCamera.x, text.y - newCamera.y);
      }

      // Draw score
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${newScore}`, 20, 30);
      ctx.fillText(`Level: ${gameState.level}`, 20, 60);
      
      // Draw sprint indicator
      const isSprinting = keys["Shift"] || keys["shift"];
      if (isSprinting) {
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(20, 130, 20, 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.fillText("S", 25, 145);
      }
      
      // Draw powerup indicators
      if (gameState.powerups.timeRemaining > 0) {
        ctx.fillText(`Powerups: ${Math.ceil(gameState.powerups.timeRemaining)}s`, 20, 90);
        
        if (gameState.powerups.doubleJump) {
          ctx.fillStyle = "#533483";
          ctx.fillRect(20, 100, 20, 20);
          ctx.fillStyle = "#ffffff";
          ctx.font = "14px Arial";
          ctx.fillText("2x", 25, 115);
        }
        
        if (gameState.powerups.speedBoost) {
          ctx.fillStyle = "#0f3460";
          ctx.fillRect(50, 100, 20, 20);
          ctx.fillStyle = "#ffffff";
          ctx.font = "14px Arial";
          ctx.fillText("S", 55, 115);
        }
        
        if (gameState.powerups.invincible) {
          ctx.fillStyle = `hsl(${(timestamp / 20) % 360}, 100%, 50%)`;
          ctx.fillRect(80, 100, 20, 20);
          ctx.fillStyle = "#ffffff";
          ctx.font = "14px Arial";
          ctx.fillText("I", 85, 115);
        }
      } else {
        // Show double jump indicator even when not powered up
        ctx.fillStyle = "#533483";
        ctx.fillRect(20, 100, 20, 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.fillText("2x", 25, 115);
      }

      // Draw game over screen
      if (gameState.gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = "24px Arial";
        ctx.fillText(`Final Score: ${newScore}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText("Restarting...", canvas.width / 2, canvas.height / 2 + 50);
      }

      // Request next frame
      gameLoopRef.current = requestAnimationFrame(update);
    };

    // Start game loop
    gameLoopRef.current = requestAnimationFrame(update);

    // Handle restart (keep for manual restart option)
    const handleRestart = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        restartGame();
      }
    };

    window.addEventListener("keydown", handleRestart);

    return () => {
      window.removeEventListener("keydown", handleRestart);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, keys, onNodeSelect, particles]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute top-4 left-4 text-white text-sm">
        <p>Controls: Arrow keys or WASD to move, Space to jump</p>
        <p>Press Space again in mid-air for double jump!</p>
        <p>Hold Shift+Arrow to sprint and jump higher!</p>
        <p>Collect items to increase your score</p>
        <p>Avoid enemies!</p>
        <p>Press R to restart when game over</p>
      </div>
      <button 
        className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={toggleDebugMode}
      >
        {debugMode ? "Hide Debug" : "Debug Mode"}
      </button>
      {debugMode && (
        <div className="absolute top-16 right-4 bg-black bg-opacity-70 text-white p-4 rounded">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <p>Platforms: {gameState.platforms.length}</p>
          <p>Items: {gameState.items.length}</p>
          <p>Enemies: {gameState.enemies.length}</p>
          <p>Player Position: ({Math.round(gameState.player.x)}, {Math.round(gameState.player.y)})</p>
          <p>Player Velocity: ({Math.round(gameState.player.velocityX)}, {Math.round(gameState.player.velocityY)})</p>
          <p>Player Grounded: {gameState.player.isGrounded ? "Yes" : "No"}</p>
          <button 
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
            onClick={initializeGame}
          >
            Reinitialize Game
          </button>
        </div>
      )}
    </div>
  );
} 