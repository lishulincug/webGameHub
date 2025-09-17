"use client"

import type React from "react"

import { useEffect, useRef, useState, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Text, Box, Sphere, Cylinder } from "@react-three/drei"
import { Physics, useBox, useSphere } from "@react-three/cannon"
import type * as THREE from "three"
import { Button } from "@/components/ui/button"

interface GameState {
  score: number
  isGameOver: boolean
  isGameStarted: boolean
  altitude: number
  speed: number
  fuel: number
  heading: number
}

// 飞机组件
function Aircraft({
  position,
  onPositionUpdate,
}: {
  position: [number, number, number]
  onPositionUpdate: (pos: [number, number, number], altitude: number, speed: number, heading: number) => void
}) {
  const [aircraftRef, api] = useBox(() => ({
    mass: 500,
    position,
    args: [6, 1.5, 10],
    material: { friction: 0.1 },
    userData: { type: "aircraft" },
  }))

  const propellerRef = useRef<THREE.Group>(null)
  const keys = useRef({
    throttleUp: false,
    throttleDown: false,
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    yawLeft: false,
    yawRight: false,
  })

  const currentPosition = useRef(position)
  const currentRotation = useRef({ x: 0, y: 0, z: 0 })
  const throttle = useRef(0.5)
  const velocity = useRef({ x: 0, y: 0, z: 0 })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
          keys.current.throttleUp = true
          break
        case "s":
          keys.current.throttleDown = true
          break
        case "arrowup":
          keys.current.pitchUp = true
          break
        case "arrowdown":
          keys.current.pitchDown = true
          break
        case "arrowleft":
          keys.current.rollLeft = true
          break
        case "arrowright":
          keys.current.rollRight = true
          break
        case "a":
          keys.current.yawLeft = true
          break
        case "d":
          keys.current.yawRight = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
          keys.current.throttleUp = false
          break
        case "s":
          keys.current.throttleDown = false
          break
        case "arrowup":
          keys.current.pitchUp = false
          break
        case "arrowdown":
          keys.current.pitchDown = false
          break
        case "arrowleft":
          keys.current.rollLeft = false
          break
        case "arrowright":
          keys.current.rollRight = false
          break
        case "a":
          keys.current.yawLeft = false
          break
        case "d":
          keys.current.yawRight = false
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

    // 油门控制
    if (keys.current.throttleUp) throttle.current = Math.min(1, throttle.current + 0.01)
    if (keys.current.throttleDown) throttle.current = Math.max(0, throttle.current - 0.01)

    // 姿态控制
    if (keys.current.pitchUp) currentRotation.current.x = Math.max(-0.3, currentRotation.current.x - 0.015)
    if (keys.current.pitchDown) currentRotation.current.x = Math.min(0.3, currentRotation.current.x + 0.015)
    if (keys.current.rollLeft) currentRotation.current.z = Math.max(-0.5, currentRotation.current.z - 0.02)
    if (keys.current.rollRight) currentRotation.current.z = Math.min(0.5, currentRotation.current.z + 0.02)
    if (keys.current.yawLeft) currentRotation.current.y += 0.015
    if (keys.current.yawRight) currentRotation.current.y -= 0.015

    // 自动回正
    if (!keys.current.pitchUp && !keys.current.pitchDown) {
      currentRotation.current.x *= 0.98
    }
    if (!keys.current.rollLeft && !keys.current.rollRight) {
      currentRotation.current.z *= 0.95
    }

    // 飞行物理
    const thrust = throttle.current * 25
    const airspeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2)
    const lift = Math.max(0, airspeed * 0.8 - 9.8) // 升力减去重力

    // 推力方向
    const thrustX = Math.sin(currentRotation.current.y) * thrust * Math.cos(currentRotation.current.x)
    const thrustY = Math.sin(currentRotation.current.x) * thrust + lift
    const thrustZ = Math.cos(currentRotation.current.y) * thrust * Math.cos(currentRotation.current.x)

    // 更新速度
    velocity.current.x += thrustX * 0.016
    velocity.current.y += thrustY * 0.016
    velocity.current.z += thrustZ * 0.016

    // 应用阻力
    velocity.current.x *= 0.98
    velocity.current.y *= 0.98
    velocity.current.z *= 0.98

    // 更新位置
    currentPosition.current[0] += velocity.current.x * 0.016
    currentPosition.current[1] += velocity.current.y * 0.016
    currentPosition.current[2] += velocity.current.z * 0.016

    // 限制高度
    if (currentPosition.current[1] < 5) {
      currentPosition.current[1] = 5
      velocity.current.y = Math.max(0, velocity.current.y)
    }

    api.position.set(currentPosition.current[0], currentPosition.current[1], currentPosition.current[2])
    api.rotation.set(currentRotation.current.x, currentRotation.current.y, currentRotation.current.z)

    // 螺旋桨动画
    if (propellerRef.current) {
      propellerRef.current.rotation.z += throttle.current * 2
    }

    // 计算速度和航向
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2 + velocity.current.z ** 2) * 3.6
    const heading = currentRotation.current.y * 57.3

    onPositionUpdate(currentPosition.current, currentPosition.current[1], speed, heading)
  })

  return (
    <group ref={aircraftRef}>
      {/* 机身 */}
      <Box args={[1.5, 1, 10]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#4169E1" />
      </Box>

      {/* 机翼 */}
      <Box args={[12, 0.3, 3]} position={[0, 0, 1]}>
        <meshStandardMaterial color="#1E90FF" />
      </Box>

      {/* 尾翼 */}
      <Box args={[4, 0.2, 1.5]} position={[0, 0, -4]}>
        <meshStandardMaterial color="#1E90FF" />
      </Box>
      <Box args={[0.8, 3, 1.5]} position={[0, 1.5, -4]}>
        <meshStandardMaterial color="#1E90FF" />
      </Box>

      {/* 驾驶舱 */}
      <Sphere args={[0.8]} position={[0, 0.6, 1.5]}>
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </Sphere>

      {/* 引擎 */}
      <Cylinder args={[0.6, 0.6, 1.5]} position={[0, 0, 5]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#333333" />
      </Cylinder>

      {/* 螺旋桨 */}
      <group ref={propellerRef} position={[0, 0, 5.8]}>
        <Box args={[0.1, 0.05, 3]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#888888" />
        </Box>
        <Box args={[3, 0.05, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#888888" />
        </Box>
      </group>

      {/* 导航灯 */}
      <Sphere args={[0.1]} position={[-6, 0, 1]}>
        <meshBasicMaterial color="#ff0000" />
      </Sphere>
      <Sphere args={[0.1]} position={[6, 0, 1]}>
        <meshBasicMaterial color="#00ff00" />
      </Sphere>
    </group>
  )
}

// 山脉组件
function Mountain({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  const [mountainRef] = useBox(() => ({
    mass: 0,
    position: [position[0], position[1] + size[1] / 2, position[2]],
    args: size,
  }))

  return (
    <group ref={mountainRef}>
      <Box args={size} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8B7355" />
      </Box>
    </group>
  )
}

// 检查点组件
function Checkpoint({ position, onPass }: { position: [number, number, number]; onPass: () => void }) {
  const [checkpointRef] = useSphere(() => ({
    mass: 0,
    position,
    args: [5],
    isTrigger: true,
    onCollide: (e) => {
      if (e.body.userData?.type === "aircraft") {
        onPass()
      }
    },
  }))

  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <group ref={checkpointRef}>
      <group ref={meshRef}>
        {/* 检查点环 */}
        <mesh>
          <torusGeometry args={[8, 1, 8, 32]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[8, 1, 8, 32]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      </group>
    </group>
  )
}

// 3D 飞行场景
function FlightScene({
  gameState,
  setGameState,
}: {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const [aircraftPosition, setAircraftPosition] = useState<[number, number, number]>([0, 50, 0])
  const [checkpoints, setCheckpoints] = useState<
    Array<{ id: number; position: [number, number, number]; passed: boolean }>
  >([])
  const { camera } = useThree()

  const checkpointIdRef = useRef(0)

  useEffect(() => {
    // 生成检查点
    const newCheckpoints = []
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6
      newCheckpoints.push({
        id: checkpointIdRef.current++,
        position: [Math.cos(angle) * 150, 50 + Math.random() * 60, Math.sin(angle) * 150] as [number, number, number],
        passed: false,
      })
    }
    setCheckpoints(newCheckpoints)
  }, [])

  const handlePositionUpdate = (pos: [number, number, number], altitude: number, speed: number, heading: number) => {
    setAircraftPosition(pos)
    setGameState((prev) => ({
      ...prev,
      altitude,
      speed,
      heading,
      fuel: Math.max(0, prev.fuel - 0.003),
    }))

    // 相机跟随
    camera.position.set(pos[0] - 40, pos[1] + 20, pos[2] - 40)
    camera.lookAt(pos[0], pos[1], pos[2])
  }

  const handleCheckpointPass = (checkpointId: number) => {
    setCheckpoints((prev) => prev.map((cp) => (cp.id === checkpointId ? { ...cp, passed: true } : cp)))
    setGameState((prev) => ({ ...prev, score: prev.score + 500 }))
  }
  const mountains = useMemo(() => {
      return Array.from({ length :25 }).map((_ ,i) =>{
        const x = (Math.random() - 0.5) * 800
        const z = (Math.random() - 0.5) * 800
  
        if(Math.abs(x%80)<20 || Math.abs(z%80)<20) return null;
        
        const height = 30 + Math.random() * 100
        const width = 20 + Math.random() * 40
        const depth = 20 + Math.random() * 40
  
        return <Mountain key={i} position={[x, 0, z]} size={[width, height, depth]} />
      }).filter(Boolean);
    }, []);
  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, 100]} intensity={0.8} />

      {/* 地面 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* 山脉 */}
      {mountains}

      {/* 跑道 */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 200]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* 跑道标线 */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[0, 0.11, (i - 10) * 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2, 4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* 飞机 */}
      <Aircraft position={[0, 50, 0]} onPositionUpdate={handlePositionUpdate} />

      {/* 检查点 */}
      {checkpoints
        .filter((cp) => !cp.passed)
        .map((checkpoint) => (
          <Checkpoint
            key={checkpoint.id}
            position={checkpoint.position}
            onPass={() => handleCheckpointPass(checkpoint.id)}
          />
        ))}

      {/* UI 文本 */}
      <Text
        position={[aircraftPosition[0] - 40, aircraftPosition[1] + 25, aircraftPosition[2] - 20]}
        fontSize={3}
        color="white"
        anchorX="left"
        anchorY="top"
      >
        {`高度: ${Math.round(gameState.altitude)}ft`}
      </Text>

      <Text
        position={[aircraftPosition[0], aircraftPosition[1] + 25, aircraftPosition[2] - 20]}
        fontSize={3}
        color="white"
        anchorX="center"
        anchorY="top"
      >
        {`空速: ${Math.round(gameState.speed)} kt`}
      </Text>

      <Text
        position={[aircraftPosition[0] + 40, aircraftPosition[1] + 25, aircraftPosition[2] - 20]}
        fontSize={3}
        color="white"
        anchorX="right"
        anchorY="top"
      >
        {`燃料: ${Math.round(gameState.fuel)}%`}
      </Text>
    </>
  )
}

export function FlightSimulator() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    isGameStarted: false,
    altitude: 50,
    speed: 0,
    fuel: 100,
    heading: 0,
  })

  const startGame = () => {
    setGameState({
      score: 0,
      isGameOver: false,
      isGameStarted: true,
      altitude: 50,
      speed: 0,
      fuel: 100,
      heading: 0,
    })
  }

  const restartGame = () => {
    startGame()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-lg font-bold">高度: {Math.round(gameState.altitude)}ft</div>
        <div className="text-lg font-bold">燃料: {Math.round(gameState.fuel)}%</div>
      </div>

      <div className="relative w-full" style={{ height: "600px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">3D 飞行模拟器</h3>
            <p className="text-center mb-4">使用WS控制油门，方向键控制飞机姿态，AD控制偏航！</p>
            <p className="text-center mb-4 text-sm text-muted-foreground">通过黄色检查点获得分数，体验流畅飞行！</p>
            <Button onClick={startGame}>开始飞行</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">飞行结束</h3>
            <p className="text-lg mb-4">最终得分: {gameState.score}</p>
            <Button onClick={restartGame}>重新飞行</Button>
          </div>
        )}

        {gameState.isGameStarted && !gameState.isGameOver && (
          <Canvas camera={{ position: [-40, 70, -40], fov: 75 }} className="w-full h-full">
            <Physics gravity={[0, -9.8, 0]} broadphase="Naive">
              <FlightScene gameState={gameState} setGameState={setGameState} />
            </Physics>
          </Canvas>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: WS油门控制，方向键姿态控制，AD偏航控制。通过检查点获得分数！</p>
      </div>
    </div>
  )
}
