"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function DroneSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    score: 0,
  })
  const [droneStats, setDroneStats] = useState({
    altitude: 0,
    speed: 0,
    battery: 100,
    pitch: 0,
    roll: 0,
    yaw: 0,
  })

  const gameStateRef = useRef({
    drone: {
      x: 0,
      y: 50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      pitch: 0,
      roll: 0,
      yaw: 0,
      thrust: 0,
    },
    camera: {
      x: 0,
      y: 60,
      z: -100,
      targetX: 0,
      targetY: 50,
      targetZ: 0,
    },
    keys: new Set(),
    obstacles: [],
    targets: [],
    particles: [],
    time: 0,
  })

  // 初始化游戏
  const initGame = () => {
    const state = gameStateRef.current

    // 重置无人机状态
    state.drone = {
      x: 0,
      y: 50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      pitch: 0,
      roll: 0,
      yaw: 0,
      thrust: 0,
    }

    // 生成障碍物
    state.obstacles = []
    for (let i = 0; i < 20; i++) {
      state.obstacles.push({
        x: (Math.random() - 0.5) * 1000,
        y: Math.random() * 100 + 20,
        z: (Math.random() - 0.5) * 1000,
        width: 20 + Math.random() * 30,
        height: 30 + Math.random() * 50,
        depth: 20 + Math.random() * 30,
        color: `hsl(${Math.random() * 60 + 200}, 50%, 40%)`,
      })
    }

    // 生成目标点
    state.targets = []
    for (let i = 0; i < 10; i++) {
      state.targets.push({
        x: (Math.random() - 0.5) * 800,
        y: 30 + Math.random() * 80,
        z: (Math.random() - 0.5) * 800,
        collected: false,
        rotation: 0,
      })
    }

    state.particles = []
    state.time = 0

    setGameState({
      isGameStarted: true,
      isGameOver: false,
      score: 0,
    })

    setDroneStats({
      altitude: 50,
      speed: 0,
      battery: 100,
      pitch: 0,
      roll: 0,
      yaw: 0,
    })
  }

  // 游戏循环
  useEffect(() => {
    if (!gameState.isGameStarted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    let animationId: number

    const gameLoop = () => {
      const state = gameStateRef.current
      state.time += 0.016

      // 更新无人机物理
      updateDronePhysics(state)

      // 更新相机
      updateCamera(state)

      // 更新粒子
      updateParticles(state)

      // 检测碰撞
      checkCollisions(state)

      // 渲染场景
      render(ctx, canvas, state)

      // 更新UI状态
      updateUI(state)

      if (!gameState.isGameOver) {
        animationId = requestAnimationFrame(gameLoop)
      }
    }

    gameLoop()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameState.isGameStarted, gameState.isGameOver])

  // 更新无人机物理
  const updateDronePhysics = (state: any) => {
    const drone = state.drone
    const keys = state.keys

    // 推力控制
    if (keys.has("w") || keys.has("W")) drone.thrust = Math.min(drone.thrust + 0.5, 10)
    else if (keys.has("s") || keys.has("S")) drone.thrust = Math.max(drone.thrust - 0.5, -5)
    else drone.thrust *= 0.95

    // 姿态控制
    if (keys.has("ArrowUp")) drone.pitch = Math.max(drone.pitch - 0.02, -0.3)
    else if (keys.has("ArrowDown")) drone.pitch = Math.min(drone.pitch + 0.02, 0.3)
    else drone.pitch *= 0.9

    if (keys.has("ArrowLeft")) drone.roll = Math.max(drone.roll - 0.02, -0.3)
    else if (keys.has("ArrowRight")) drone.roll = Math.min(drone.roll + 0.02, 0.3)
    else drone.roll *= 0.9

    if (keys.has("a") || keys.has("A")) drone.yaw -= 0.03
    if (keys.has("d") || keys.has("D")) drone.yaw += 0.03

    // 应用物理
    const gravity = -0.3
    const drag = 0.98

    // 垂直运动
    drone.vy += gravity + drone.thrust * 0.8
    drone.vy *= drag

    // 水平运动（基于姿态）
    drone.vx += Math.sin(drone.yaw) * drone.pitch * 2
    drone.vz += Math.cos(drone.yaw) * drone.pitch * 2
    drone.vx += Math.sin(drone.yaw + Math.PI / 2) * drone.roll * 1.5
    drone.vz += Math.cos(drone.yaw + Math.PI / 2) * drone.roll * 1.5

    drone.vx *= drag
    drone.vz *= drag

    // 更新位置
    drone.x += drone.vx
    drone.y += drone.vy
    drone.z += drone.vz

    // 地面碰撞
    if (drone.y < 5) {
      drone.y = 5
      drone.vy = Math.max(drone.vy, 0)
    }

    // 添加螺旋桨粒子效果
    if (Math.random() < 0.3) {
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + drone.yaw
        const px = drone.x + Math.cos(angle) * 8
        const pz = drone.z + Math.sin(angle) * 8
        state.particles.push({
          x: px,
          y: drone.y - 2,
          z: pz,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2,
          vz: (Math.random() - 0.5) * 2,
          life: 1,
          maxLife: 1,
          size: 2 + Math.random() * 3,
          color: "rgba(200, 200, 255, 0.6)",
        })
      }
    }
  }

  // 更新相机
  const updateCamera = (state: any) => {
    const camera = state.camera
    const drone = state.drone

    // 第三人称跟随相机
    const distance = 80
    const height = 20

    camera.targetX = drone.x - Math.sin(drone.yaw) * distance
    camera.targetY = drone.y + height
    camera.targetZ = drone.z - Math.cos(drone.yaw) * distance

    // 平滑跟随
    camera.x += (camera.targetX - camera.x) * 0.1
    camera.y += (camera.targetY - camera.y) * 0.1
    camera.z += (camera.targetZ - camera.z) * 0.1
  }

  // 更新粒子
  const updateParticles = (state: any) => {
    state.particles = state.particles.filter((particle: any) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.z += particle.vz
      particle.life -= 0.02
      particle.vy -= 0.1 // 重力
      return particle.life > 0
    })
  }

  // 检测碰撞
  const checkCollisions = (state: any) => {
    const drone = state.drone

    // 检测目标收集
    state.targets.forEach((target: any) => {
      if (!target.collected) {
        const dx = drone.x - target.x
        const dy = drone.y - target.y
        const dz = drone.z - target.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (distance < 15) {
          target.collected = true
          setGameState((prev) => ({ ...prev, score: prev.score + 10 }))

          // 添加收集特效
          for (let i = 0; i < 10; i++) {
            state.particles.push({
              x: target.x,
              y: target.y,
              z: target.z,
              vx: (Math.random() - 0.5) * 10,
              vy: Math.random() * 10,
              vz: (Math.random() - 0.5) * 10,
              life: 1,
              maxLife: 1,
              size: 3 + Math.random() * 5,
              color: "rgba(255, 215, 0, 0.8)",
            })
          }
        }
      }
    })

    // 检测障碍物碰撞
    state.obstacles.forEach((obstacle: any) => {
      const dx = Math.abs(drone.x - obstacle.x)
      const dy = Math.abs(drone.y - obstacle.y)
      const dz = Math.abs(drone.z - obstacle.z)

      if (dx < obstacle.width / 2 + 5 && dy < obstacle.height / 2 + 5 && dz < obstacle.depth / 2 + 5) {
        // 碰撞处理
        drone.vx *= -0.5
        drone.vy *= -0.5
        drone.vz *= -0.5

        // 添加碰撞特效
        for (let i = 0; i < 5; i++) {
          state.particles.push({
            x: drone.x,
            y: drone.y,
            z: drone.z,
            vx: (Math.random() - 0.5) * 15,
            vy: Math.random() * 10,
            vz: (Math.random() - 0.5) * 15,
            life: 1,
            maxLife: 1,
            size: 4 + Math.random() * 6,
            color: "rgba(255, 100, 100, 0.8)",
          })
        }
      }
    })
  }

  // 3D投影函数
  const project3D = (x: number, y: number, z: number, camera: any, canvas: HTMLCanvasElement) => {
    const dx = x - camera.x
    const dy = y - camera.y
    const dz = z - camera.z

    if (dz <= 0) return null

    const fov = 800
    const screenX = canvas.width / 2 + (dx * fov) / dz
    const screenY = canvas.height / 2 - (dy * fov) / dz
    const scale = fov / dz

    return { x: screenX, y: screenY, scale, distance: dz }
  }

  // 渲染场景
  const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any) => {
    // 清空画布
    ctx.fillStyle = "linear-gradient(to bottom, #87CEEB, #98FB98)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制天空渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(0.7, "#98FB98")
    gradient.addColorStop(1, "#228B22")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制地面网格
    ctx.strokeStyle = "rgba(0, 100, 0, 0.3)"
    ctx.lineWidth = 1
    for (let i = -500; i <= 500; i += 50) {
      const start1 = project3D(i, 0, -500, state.camera, canvas)
      const end1 = project3D(i, 0, 500, state.camera, canvas)
      const start2 = project3D(-500, 0, i, state.camera, canvas)
      const end2 = project3D(500, 0, i, state.camera, canvas)

      if (start1 && end1) {
        ctx.beginPath()
        ctx.moveTo(start1.x, start1.y)
        ctx.lineTo(end1.x, end1.y)
        ctx.stroke()
      }

      if (start2 && end2) {
        ctx.beginPath()
        ctx.moveTo(start2.x, start2.y)
        ctx.lineTo(end2.x, end2.y)
        ctx.stroke()
      }
    }

    // 收集所有3D对象并按距离排序
    const objects: any[] = []

    // 添加障碍物
    state.obstacles.forEach((obstacle: any) => {
      const projected = project3D(obstacle.x, obstacle.y, obstacle.z, state.camera, canvas)
      if (projected) {
        objects.push({
          ...projected,
          type: "obstacle",
          data: obstacle,
        })
      }
    })

    // 添加目标
    state.targets.forEach((target: any) => {
      if (!target.collected) {
        target.rotation += 0.05
        const projected = project3D(target.x, target.y, target.z, state.camera, canvas)
        if (projected) {
          objects.push({
            ...projected,
            type: "target",
            data: target,
          })
        }
      }
    })

    // 添加无人机
    const droneProjected = project3D(state.drone.x, state.drone.y, state.drone.z, state.camera, canvas)
    if (droneProjected) {
      objects.push({
        ...droneProjected,
        type: "drone",
        data: state.drone,
      })
    }

    // 添加粒子
    state.particles.forEach((particle: any) => {
      const projected = project3D(particle.x, particle.y, particle.z, state.camera, canvas)
      if (projected) {
        objects.push({
          ...projected,
          type: "particle",
          data: particle,
        })
      }
    })

    // 按距离排序（远的先画）
    objects.sort((a, b) => b.distance - a.distance)

    // 渲染所有对象
    objects.forEach((obj) => {
      switch (obj.type) {
        case "obstacle":
          renderObstacle(ctx, obj)
          break
        case "target":
          renderTarget(ctx, obj)
          break
        case "drone":
          renderDrone(ctx, obj)
          break
        case "particle":
          renderParticle(ctx, obj)
          break
      }
    })

    // 绘制HUD
    renderHUD(ctx, canvas, state)
  }

  // 渲染障碍物
  const renderObstacle = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const size = scale * 20

    ctx.fillStyle = data.color
    ctx.fillRect(x - size / 2, y - size / 2, size, size)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
    ctx.lineWidth = 1
    ctx.strokeRect(x - size / 2, y - size / 2, size, size)
  }

  // 渲染目标
  const renderTarget = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const size = scale * 8

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(data.rotation)

    // 绘制旋转的星形
    ctx.fillStyle = "gold"
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5
      const outerRadius = size
      const innerRadius = size * 0.5
      const outerX = Math.cos(angle) * outerRadius
      const outerY = Math.sin(angle) * outerRadius
      const innerAngle = angle + Math.PI / 5
      const innerX = Math.cos(innerAngle) * innerRadius
      const innerY = Math.sin(innerAngle) * innerRadius

      if (i === 0) ctx.moveTo(outerX, outerY)
      else ctx.lineTo(outerX, outerY)
      ctx.lineTo(innerX, innerY)
    }
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = "orange"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }

  // 渲染无人机
  const renderDrone = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const size = scale * 12

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(data.yaw)

    // 绘制无人机主体
    ctx.fillStyle = "#333"
    ctx.fillRect(-size / 2, -size / 4, size, size / 2)

    // 绘制螺旋桨臂
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-size, -size)
    ctx.lineTo(size, size)
    ctx.moveTo(size, -size)
    ctx.lineTo(-size, size)
    ctx.stroke()

    // 绘制螺旋桨
    ctx.fillStyle = "rgba(100, 100, 100, 0.5)"
    const propPositions = [
      [-size * 0.8, -size * 0.8],
      [size * 0.8, -size * 0.8],
      [size * 0.8, size * 0.8],
      [-size * 0.8, size * 0.8],
    ]

    propPositions.forEach(([px, py]) => {
      ctx.beginPath()
      ctx.arc(px, py, size * 0.3, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.restore()
  }

  // 渲染粒子
  const renderParticle = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const size = scale * data.size * (data.life / data.maxLife)

    ctx.fillStyle = data.color
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // 渲染HUD
  const renderHUD = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 200, 120)

    ctx.fillStyle = "white"
    ctx.font = "14px monospace"
    ctx.fillText(`高度: ${Math.round(state.drone.y)}m`, 20, 30)
    ctx.fillText(`速度: ${Math.round(Math.sqrt(state.drone.vx ** 2 + state.drone.vz ** 2) * 10)}km/h`, 20, 50)
    ctx.fillText(`电池: ${Math.round(droneStats.battery)}%`, 20, 70)
    ctx.fillText(`俯仰: ${Math.round(state.drone.pitch * 57.3)}°`, 20, 90)
    ctx.fillText(`横滚: ${Math.round(state.drone.roll * 57.3)}°`, 20, 110)

    // 绘制十字准星
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
    ctx.lineWidth = 2
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    ctx.beginPath()
    ctx.moveTo(centerX - 20, centerY)
    ctx.lineTo(centerX + 20, centerY)
    ctx.moveTo(centerX, centerY - 20)
    ctx.lineTo(centerX, centerY + 20)
    ctx.stroke()

    // 绘制姿态指示器
    ctx.save()
    ctx.translate(canvas.width - 80, 80)
    ctx.rotate(state.drone.roll)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-30, 0)
    ctx.lineTo(30, 0)
    ctx.stroke()
    ctx.restore()
  }

  // 更新UI状态
  const updateUI = (state: any) => {
    setDroneStats({
      altitude: Math.round(state.drone.y),
      speed: Math.round(Math.sqrt(state.drone.vx ** 2 + state.drone.vz ** 2) * 10),
      battery: Math.max(0, 100 - state.time * 0.5),
      pitch: Math.round(state.drone.pitch * 57.3),
      roll: Math.round(state.drone.roll * 57.3),
      yaw: Math.round(state.drone.yaw * 57.3),
    })
  }

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys.add(e.key)
      e.preventDefault()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys.delete(e.key)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // 重新开始游戏
  const restartGame = () => {
    initGame()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-sm">
          高度: {droneStats.altitude}m | 速度: {droneStats.speed}km/h | 电池: {droneStats.battery}%
        </div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">无人机模拟器</h3>
            <p className="text-center mb-4">使用WASD控制推力和偏航，方向键控制俯仰和横滚。收集金色目标，避开障碍物！</p>
            <Button onClick={initGame}>开始飞行</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">飞行结束</h3>
            <p className="text-lg mb-4">最终得分: {gameState.score}</p>
            <Button onClick={restartGame}>重新飞行</Button>
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full border rounded-md bg-sky-200" />
      </div>

      {gameState.isGameStarted && !gameState.isGameOver && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={restartGame}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: W/S推力控制，A/D偏航控制，方向键俯仰横滚控制。收集金色目标获得分数，小心避开障碍物！</p>
      </div>
    </div>
  )
}
