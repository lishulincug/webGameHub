"use client"

import type React from "react"
import type * as THREE from "three"
import { useEffect, useRef, useState, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Text, Box, Cylinder, Sphere } from "@react-three/drei"
import { Physics, useBox } from "@react-three/cannon"
import { Button } from "@/components/ui/button"

interface GameState {
  score: number
  lap: number
  time: number
  bestLap: number
  isGameOver: boolean
  isGameStarted: boolean
  speed: number
  gear: number
  rpm: number
}

// 3D 汽车组件
function Car3D({
  position,
  onPositionUpdate,
}: {
  position: [number, number, number]
  onPositionUpdate: (pos: [number, number, number], speed: number, gear: number, rpm: number) => void
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
    shiftUp: false,
    shiftDown: false,
  })

  const currentPosition = useRef(position)
  const currentRotation = useRef(0)
  const velocity = useRef({ x: 0, z: 0 })
  const [gear, setGear] = useState(1)
  const [rpm, setRpm] = useState(800)

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
        case "q":
          keys.current.shiftDown = true
          break
        case "e":
          keys.current.shiftUp = true
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
        case "q":
          keys.current.shiftDown = false
          break
        case "e":
          keys.current.shiftUp = false
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

    const acceleration = 15
    const maxSpeed = 30
    const turnSpeed = 1.5
    const friction = 0.95

    // 换挡
    if (keys.current.shiftUp) {
      setGear((prev) => Math.min(5, prev + 1))
      keys.current.shiftUp = false
    }
    if (keys.current.shiftDown) {
      setGear((prev) => Math.max(1, prev - 1))
      keys.current.shiftDown = false
    }

    // 加速度控制
    let accelerationForce = 0
    if (keys.current.forward) accelerationForce = acceleration / gear
    if (keys.current.backward) accelerationForce = -acceleration / (gear * 2)
    if (keys.current.brake) accelerationForce *= 0.3

    // 转向控制
    let turnAmount = 0
    if (keys.current.left) turnAmount = turnSpeed
    if (keys.current.right) turnAmount = -turnSpeed

    // 更新速度
    const currentSpeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2)
    if (Math.abs(accelerationForce) > 0.1) {
      velocity.current.x += Math.sin(currentRotation.current) * accelerationForce * 0.016
      velocity.current.z += Math.cos(currentRotation.current) * accelerationForce * 0.016
    }

    // 应用摩擦力
    velocity.current.x *= friction
    velocity.current.z *= friction

    // 限制最大速度
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2)
    if (speed > maxSpeed) {
      velocity.current.x = (velocity.current.x / speed) * maxSpeed
      velocity.current.z = (velocity.current.z / speed) * maxSpeed
    }

    // 转向（只有在移动时才能转向）
    if (speed > 0.5) {
      currentRotation.current += turnAmount * (speed / maxSpeed) * 0.016
    }

    // 更新位置
    currentPosition.current[0] += velocity.current.x * 0.016
    currentPosition.current[2] += velocity.current.z * 0.016

    api.position.set(currentPosition.current[0], currentPosition.current[1], currentPosition.current[2])
    api.rotation.set(0, currentRotation.current, 0)

    // 计算RPM
    const newRpm = 800 + (speed / (40 / gear)) * 100
    setRpm(newRpm)

    onPositionUpdate(currentPosition.current, speed * 3.6, gear, newRpm)

    // 车辆倾斜效果
    if (meshRef.current) {
      const targetTilt = turnAmount * 0.05
      meshRef.current.rotation.z += (targetTilt - meshRef.current.rotation.z) * 0.1
    }
  })

  return (
    <group ref={carRef}>
      <group ref={meshRef}>
        {/* 主车身 */}
        <Box args={[3, 0.8, 6]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ff0000" />
        </Box>

        {/* 车顶 */}
        <Box args={[2.5, 0.6, 3]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#cc0000" />
        </Box>

        {/* 挡风玻璃 */}
        <Box args={[2.2, 0.4, 0.1]} position={[0, 0.6, 1.4]}>
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
        </Box>
        <Box args={[2.2, 0.4, 0.1]} position={[0, 0.6, -1.4]}>
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
        </Box>

        {/* 前灯 */}
        <Cylinder args={[0.3, 0.3, 0.2]} position={[-1.2, 0, -2.8]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ffffff" />
        </Cylinder>
        <Cylinder args={[0.3, 0.3, 0.2]} position={[1.2, 0, -2.8]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ffffff" />
        </Cylinder>

        {/* 尾灯 */}
        <Cylinder args={[0.2, 0.2, 0.15]} position={[-1.2, 0, 2.8]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ff0000" />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 0.15]} position={[1.2, 0, 2.8]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ff0000" />
        </Cylinder>

        {/* 车轮 */}
        <Cylinder args={[0.5, 0.5, 0.3]} position={[-1.2, -0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Cylinder args={[0.5, 0.5, 0.3]} position={[1.2, -0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Cylinder args={[0.5, 0.5, 0.3]} position={[-1.2, -0.4, 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Cylinder args={[0.5, 0.5, 0.3]} position={[1.2, -0.4, 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>

        {/* 轮毂 */}
        <Cylinder args={[0.3, 0.3, 0.35]} position={[-1.2, -0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888888" />
        </Cylinder>
        <Cylinder args={[0.3, 0.3, 0.35]} position={[1.2, -0.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888888" />
        </Cylinder>
        <Cylinder args={[0.3, 0.3, 0.35]} position={[-1.2, -0.4, 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888888" />
        </Cylinder>
        <Cylinder args={[0.3, 0.3, 0.35]} position={[1.2, -0.4, 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888888" />
        </Cylinder>
      </group>
    </group>
  )
}

// 城市建筑组件
function CityBuilding({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  const [buildingRef] = useBox(() => ({
    type: 'Static',
    mass: 0,
    position: [position[0], position[1] + size[1] / 2, position[2]],
    args: size,
    fixedRotation: true,
    collisionResponse: false // Disable collision response for static objects
  }))

  return (
    <group ref={buildingRef}>
      <Box args={size} position={[0, size[1]/2 - size[1]/2 -0.01 ,0]}> {/* Slightly adjust to prevent z-fighting */}
        <meshStandardMaterial color={`hsl(${Math.random() * 60 + 200}, 40%, ${Math.random() *10 +50}%)`} />
      </Box>
    </group>
  )
}

// 道路组件
function Road({
  position,
  rotation = [0, 0, 0],
}: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const [roadRef] = useBox(() => ({
    mass: 0,
    position,
    args: [15, 0.2, 80],
    rotation,
  }))

  return (
    <group ref={roadRef}>
      <Box args={[15, 0.2, 80]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* 道路标线 */}
      {Array.from({ length: 16 }).map((_, i) => (
        <Box key={i} args={[0.4, 0.21, 3]} position={[0, 0.01, (i - 8) * 5]}>
          <meshStandardMaterial color="#ffff00" />
        </Box>
      ))}
    </group>
  )
}

// TrafficLight组件 - memo优化并提取为单独组件
function TrafficLight({ position }: { position: [number, number, number] }) {
  const lightColor = useMemo(() => Math.random() > 0.5 ? "#ff0000" : "#333333", [])
  
  return (
    <group position={position}>
      {/* Traffic pole */}
      <Cylinder args={[0.15, 0.15,  6]} 
               position={[0 ,3 ,0]}
               receiveShadow castShadow>
        <meshStandardMaterial color="#666666" />
      </Cylinder>
      
      {/* Traffic light box */}
      <Box args={[0.8 ,2 ,0.4]} 
           position={[0 ,5.5 ,0]}
           receiveShadow castShadow>
        <meshStandardMaterial color="#333333" />
      </Box>
      
      {/* Lights */}
      <Sphere args={[0.2]} 
              position={[0 ,6.2 ,0.25]}
              receiveShadow castShadow>
        <meshBasicMaterial color={lightColor} />
      </Sphere>
      
      <Sphere args={[0.2]} 
              position={[0 ,5.5 ,0.25]}
              receiveShadow castShadow>
        <meshBasicMaterial color="#ffff00" />
      </Sphere>
      
      <Sphere args={[0.2]} 
              position={[0 ,4.8 ,0.25]}
              receiveShadow castShadow>
        <meshBasicMaterial color="#00ff00" />
      </Sphere>
    </group>
   )
}

// 3D 汽车驾驶场景
function CarScene({
  gameState,
  setGameState,
}: {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const [carPosition, setCarPosition] = useState<[number, number, number]>([0, 1, 0])
  const [carSpeed, setCarSpeed] = useState(0)
  const { camera } = useThree()

  const handlePositionUpdate = (pos: [number, number, number], speed: number, gear: number, rpm: number) => {
    setCarPosition(pos)
    setCarSpeed(speed)
    setGameState((prev) => ({ ...prev, speed, gear, rpm }))

    // 相机跟随
    camera.position.set(pos[0] - 20, pos[1] + 12, pos[2] - 20)
    camera.lookAt(pos[0], pos[1], pos[2])
  }

  useFrame((state) => {
    setGameState((prev) => ({ ...prev, time: prev.time + 0.016 }))
  })

  const buildings = useMemo(() => {
     return Array.from({ length :25 }).map((_ ,i) =>{
       const x =(Math.random()- .5)*400;
       const z =(Math.random()- .5)*400;

       if(Math.abs(x%80)<20 || Math.abs(z%80)<20) return null;

       const height=15+Math.random()*50;
       const width=10+Math.random()*20;
       const depth=10+Math.random()*20;

       return (
         <CityBuilding 
           key={`building-${i}`}
           position={[x,.01,z]} // Slightly above ground to prevent z-fighting 
           size ={[width ,height,depth]}
         />
       );
     }).filter(Boolean);
   }, []);

   const trafficLights = useMemo(() => {
     return Array.from({ length :16 }).map((_ ,i) =>{
       const x=((i%4)-2)*80+15;
       const z=(Math.floor(i/4)-2)*80+15;

       return (
         <TrafficLight 
           key={`light-${i}`}
           position ={[x,.01,z]} // Slightly above ground to prevent z-fighting 
         />
       );
     });
   }, []);

  return (
    <>
      {/* 光照 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 50, 50]} intensity={0.8} />

      {/* 地面 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* 城市网格道路 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Road key={`road-x-${i}`} position={[(i - 3) * 80, 0, 0]} />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <Road key={`road-z-${i}`} position={[0, 0, (i - 3) * 80]} rotation={[0, Math.PI / 2, 0]} />
      ))}

      {/* 城市建筑 */}
      {buildings}
      {/* {Array.from({ length: 25 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 400
        const z = (Math.random() - 0.5) * 400

        // 避免在道路上生成建筑
        if (Math.abs(x % 80) < 20 || Math.abs(z % 80) < 20) return null

        const height = 15 + Math.random() * 50
        const width = 10 + Math.random() * 20
        const depth = 10 + Math.random() * 20

        return <CityBuilding key={i} position={[x, 0, z]} size={[width, height, depth]} />
      })} */}

      {/* 交通灯 */}
      {trafficLights}
      {/* {Array.from({ length: 16 }).map((_, i) => {
        const x = ((i % 4) - 2) * 80 + 15
        const z = (Math.floor(i / 4) - 2) * 80 + 15

        return (
          <group key={i} position={[x, 0, z]}>
            <Cylinder args={[0.15, 0.15, 6]} position={[0, 3, 0]}>
              <meshStandardMaterial color="#666666" />
            </Cylinder>
            <Box args={[0.8, 2, 0.4]} position={[0, 5.5, 0]}>
              <meshStandardMaterial color="#333333" />
            </Box>
            <Sphere args={[0.2]} position={[0, 6.2, 0.25]}>
              <meshBasicMaterial color={Math.random() > 0.5 ? "#ff0000" : "#333333"} />
            </Sphere>
            <Sphere args={[0.2]} position={[0, 5.5, 0.25]}>
              <meshBasicMaterial color={Math.random() > 0.5 ? "#ffff00" : "#333333"} />
            </Sphere>
            <Sphere args={[0.2]} position={[0, 4.8, 0.25]}>
              <meshBasicMaterial color={Math.random() > 0.5 ? "#00ff00" : "#333333"} />
            </Sphere>
          </group>
        )
      })} */}

      {/* 玩家汽车 */}
      <Car3D position={[0, 1, 0]} onPositionUpdate={handlePositionUpdate} />

      {/* UI 文本 */}
      <Text
        position={[carPosition[0] - 25, carPosition[1] + 12, carPosition[2] - 10]}
        fontSize={2}
        color="white"
        anchorX="left"
        anchorY="top"
      >
        {`速度: ${Math.round(carSpeed)} km/h`}
      </Text>

      <Text
        position={[carPosition[0], carPosition[1] + 12, carPosition[2] - 10]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="top"
      >
        {`档位: ${gameState.gear}`}
      </Text>

      <Text
        position={[carPosition[0] + 25, carPosition[1] + 12, carPosition[2] - 10]}
        fontSize={2}
        color="white"
        anchorX="right"
        anchorY="top"
      >
        {`转速: ${Math.round(gameState.rpm)} RPM`}
      </Text>
    </>
  )
}

export function CarSimulator() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lap: 0,
    time: 0,
    bestLap: Number.POSITIVE_INFINITY,
    isGameOver: false,
    isGameStarted: false,
    speed: 0,
    gear: 1,
    rpm: 800,
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
      gear: 1,
      rpm: 800,
    })
  }

  const restartGame = () => {
    startGame()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">速度: {Math.round(gameState.speed)} km/h</div>
        <div className="text-lg font-bold">档位: {gameState.gear}</div>
        <div className="text-lg font-bold">转速: {Math.round(gameState.rpm)} RPM</div>
      </div>

      <div className="relative w-full" style={{ height: "600px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">3D 汽车驾驶模拟器</h3>
            <p className="text-center mb-4">使用WASD或方向键控制汽车，QE换挡，空格刹车！</p>
            <p className="text-center mb-4 text-sm text-muted-foreground">在3D城市中自由驾驶，体验流畅的驾驶感受！</p>
            <Button onClick={startGame}>开始驾驶</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">驾驶结束</h3>
            <p className="text-lg mb-4">驾驶时间: {gameState.time.toFixed(1)}秒</p>
            <Button onClick={restartGame}>重新驾驶</Button>
          </div>
        )}

        {gameState.isGameStarted && !gameState.isGameOver && (
          <Canvas camera={{ position: [-20, 13, -20], fov: 75 }} className="w-full h-full">
            <Physics gravity={[0, -9.8, 0]} broadphase="Naive">
              <CarScene gameState={gameState} setGameState={setGameState} />
            </Physics>
          </Canvas>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: WASD或方向键控制汽车，QE换挡，空格刹车。在3D城市中自由驾驶！</p>
      </div>
    </div>
  )
}
