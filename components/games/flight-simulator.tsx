"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function FlightSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    score: 0,
  })
  const [flightStats, setFlightStats] = useState({
    altitude: 1000,
    speed: 200,
    fuel: 100,
    heading: 0,
    pitch: 0,
    roll: 0,
  })

  const gameStateRef = useRef({
    plane: {
      x: 0,
      y: 1000,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 200,
      pitch: 0,
      roll: 0,
      yaw: 0,
      throttle: 0.5,
      flaps: 0,
    },
    camera: {
      x: 0,
      y: 1020,
      z: -150,
      targetX: 0,
      targetY: 1000,
      targetZ: 0,
    },
    keys: new Set(),
    clouds: [],
    mountains: [],
    runways: [],
    checkpoints: [],
    particles: [],
    time: 0,
    weather: {
      windX: 0,
      windZ: 0,
      turbulence: 0,
    },
  })

  // 初始化游戏
  const initGame = () => {
    const state = gameStateRef.current

    // 重置飞机状态
    state.plane = {
      x: 0,
      y: 1000,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 200,
      pitch: 0,
      roll: 0,
      yaw: 0,
      throttle: 0.5,
      flaps: 0,
    }

    // 生成云朵
    state.clouds = []
    for (let i = 0; i < 30; i++) {
      state.clouds.push({
        x: (Math.random() - 0.5) * 5000,
        y: 800 + Math.random() * 800,
        z: (Math.random() - 0.5) * 5000,
        size: 50 + Math.random() * 100,
        opacity: 0.3 + Math.random() * 0.4,
      })
    }

    // 生成山脉
    state.mountains = []
    for (let i = 0; i < 50; i++) {
      state.mountains.push({
        x: (Math.random() - 0.5) * 8000,
        y: 0,
        z: (Math.random() - 0.5) * 8000,
        height: 200 + Math.random() * 600,
        width: 100 + Math.random() * 200,
        color: `hsl(${120 + Math.random() * 60}, 40%, ${30 + Math.random() * 20}%)`,
      })
    }

    // 生成跑道
    state.runways = [
      {
        x: 0,
        y: 0,
        z: 2000,
        width: 50,
        length: 800,
        heading: 0,
      },
      {
        x: -1500,
        y: 0,
        z: -1000,
        width: 40,
        length: 600,
        heading: Math.PI / 4,
      },
    ]

    // 生成检查点
    state.checkpoints = []
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8
      state.checkpoints.push({
        x: Math.cos(angle) * 2000,
        y: 800 + Math.random() * 400,
        z: Math.sin(angle) * 2000,
        collected: false,
        rotation: 0,
      })
    }

    state.particles = []
    state.time = 0

    // 设置天气
    state.weather = {
      windX: (Math.random() - 0.5) * 20,
      windZ: (Math.random() - 0.5) * 20,
      turbulence: Math.random() * 0.5,
    }

    setGameState({
      isGameStarted: true,
      isGameOver: false,
      score: 0,
    })

    setFlightStats({
      altitude: 1000,
      speed: 200,
      fuel: 100,
      heading: 0,
      pitch: 0,
      roll: 0,
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

      // 更新飞机物理
      updatePlanePhysics(state)

      // 更新相机
      updateCamera(state)

      // 更新粒子和效果
      updateEffects(state)

      // 检测碰撞和事件
      checkEvents(state)

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

  // 更新飞机物理
  const updatePlanePhysics = (state: any) => {
    const plane = state.plane
    const keys = state.keys
    const weather = state.weather

    // 油门控制
    if (keys.has("w") || keys.has("W")) plane.throttle = Math.min(plane.throttle + 0.01, 1)
    if (keys.has("s") || keys.has("S")) plane.throttle = Math.max(plane.throttle - 0.01, 0)

    // 姿态控制
    if (keys.has("ArrowUp")) plane.pitch = Math.max(plane.pitch - 0.01, -0.5)
    if (keys.has("ArrowDown")) plane.pitch = Math.min(plane.pitch + 0.01, 0.5)
    if (keys.has("ArrowLeft")) plane.roll = Math.max(plane.roll - 0.02, -0.8)
    if (keys.has("ArrowRight")) plane.roll = Math.min(plane.roll + 0.02, 0.8)
    if (keys.has("a") || keys.has("A")) plane.yaw -= 0.01
    if (keys.has("d") || keys.has("D")) plane.yaw += 0.01

    // 自动回正
    if (!keys.has("ArrowLeft") && !keys.has("ArrowRight")) {
      plane.roll *= 0.95
    }
    if (!keys.has("ArrowUp") && !keys.has("ArrowDown")) {
      plane.pitch *= 0.98
    }

    // 空气动力学
    const airspeed = Math.sqrt(plane.vx ** 2 + plane.vy ** 2 + plane.vz ** 2)
    const thrust = plane.throttle * 500
    const drag = airspeed * airspeed * 0.01
    const lift = airspeed * airspeed * 0.02 * Math.cos(plane.pitch)

    // 推力
    plane.vx += Math.sin(plane.yaw) * thrust * 0.001
    plane.vz += Math.cos(plane.yaw) * thrust * 0.001

    // 升力和重力
    const gravity = -9.8
    plane.vy += (lift - gravity - drag * Math.sin(plane.pitch)) * 0.01

    // 阻力
    plane.vx *= 0.999
    plane.vz *= 0.999
    plane.vy *= 0.995

    // 风力影响
    plane.vx += weather.windX * 0.01
    plane.vz += weather.windZ * 0.01

    // 湍流
    if (weather.turbulence > 0) {
      plane.vx += (Math.random() - 0.5) * weather.turbulence
      plane.vy += (Math.random() - 0.5) * weather.turbulence
      plane.vz += (Math.random() - 0.5) * weather.turbulence
    }

    // 更新位置
    plane.x += plane.vx * 0.016
    plane.y += plane.vy * 0.016
    plane.z += plane.vz * 0.016

    // 地面碰撞
    if (plane.y < 10) {
      plane.y = 10
      plane.vy = Math.max(plane.vy, 0)
      // 检查是否在跑道上
      const onRunway = state.runways.some((runway: any) => {
        const dx = plane.x - runway.x
        const dz = plane.z - runway.z
        return Math.abs(dx) < runway.width && Math.abs(dz) < runway.length / 2
      })
      if (!onRunway && airspeed > 50) {
        // 坠毁
        setGameState((prev) => ({ ...prev, isGameOver: true }))
      }
    }

    // 添加引擎尾迹
    if (plane.throttle > 0.3 && Math.random() < 0.5) {
      state.particles.push({
        x: plane.x - Math.sin(plane.yaw) * 20,
        y: plane.y - 5,
        z: plane.z - Math.cos(plane.yaw) * 20,
        vx: -Math.sin(plane.yaw) * 10 + (Math.random() - 0.5) * 5,
        vy: -2 + Math.random() * 2,
        vz: -Math.cos(plane.yaw) * 10 + (Math.random() - 0.5) * 5,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color: "rgba(200, 200, 200, 0.6)",
      })
    }
  }

  // 更新相机
  const updateCamera = (state: any) => {
    const camera = state.camera
    const plane = state.plane

    // 第三人称跟随相机
    const distance = 150
    const height = 30

    camera.targetX = plane.x - Math.sin(plane.yaw) * distance
    camera.targetY = plane.y + height
    camera.targetZ = plane.z - Math.cos(plane.yaw) * distance

    // 平滑跟随
    camera.x += (camera.targetX - camera.x) * 0.05
    camera.y += (camera.targetY - camera.y) * 0.05
    camera.z += (camera.targetZ - camera.z) * 0.05
  }

  // 更新效果
  const updateEffects = (state: any) => {
    // 更新粒子
    state.particles = state.particles.filter((particle: any) => {
      particle.x += particle.vx * 0.016
      particle.y += particle.vy * 0.016
      particle.z += particle.vz * 0.016
      particle.life -= 0.02
      return particle.life > 0
    })

    // 更新检查点旋转
    state.checkpoints.forEach((checkpoint: any) => {
      checkpoint.rotation += 0.03
    })
  }

  // 检测事件
  const checkEvents = (state: any) => {
    const plane = state.plane

    // 检测检查点
    state.checkpoints.forEach((checkpoint: any) => {
      if (!checkpoint.collected) {
        const dx = plane.x - checkpoint.x
        const dy = plane.y - checkpoint.y
        const dz = plane.z - checkpoint.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (distance < 50) {
          checkpoint.collected = true
          setGameState((prev) => ({ ...prev, score: prev.score + 100 }))

          // 添加收集特效
          for (let i = 0; i < 15; i++) {
            state.particles.push({
              x: checkpoint.x,
              y: checkpoint.y,
              z: checkpoint.z,
              vx: (Math.random() - 0.5) * 20,
              vy: Math.random() * 15,
              vz: (Math.random() - 0.5) * 20,
              life: 1,
              maxLife: 1,
              size: 4 + Math.random() * 6,
              color: "rgba(255, 215, 0, 0.9)",
            })
          }
        }
      }
    })

    // 燃料消耗
    const fuelConsumption = state.plane.throttle * 0.02
    setFlightStats((prev) => ({
      ...prev,
      fuel: Math.max(0, prev.fuel - fuelConsumption),
    }))
  }

  // 3D投影函数
  const project3D = (x: number, y: number, z: number, camera: any, canvas: HTMLCanvasElement) => {
    const dx = x - camera.x
    const dy = y - camera.y
    const dz = z - camera.z

    if (dz <= 0) return null

    const fov = 1000
    const screenX = canvas.width / 2 + (dx * fov) / dz
    const screenY = canvas.height / 2 - (dy * fov) / dz
    const scale = fov / dz

    return { x: screenX, y: screenY, scale, distance: dz }
  }

  // 渲染场景
  const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any) => {
    // 绘制天空
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(0.3, "#98FB98")
    gradient.addColorStop(1, "#228B22")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 收集所有3D对象并按距离排序
    const objects: any[] = []

    // 添加地面
    const groundLevel = project3D(0, 0, 0, state.camera, canvas)
    if (groundLevel) {
      ctx.fillStyle = "#90EE90"
      ctx.fillRect(0, groundLevel.y, canvas.width, canvas.height - groundLevel.y)
    }

    // 添加山脉
    state.mountains.forEach((mountain: any) => {
      const projected = project3D(mountain.x, mountain.y + mountain.height / 2, mountain.z, state.camera, canvas)
      if (projected) {
        objects.push({
          ...projected,
          type: "mountain",
          data: mountain,
        })
      }
    })

    // 添加跑道
    state.runways.forEach((runway: any) => {
      const projected = project3D(runway.x, runway.y, runway.z, state.camera, canvas)
      if (projected) {
        objects.push({
          ...projected,
          type: "runway",
          data: runway,
        })
      }
    })

    // 添加云朵
    state.clouds.forEach((cloud: any) => {
      const projected = project3D(cloud.x, cloud.y, cloud.z, state.camera, canvas)
      if (projected) {
        objects.push({
          ...projected,
          type: "cloud",
          data: cloud,
        })
      }
    })

    // 添加检查点
    state.checkpoints.forEach((checkpoint: any) => {
      if (!checkpoint.collected) {
        const projected = project3D(checkpoint.x, checkpoint.y, checkpoint.z, state.camera, canvas)
        if (projected) {
          objects.push({
            ...projected,
            type: "checkpoint",
            data: checkpoint,
          })
        }
      }
    })

    // 添加飞机
    const planeProjected = project3D(state.plane.x, state.plane.y, state.plane.z, state.camera, canvas)
    if (planeProjected) {
      objects.push({
        ...planeProjected,
        type: "plane",
        data: state.plane,
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

    // 按距离排序
    objects.sort((a, b) => b.distance - a.distance)

    // 渲染所有对象
    objects.forEach((obj) => {
      switch (obj.type) {
        case "mountain":
          renderMountain(ctx, obj)
          break
        case "runway":
          renderRunway(ctx, obj)
          break
        case "cloud":
          renderCloud(ctx, obj)
          break
        case "checkpoint":
          renderCheckpoint(ctx, obj)
          break
        case "plane":
          renderPlane(ctx, obj)
          break
        case "particle":
          renderParticle(ctx, obj)
          break
      }
    })

    // 绘制HUD
    renderHUD(ctx, canvas, state)
  }

  // 渲染山脉
  const renderMountain = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const width = scale * data.width * 0.5
    const height = scale * data.height * 0.5

    ctx.fillStyle = data.color
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - width / 2, y + height)
    ctx.lineTo(x + width / 2, y + height)
    ctx.closePath()
    ctx.fill()
  }

  // 渲染跑道
  const renderRunway = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const width = scale * data.width
    const length = scale * data.length

    ctx.fillStyle = "#333"
    ctx.fillRect(x - width / 2, y - length / 2, width, length)

    // 跑道标线
    ctx.fillStyle = "white"
    for (let i = -length / 2; i < length / 2; i += 20) {
      ctx.fillRect(x - 2, y + i, 4, 10)
    }
  }

  // 渲染云朵
  const renderCloud = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const size = scale * data.size * 0.3

    ctx.fillStyle = `rgba(255, 255, 255, ${data.opacity})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // 渲染检查点
  const renderCheckpoint = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const size = scale * 20

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(data.rotation)

    // 绘制环形检查点
    ctx.strokeStyle = "gold"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(0, 0, size, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = "orange"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2)
    ctx.stroke()

    ctx.restore()
  }

  // 渲染飞机
  const renderPlane = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const size = scale * 15

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(data.yaw)

    // 绘制飞机机身
    ctx.fillStyle = "#4169E1"
    ctx.fillRect(-size / 2, -size / 6, size, size / 3)

    // 绘制机翼
    ctx.fillStyle = "#1E90FF"
    ctx.fillRect(-size * 0.8, -size / 12, size * 1.6, size / 6)

    // 绘制尾翼
    ctx.fillRect(-size * 0.4, -size / 3, size / 6, size / 2)

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
    // 仪表盘背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
    ctx.fillRect(10, 10, 250, 140)

    ctx.fillStyle = "white"
    ctx.font = "14px monospace"
    ctx.fillText(`高度: ${Math.round(state.plane.y)}ft`, 20, 30)
    ctx.fillText(`空速: ${Math.round(Math.sqrt(state.plane.vx ** 2 + state.plane.vz ** 2))}kt`, 20, 50)
    ctx.fillText(`燃料: ${Math.round(flightStats.fuel)}%`, 20, 70)
    ctx.fillText(`油门: ${Math.round(state.plane.throttle * 100)}%`, 20, 90)
    ctx.fillText(`俯仰: ${Math.round(state.plane.pitch * 57.3)}°`, 20, 110)
    ctx.fillText(`横滚: ${Math.round(state.plane.roll * 57.3)}°`, 20, 130)

    // 人工地平仪
    ctx.save()
    ctx.translate(canvas.width - 100, 100)
    ctx.rotate(state.plane.roll)

    // 天空
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(-50, -50 - state.plane.pitch * 100, 100, 50 + state.plane.pitch * 100)

    // 地面
    ctx.fillStyle = "#8B4513"
    ctx.fillRect(-50, -state.plane.pitch * 100, 100, 50 + state.plane.pitch * 100)

    // 地平线
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-50, -state.plane.pitch * 100)
    ctx.lineTo(50, -state.plane.pitch * 100)
    ctx.stroke()

    ctx.restore()

    // 飞机符号
    ctx.strokeStyle = "yellow"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(canvas.width - 120, 100)
    ctx.lineTo(canvas.width - 80, 100)
    ctx.moveTo(canvas.width - 100, 85)
    ctx.lineTo(canvas.width - 100, 115)
    ctx.stroke()
  }

  // 更新UI状态
  const updateUI = (state: any) => {
    setFlightStats((prev) => ({
      ...prev,
      altitude: Math.round(state.plane.y),
      speed: Math.round(Math.sqrt(state.plane.vx ** 2 + state.plane.vz ** 2)),
      heading: Math.round((((state.plane.yaw * 57.3) % 360) + 360) % 360),
      pitch: Math.round(state.plane.pitch * 57.3),
      roll: Math.round(state.plane.roll * 57.3),
    }))
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
          高度: {flightStats.altitude}ft | 空速: {flightStats.speed}kt | 燃料: {flightStats.fuel}%
        </div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">飞行模拟器</h3>
            <p className="text-center mb-4">
              使用W/S控制油门，方向键控制飞机姿态，A/D控制偏航。通过金色检查点获得分数！
            </p>
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

        <canvas ref={canvasRef} className="w-full h-full border rounded-md bg-sky-300" />
      </div>

      {gameState.isGameStarted && !gameState.isGameOver && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={restartGame}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: W/S油门控制，方向键姿态控制，A/D偏航控制。通过金色检查点获得分数，注意燃料和高度！</p>
      </div>
    </div>
  )
}
