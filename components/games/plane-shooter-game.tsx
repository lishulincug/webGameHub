"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Stars, Text, Box, Sphere } from "@react-three/drei"
import { Physics, useBox, useSphere } from "@react-three/cannon"
import type * as THREE from "three"
import { Button } from "@/components/ui/button"

interface GameState {
  score: number
  lives: number
  isGameOver: boolean
  isGameStarted: boolean
  wave: number
  weaponLevel: number
}

// 玩家飞机组件
function PlayerPlane({ position, onFire }: { position: [number, number, number]; onFire: () => void }) {
  const meshRef = useRef<THREE.Group>(null)
  const [playerRef, api] = useBox(() => ({
    mass: 1,
    position,
    args: [2, 0.5, 3],
    type: "Kinematic",
  }))

  const keys = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
  })

  const currentPosition = useRef(position)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "a":
        case "arrowleft":
          keys.current.left = true
          break
        case "d":
        case "arrowright":
          keys.current.right = true
          break
        case "w":
        case "arrowup":
          keys.current.up = true
          break
        case "s":
        case "arrowdown":
          keys.current.down = true
          break
        case " ":
          keys.current.space = true
          e.preventDefault()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "a":
        case "arrowleft":
          keys.current.left = false
          break
        case "d":
        case "arrowright":
          keys.current.right = false
          break
        case "w":
        case "arrowup":
          keys.current.up = false
          break
        case "s":
        case "arrowdown":
          keys.current.down = false
          break
        case " ":
          keys.current.space = false
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useFrame(() => {
    if (!api) return

    const speed = 15
    let newX = currentPosition.current[0]
    let newZ = currentPosition.current[2]

    if (keys.current.left) newX -= speed * 0.016
    if (keys.current.right) newX += speed * 0.016
    if (keys.current.up) newZ -= speed * 0.016
    if (keys.current.down) newZ += speed * 0.016

    // 限制边界
    newX = Math.max(-25, Math.min(25, newX))
    newZ = Math.max(-10, Math.min(20, newZ))

    currentPosition.current = [newX, currentPosition.current[1], newZ]
    api.position.set(newX, currentPosition.current[1], newZ)

    // 射击
    if (keys.current.space && Math.random() > 0.85) {
      onFire()
    }

    // 飞机倾斜效果
    if (meshRef.current) {
      const targetRotationZ = keys.current.left ? 0.2 : keys.current.right ? -0.2 : 0
      const targetRotationX = keys.current.up ? -0.1 : keys.current.down ? 0.1 : 0

      meshRef.current.rotation.z += (targetRotationZ - meshRef.current.rotation.z) * 0.1
      meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.1
    }
  })

  return (
    <group ref={playerRef}>
      <group ref={meshRef}>
        {/* 飞机主体 */}
        <Box args={[2, 0.3, 3]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#0066ff" />
        </Box>
        {/* 机翼 */}
        <Box args={[4, 0.1, 0.8]} position={[0, 0, 0.5]}>
          <meshStandardMaterial color="#004499" />
        </Box>
        {/* 引擎光效 */}
        <Sphere args={[0.1]} position={[-0.8, -0.1, 1.2]}>
          <meshBasicMaterial color="#ffff00" />
        </Sphere>
        <Sphere args={[0.1]} position={[0.8, -0.1, 1.2]}>
          <meshBasicMaterial color="#ffff00" />
        </Sphere>
      </group>
    </group>
  )
}

// 敌机组件
function EnemyPlane({
  position,
  onDestroy,
  type = "basic",
}: {
  position: [number, number, number]
  onDestroy: () => void
  type?: "basic" | "heavy"
}) {
  const [enemyRef, api] = useBox(() => ({
    mass: 1,
    position,
    args: type === "heavy" ? [2, 0.5, 2.5] : [1.5, 0.3, 2],
    userData: { type: "enemy" },
    onCollide: (e) => {
      if (e.body.userData?.type === "bullet") {
        onDestroy()
      }
    },
  }))

  const meshRef = useRef<THREE.Group>(null)
  const currentPosition = useRef(position)

  useFrame((state) => {
    if (!api) return

    const time = state.clock.elapsedTime
    let newX = currentPosition.current[0]
    let newZ = currentPosition.current[2]

    switch (type) {
      case "heavy":
        newX = position[0] + Math.sin(time + position[0]) * 3
        newZ += 2 * 0.016
        break
      default:
        newZ += 4 * 0.016
    }

    currentPosition.current = [newX, currentPosition.current[1], newZ]
    api.position.set(newX, currentPosition.current[1], newZ)

    // 移出屏幕后销毁
    if (newZ > 30) {
      onDestroy()
    }

    // 旋转效果
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
    }
  })

  const color = type === "heavy" ? "#ff6600" : "#ff9900"
  const scale = type === "heavy" ? 1.2 : 1

  return (
    <group ref={enemyRef}>
      <group ref={meshRef} scale={[scale, scale, scale]}>
        <Box args={[1.5, 0.3, 2]} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} />
        </Box>
        <Box args={[2.5, 0.1, 0.6]} position={[0, 0, -0.3]}>
          <meshStandardMaterial color={color} />
        </Box>
      </group>
    </group>
  )
}

// 子弹组件
function Bullet({
  position,
  direction,
  onDestroy,
  isPlayer = true,
}: {
  position: [number, number, number]
  direction: [number, number, number]
  onDestroy: () => void
  isPlayer?: boolean
}) {
  const [bulletRef, api] = useSphere(() => ({
    mass: 0.1,
    position,
    args: [0.1],
    userData: { type: "bullet" },
    onCollide: (e) => {
      if ((isPlayer && e.body.userData?.type === "enemy") || (!isPlayer && e.body.userData?.type === "player")) {
        onDestroy()
      }
    },
  }))

  const currentPosition = useRef(position)

  useFrame(() => {
    if (!api) return

    const speed = 25
    const newX = currentPosition.current[0] + direction[0] * speed * 0.016
    const newY = currentPosition.current[1] + direction[1] * speed * 0.016
    const newZ = currentPosition.current[2] + direction[2] * speed * 0.016

    currentPosition.current = [newX, newY, newZ]
    api.position.set(newX, newY, newZ)

    // 移出屏幕后销毁
    if (Math.abs(newX) > 35 || Math.abs(newZ) > 35) {
      onDestroy()
    }
  })

  return (
    <group ref={bulletRef}>
      <Sphere args={[0.15]}>
        <meshBasicMaterial color={isPlayer ? "#00ffff" : "#ff0000"} />
      </Sphere>
    </group>
  )
}

// 3D场景组件
function GameScene({
  gameState,
  setGameState,
}: {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const [enemies, setEnemies] = useState<Array<{ id: number; position: [number, number, number]; type: string }>>([])
  const [bullets, setBullets] = useState<
    Array<{ id: number; position: [number, number, number]; direction: [number, number, number]; isPlayer: boolean }>
  >([])
  const [playerPosition] = useState<[number, number, number]>([0, 0, 10])

  const enemyIdRef = useRef(0)
  const bulletIdRef = useRef(0)
  const lastSpawnRef = useRef(0)

  // 生成敌机
  const spawnEnemy = () => {
    const types = ["basic", "heavy"]
    const type = types[Math.floor(Math.random() * types.length)]
    const newEnemy = {
      id: enemyIdRef.current++,
      position: [(Math.random() - 0.5) * 40, 0, -30] as [number, number, number],
      type,
    }
    setEnemies((prev) => [...prev, newEnemy])
  }

  // 玩家射击
  const handlePlayerFire = () => {
    const newBullet = {
      id: bulletIdRef.current++,
      position: [...playerPosition] as [number, number, number],
      direction: [0, 0, -1] as [number, number, number],
      isPlayer: true,
    }
    setBullets((prev) => [...prev, newBullet])
  }

  // 敌机被摧毁
  const handleEnemyDestroy = (enemyId: number) => {
    setEnemies((prev) => prev.filter((e) => e.id !== enemyId))
    setGameState((prev) => ({ ...prev, score: prev.score + 100 }))
  }

  // 子弹销毁
  const handleBulletDestroy = (bulletId: number) => {
    setBullets((prev) => prev.filter((b) => b.id !== bulletId))
  }

  useFrame((state) => {
    // 定期生成敌机
    if (state.clock.elapsedTime - lastSpawnRef.current > 2.5) {
      spawnEnemy()
      lastSpawnRef.current = state.clock.elapsedTime
    }
  })

  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />

      {/* 星空背景 */}
      <Stars radius={50} depth={30} count={2000} factor={2} />

      {/* 玩家飞机 */}
      <PlayerPlane position={playerPosition} onFire={handlePlayerFire} />

      {/* 敌机 */}
      {enemies.map((enemy) => (
        <EnemyPlane
          key={enemy.id}
          position={enemy.position}
          type={enemy.type as any}
          onDestroy={() => handleEnemyDestroy(enemy.id)}
        />
      ))}

      {/* 子弹 */}
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          position={bullet.position}
          direction={bullet.direction}
          isPlayer={bullet.isPlayer}
          onDestroy={() => handleBulletDestroy(bullet.id)}
        />
      ))}

      {/* 地面网格 */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100, 20, 20]} />
        <meshStandardMaterial color="#001122" wireframe transparent opacity={0.3} />
      </mesh>

      {/* UI文本 */}
      <Text position={[-20, 12, -8]} fontSize={2} color="white" anchorX="left" anchorY="top">
        {`分数: ${gameState.score}`}
      </Text>

      <Text position={[20, 12, -8]} fontSize={2} color="white" anchorX="right" anchorY="top">
        {`生命: ${gameState.lives}`}
      </Text>
    </>
  )
}

export function PlaneShooterGame() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    isGameOver: false,
    isGameStarted: false,
    wave: 1,
    weaponLevel: 1,
  })

  const startGame = () => {
    setGameState({
      score: 0,
      lives: 3,
      isGameOver: false,
      isGameStarted: true,
      wave: 1,
      weaponLevel: 1,
    })
  }

  const restartGame = () => {
    startGame()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-lg font-bold">波次: {gameState.wave}</div>
        <div className="text-lg font-bold">生命: {gameState.lives}</div>
      </div>

      <div className="relative w-full" style={{ height: "600px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">3D 飞机大战</h3>
            <p className="text-center mb-4">使用WASD或方向键移动飞机，空格键发射子弹！</p>
            <p className="text-center mb-4 text-sm text-muted-foreground">体验流畅的3D飞行战斗！</p>
            <Button onClick={startGame}>开始游戏</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-2">最终得分: {gameState.score}</p>
            <p className="text-lg mb-4">到达波次: {gameState.wave}</p>
            <Button onClick={restartGame}>再玩一次</Button>
          </div>
        )}

        {gameState.isGameStarted && !gameState.isGameOver && (
          <Canvas camera={{ position: [0, 10, 20], fov: 75 }} className="w-full h-full">
            <Physics gravity={[0, 0, 0]} broadphase="Naive">
              <GameScene gameState={gameState} setGameState={setGameState} />
            </Physics>
          </Canvas>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: WASD或方向键移动，空格键射击。体验流畅的3D空战！</p>
      </div>
    </div>
  )
}
