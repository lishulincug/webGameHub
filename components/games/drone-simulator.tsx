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
  battery: number
}

// 无人机组件
function Drone({
  position,
  onPositionUpdate,
}: {
  position: [number, number, number]
  onPositionUpdate: (pos: [number, number, number], altitude: number, speed: number) => void
}) {
  const [droneRef, api] = useBox(() => ({
    mass: 2,
    position,
    args: [2, 0.5, 2],
    material: { friction: 0.1 },
    userData: { type: "drone" },
  }))

  const propellerRefs = useRef<THREE.Group[]>([])
  const keys = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
  })

  const currentPosition = useRef(position)
  const currentRotation = useRef(0)
  const verticalVelocity = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
          keys.current.up = true
          break
        case "s":
          keys.current.down = true
          break
        case "a":
          keys.current.rotateLeft = true
          break
        case "d":
          keys.current.rotateRight = true
          break
        case "arrowup":
          keys.current.forward = true
          break
        case "arrowdown":
          keys.current.backward = true
          break
        case "arrowleft":
          keys.current.left = true
          break
        case "arrowright":
          keys.current.right = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "w":
          keys.current.up = false
          break
        case "s":
          keys.current.down = false
          break
        case "a":
          keys.current.rotateLeft = false
          break
        case "d":
          keys.current.rotateRight = false
          break
        case "arrowup":
          keys.current.forward = false
          break
        case "arrowdown":
          keys.current.backward = false
          break
        case "arrowleft":
          keys.current.left = false
          break
        case "arrowright":
          keys.current.right = false
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

    const thrustPower = 15
    const movePower = 8
    const turnSpeed = 1.5

    // 垂直控制
    if (keys.current.up) {
      verticalVelocity.current = Math.min(verticalVelocity.current + 0.5, thrustPower)
    } else if (keys.current.down) {
      verticalVelocity.current = Math.max(verticalVelocity.current - 0.5, -thrustPower * 0.5)
    } else {
      // 悬停状态，抵消重力
      verticalVelocity.current = 9.8
    }

    // 旋转控制
    if (keys.current.rotateLeft) currentRotation.current += turnSpeed * 0.016
    if (keys.current.rotateRight) currentRotation.current -= turnSpeed * 0.016

    // 水平移动
    let moveX = 0
    let moveZ = 0

    if (keys.current.forward) moveZ = -movePower
    if (keys.current.backward) moveZ = movePower
    if (keys.current.left) moveX = -movePower
    if (keys.current.right) moveX = movePower

    // 根据旋转角度调整移动方向
    const rotatedMoveX = moveX * Math.cos(currentRotation.current) - moveZ * Math.sin(currentRotation.current)
    const rotatedMoveZ = moveX * Math.sin(currentRotation.current) + moveZ * Math.cos(currentRotation.current)

    // 更新位置
    currentPosition.current[0] += rotatedMoveX * 0.016
    currentPosition.current[1] += verticalVelocity.current * 0.016
    currentPosition.current[2] += rotatedMoveZ * 0.016

    // 限制高度
    if (currentPosition.current[1] < 1) {
      currentPosition.current[1] = 1
      verticalVelocity.current = 0
    }
    if (currentPosition.current[1] > 50) {
      currentPosition.current[1] = 50
      verticalVelocity.current = 0
    }

    api.position.set(currentPosition.current[0], currentPosition.current[1], currentPosition.current[2])
    api.rotation.set(0, currentRotation.current, 0)

    // 螺旋桨旋转动画
    propellerRefs.current.forEach((propeller) => {
      if (propeller) {
        propeller.rotation.y += 0.5
      }
    })

    // 计算速度
    const speed = Math.sqrt(rotatedMoveX * rotatedMoveX + rotatedMoveZ * rotatedMoveZ) * 3.6

    onPositionUpdate(currentPosition.current, currentPosition.current[1], speed)
  })

  return (
    <group ref={droneRef}>
      {/* 无人机主体 */}
      <Box args={[2, 0.5, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* 螺旋桨臂 */}
      <Cylinder args={[0.05, 0.05, 2.5]} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#666666" />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 2.5]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#666666" />
      </Cylinder>

      {/* 螺旋桨 */}
      {[
        [-1, 0.3, -1],
        [1, 0.3, -1],
        [1, 0.3, 1],
        [-1, 0.3, 1],
      ].map((pos, index) => (
        <group key={index} position={pos} ref={(el) => (propellerRefs.current[index] = el!)}>
          <Cylinder args={[0.6, 0.6, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#cccccc" transparent opacity={0.7} />
          </Cylinder>
        </group>
      ))}

      {/* LED 指示灯 */}
      <Sphere args={[0.08]} position={[0.8, 0.1, 0.8]}>
        <meshBasicMaterial color="#00ff00" />
      </Sphere>
      <Sphere args={[0.08]} position={[-0.8, 0.1, 0.8]}>
        <meshBasicMaterial color="#ff0000" />
      </Sphere>
      <Sphere args={[0.08]} position={[0.8, 0.1, -0.8]}>
        <meshBasicMaterial color="#ff0000" />
      </Sphere>
      <Sphere args={[0.08]} position={[-0.8, 0.1, -0.8]}>
        <meshBasicMaterial color="#ff0000" />
      </Sphere>
    </group>
  )
}

// 建筑物组件
function Building({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  const [buildingRef] = useBox(() => ({
    type: "Static", // 明确指定为静态物体
    mass: 0,
    position: [position[0], position[1] + size[1] / 2, position[2]],
    args: size,
    collisionFilterGroup: 2, // 将建筑物放在不同的碰撞组
    collisionFilterMask: -1,
    fixedRotation: true, // 固定旋转
    linearDamping: 0,
    angularDamping: 0,
    material: {
      friction: 0.5,
      restitution: 0.3,
    },
    userData: { type: "building" }
  }))

  return (
    <group ref={buildingRef}>
      <Box args={size} position={[0, 0, 0]}>
        <meshStandardMaterial color={`hsl(${Math.random() * 60 + 200}, 30%, 40%)`} />
      </Box>
    </group>
  )
}
// 目标点组件
function Target({ position, onCollect }: { position: [number, number, number]; onCollect: () => void }) {
  const [targetRef] = useSphere(() => ({
    mass: 0,
    position,
    args: [1],
    isTrigger: true,
    onCollide: (e) => {
      if (e.body.userData?.type === "drone") {
        onCollect()
      }
    },
  }))

  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group ref={targetRef}>
      <group ref={meshRef}>
        <Sphere args={[1]}>
          <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
        </Sphere>
        {/* 目标环 */}
        <mesh>
          <torusGeometry args={[1.5, 0.1, 8, 16]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      </group>
    </group>
  )
}

// 3D 无人机场景
function DroneScene({
  gameState,
  setGameState,
}: {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const [dronePosition, setDronePosition] = useState<[number, number, number]>([0, 10, 0])
  const [targets, setTargets] = useState<Array<{ id: number; position: [number, number, number] }>>([])
  const { camera } = useThree()

  const targetIdRef = useRef(0)

  useEffect(() => {
    // 生成目标点
    const newTargets = []
    for (let i = 0; i < 5; i++) {
      newTargets.push({
        id: targetIdRef.current++,
        position: [(Math.random() - 0.5) * 80, 10 + Math.random() * 25, (Math.random() - 0.5) * 80] as [
          number,
          number,
          number,
        ],
      })
    }
    setTargets(newTargets)
  }, [])

  const handlePositionUpdate = (pos: [number, number, number], altitude: number, speed: number) => {
    setDronePosition(pos)
    setGameState((prev) => ({
      ...prev,
      altitude,
      speed,
      battery: Math.max(0, prev.battery - 0.008),
    }))

    // 相机跟随
    camera.position.set(pos[0] - 20, pos[1] + 12, pos[2] - 20)
    camera.lookAt(pos[0], pos[1], pos[2])
  }

  const handleTargetCollect = (targetId: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== targetId))
    setGameState((prev) => ({ ...prev, score: prev.score + 100 }))
  }

  const buildings = useMemo(() => {
    return Array.from({ length :25 }).map((_ ,i) =>{
      const x =(Math.random()- .5)*400;
      const z =(Math.random()- .5)*400;

      if(Math.abs(x%80)<20 || Math.abs(z%80)<20) return null;

      const height=15+Math.random()*50;
      const width=10+Math.random()*20;
      const depth=10+Math.random()*20;

      return (
        <Building 
          key={`building-${i}`}
          position={[x,.01,z]} // Slightly above ground to prevent z-fighting 
          size ={[width ,height,depth]}
        />
      );
    }).filter(Boolean);
  }, []);
  
  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[30, 30, 30]} intensity={0.8} />

      {/* 地面 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* 城市网格 */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`grid-x-${i}`} position={[(i - 5) * 20, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 200]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`grid-z-${i}`} position={[0, 0.01, (i - 5) * 20]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 0.2]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
      ))}

      {/* 建筑物 */}
      {buildings}
      {/* {Array.from({ length: 12 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 120
        const z = (Math.random() - 0.5) * 120
        const height = 8 + Math.random() * 25
        const width = 4 + Math.random() * 8
        const depth = 4 + Math.random() * 8

        return <Building key={i} position={[x, 0, z]} size={[width, height, depth]} />
      })} */}

      {/* 无人机 */}
      <Drone position={[0, 10, 0]} onPositionUpdate={handlePositionUpdate} />

      {/* 目标点 */}
      {targets.map((target) => (
        <Target key={target.id} position={target.position} onCollect={() => handleTargetCollect(target.id)} />
      ))}

      {/* UI 文本 */}
      <Text
        position={[dronePosition[0] - 25, dronePosition[1] + 15, dronePosition[2] - 12]}
        fontSize={2}
        color="white"
        anchorX="left"
        anchorY="top"
      >
        {`高度: ${Math.round(gameState.altitude)}m`}
      </Text>

      <Text
        position={[dronePosition[0], dronePosition[1] + 15, dronePosition[2] - 12]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="top"
      >
        {`速度: ${Math.round(gameState.speed)} km/h`}
      </Text>

      <Text
        position={[dronePosition[0] + 25, dronePosition[1] + 15, dronePosition[2] - 12]}
        fontSize={2}
        color="white"
        anchorX="right"
        anchorY="top"
      >
        {`电池: ${Math.round(gameState.battery)}%`}
      </Text>
    </>
  )
}

export function DroneSimulator() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    isGameStarted: false,
    altitude: 10,
    speed: 0,
    battery: 100,
  })

  const startGame = () => {
    setGameState({
      score: 0,
      isGameOver: false,
      isGameStarted: true,
      altitude: 10,
      speed: 0,
      battery: 100,
    })
  }

  const restartGame = () => {
    startGame()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-lg font-bold">高度: {Math.round(gameState.altitude)}m</div>
        <div className="text-lg font-bold">电池: {Math.round(gameState.battery)}%</div>
      </div>

      <div className="relative w-full" style={{ height: "600px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">3D 无人机模拟器</h3>
            <p className="text-center mb-4">使用WASD控制升降和旋转，方向键控制前后左右移动！</p>
            <p className="text-center mb-4 text-sm text-muted-foreground">收集黄色目标点，体验流畅的无人机飞行！</p>
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
          <Canvas camera={{ position: [-20, 22, -20], fov: 75 }} className="w-full h-full">
            <Physics gravity={[0, -9.8, 0]} broadphase="Naive">
              <DroneScene gameState={gameState} setGameState={setGameState} />
            </Physics>
          </Canvas>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: WASD控制升降和旋转，方向键控制移动。收集目标点获得分数！</p>
      </div>
    </div>
  )
}
