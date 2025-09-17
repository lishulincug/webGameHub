"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Text, Box, Cylinder } from "@react-three/drei"
import { Physics, useBox } from "@react-three/cannon"
import type * as THREE from "three"
import { Button } from "@/components/ui/button"

interface GameState {
  score: number
  lap: number
  time: number
  bestLap: number
  isGameOver: boolean
  isGameStarted: boolean
  speed: number
  position: number
}

// 赛车组件
function RaceCar({
  position,
  onPositionUpdate,
}: {
  position: [number, number, number]
  onPositionUpdate: (pos: [number, number, number], speed: number) => void
}) {
  const [carRef, api] = useBox(() => ({
    mass: 100,
    position,
    args: [3, 0.8, 6],
    material: { friction: 0.4 },
  }))

  const meshRef = useRef<THREE.Group>(null)
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  })

  const currentPosition = useRef(position)
  const currentRotation = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          keys.current.forward = true
          break
        case "s":
        case "arrowdown":
          keys.current.backward = true
          break
        case "a":
        case "arrowleft":
          keys.current.left = true
          break
        case "d":
        case "arrowright":
          keys.current.right = true
          break
        case " ":
          keys.current.brake = true
          e.preventDefault()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          keys.current.forward = false
          break
        case "s":
        case "arrowdown":
          keys.current.backward = false
          break
        case "a":
        case "arrowleft":
          keys.current.left = false
          break
        case "d":
        case "arrowright":
          keys.current.right = false
          break
        case " ":
          keys.current.brake = false
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

    const acceleration = 20
    const maxSpeed = 25
    const turnSpeed = 2
    const friction = 0.95

    let speed = 0
    let turnAmount = 0

    if (keys.current.forward) speed = acceleration
    if (keys.current.backward) speed = -acceleration * 0.5
    if (keys.current.left) turnAmount = turnSpeed
    if (keys.current.right) turnAmount = -turnSpeed
    if (keys.current.brake) speed *= 0.3

    // 更新旋转
    if (Math.abs(speed) > 0.1) {
      currentRotation.current += turnAmount * 0.016
    }

    // 计算移动方向
    const moveX = Math.sin(currentRotation.current) * speed * 0.016
    const moveZ = Math.cos(currentRotation.current) * speed * 0.016

    // 更新位置
    currentPosition.current[0] += moveX
    currentPosition.current[2] += moveZ

    // 应用摩擦力
    const currentSpeed = Math.sqrt(moveX * moveX + moveZ * moveZ) / 0.016

    api.position.set(currentPosition.current[0], currentPosition.current[1], currentPosition.current[2])
    api.rotation.set(0, currentRotation.current, 0)

    onPositionUpdate(currentPosition.current, currentSpeed * 3.6)

    // 车辆倾斜效果
    if (meshRef.current) {
      const targetTilt = turnAmount * 0.1
      meshRef.current.rotation.z += (targetTilt - meshRef.current.rotation.z) * 0.1
    }
  })

  return (
    <group ref={carRef}>
      <group ref={meshRef}>
        {/* 车身 */}
        <Box args={[3, 0.8, 6]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ff0000" />
        </Box>
        {/* 车窗 */}
        <Box args={[2.5, 0.6, 2.5]} position={[0, 0.4, 0]}>
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
        </Box>
        {/* 车轮 */}
        <Cylinder args={[0.4, 0.4, 0.3]} position={[-1.2, -0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Cylinder args={[0.4, 0.4, 0.3]} position={[1.2, -0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Cylinder args={[0.4, 0.4, 0.3]} position={[-1.2, -0.4, 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Cylinder args={[0.4, 0.4, 0.3]} position={[1.2, -0.4, 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
      </group>
    </group>
  )
}

// 赛道组件
function RaceTrack() {
  const trackPoints = []
  const numPoints = 16
  const radius = 35

  // 生成椭圆形赛道
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius * 0.7
    trackPoints.push([x, 0, z])
  }

  return (
    <group>
      {/* 赛道路面 */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[25, 45, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* 内侧护栏 */}
      {trackPoints.map((point, index) => {
        const innerRadius = 20
        const angle = (index / numPoints) * Math.PI * 2
        const x = Math.cos(angle) * innerRadius
        const z = Math.sin(angle) * innerRadius * 0.7

        return (
          <Box key={`inner-${index}`} args={[1.5, 2, 0.5]} position={[x, 1, z]}>
            <meshStandardMaterial color="#ff4444" />
          </Box>
        )
      })}

      {/* 外侧护栏 */}
      {trackPoints.map((point, index) => {
        const outerRadius = 50
        const angle = (index / numPoints) * Math.PI * 2
        const x = Math.cos(angle) * outerRadius
        const z = Math.sin(angle) * outerRadius * 0.7

        return (
          <Box key={`outer-${index}`} args={[1.5, 2, 0.5]} position={[x, 1, z]}>
            <meshStandardMaterial color="#ff4444" />
          </Box>
        )
      })}

      {/* 起跑线 */}
      <mesh position={[35, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

// AI 赛车组件
function AICar({
  position,
  color = "#0066ff",
  trackRadius = 35,
}: {
  position: [number, number, number]
  color?: string
  trackRadius?: number
}) {
  const [carRef, api] = useBox(() => ({
    mass: 80,
    position,
    args: [2.5, 0.6, 5],
  }))

  const currentAngle = useRef(position[0] * 0.01)

  useFrame((state) => {
    if (!api) return

    const speed = 0.3
    currentAngle.current += speed * 0.016

    const x = Math.cos(currentAngle.current) * trackRadius
    const z = Math.sin(currentAngle.current) * trackRadius * 0.7

    api.position.set(x, position[1], z)
    api.rotation.set(0, currentAngle.current + Math.PI / 2, 0)
  })

  return (
    <group ref={carRef}>
      <Box args={[2.5, 0.6, 5]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} />
      </Box>
      <Box args={[2, 0.4, 2]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} />
      </Box>
    </group>
  )
}

// 3D 赛车场景
function RacingScene({
  gameState,
  setGameState,
}: {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const [carPosition, setCarPosition] = useState<[number, number, number]>([35, 1, 0])
  const [carSpeed, setCarSpeed] = useState(0)
  const { camera } = useThree()

  const handlePositionUpdate = (pos: [number, number, number], speed: number) => {
    setCarPosition(pos)
    setCarSpeed(speed)
    setGameState((prev) => ({ ...prev, speed }))

    // 更新相机跟随
    camera.position.set(pos[0] - 12, pos[1] + 8, pos[2] - 12)
    camera.lookAt(pos[0], pos[1], pos[2])
  }

  useFrame((state) => {
    setGameState((prev) => ({ ...prev, time: prev.time + 0.016 }))
  })

  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 20, 20]} intensity={0.8} />

      {/* 地面 */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* 赛道 */}
      <RaceTrack />

      {/* 玩家赛车 */}
      <RaceCar position={[35, 1, 0]} onPositionUpdate={handlePositionUpdate} />

      {/* AI 赛车 */}
      <AICar position={[30, 1, 5]} color="#0066ff" />
      <AICar position={[40, 1, -5]} color="#00ff66" />

      {/* UI 文本 */}
      <Text
        position={[carPosition[0] - 15, carPosition[1] + 12, carPosition[2] - 8]}
        fontSize={2}
        color="white"
        anchorX="left"
        anchorY="top"
      >
        {`速度: ${Math.round(carSpeed)} km/h`}
      </Text>

      <Text
        position={[carPosition[0] + 15, carPosition[1] + 12, carPosition[2] - 8]}
        fontSize={2}
        color="white"
        anchorX="right"
        anchorY="top"
      >
        {`时间: ${gameState.time.toFixed(1)}s`}
      </Text>
    </>
  )
}

export function RacingGame() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lap: 0,
    time: 0,
    bestLap: Number.POSITIVE_INFINITY,
    isGameOver: false,
    isGameStarted: false,
    speed: 0,
    position: 0,
  })

  const startGame = () => {
    setGameState({
      score: 0,
      lap: 0,
      time: 0,
      bestLap: Number.POSITIVE_INFINITY,
      isGameOver: false,
      isGameStarted: true,
      speed: 0,
      position: 0,
    })
  }

  const restartGame = () => {
    startGame()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">圈数: {gameState.lap}</div>
        <div className="text-lg font-bold">速度: {Math.round(gameState.speed)} km/h</div>
        <div className="text-lg font-bold">时间: {gameState.time.toFixed(1)}s</div>
      </div>

      <div className="relative w-full" style={{ height: "600px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">3D 赛车竞速</h3>
            <p className="text-center mb-4">使用WASD或方向键控制赛车，空格键刹车！</p>
            <p className="text-center mb-4 text-sm text-muted-foreground">体验流畅的3D赛车驾驶！</p>
            <Button onClick={startGame}>开始比赛</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">比赛结束</h3>
            <p className="text-lg mb-2">完成圈数: {gameState.lap}</p>
            <p className="text-lg mb-4">总时间: {gameState.time.toFixed(1)}秒</p>
            <Button onClick={restartGame}>再来一局</Button>
          </div>
        )}

        {gameState.isGameStarted && !gameState.isGameOver && (
          <Canvas camera={{ position: [23, 12, 23], fov: 75 }} className="w-full h-full">
            <Physics gravity={[0, -9.8, 0]} broadphase="Naive">
              <RacingScene gameState={gameState} setGameState={setGameState} />
            </Physics>
          </Canvas>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: WASD或方向键控制赛车，空格键刹车。体验流畅的3D赛车驾驶！</p>
      </div>
    </div>
  )
}
