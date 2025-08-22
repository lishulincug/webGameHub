"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function CarSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    score: 0,
    lapTime: 0,
    bestLap: Number.POSITIVE_INFINITY,
  })
  const [carStats, setCarStats] = useState({
    speed: 0,
    rpm: 0,
    gear: 1,
    fuel: 100,
    temperature: 90,
  })

  const gameStateRef = useRef({
    car: {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      angle: 0,
      speed: 0,
      acceleration: 0,
      steering: 0,
      brake: 0,
      gear: 1,
      rpm: 800,
    },
    camera: {
      x: 0,
      y: 20,
      z: -80,
      targetX: 0,
      targetY: 10,
      targetZ: 0,
      angle: 0,
    },
    keys: new Set(),
    track: {
      checkpoints: [],
      barriers: [],
      startLine: { x: 0, z: 0, width: 50 },
    },
    otherCars: [],
    particles: [],
    time: 0,
    lapStartTime: 0,
    currentCheckpoint: 0,
  })

  // 初始化游戏
  const initGame = () => {
    const state = gameStateRef.current

    // 重置汽车状态
    state.car = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      angle: 0,
      speed: 0,
      acceleration: 0,
      steering: 0,
      brake: 0,
      gear: 1,
      rpm: 800,
    }

    // 生成赛道检查点（椭圆形赛道）
    state.track.checkpoints = []
    const numCheckpoints = 12
    for (let i = 0; i < numCheckpoints; i++) {
      const angle = (i * Math.PI * 2) / numCheckpoints
      const radiusX = 800
      const radiusZ = 600
      state.track.checkpoints.push({
        x: Math.cos(angle) * radiusX,
        z: Math.sin(angle) * radiusZ,
        angle: angle + Math.PI / 2,
        passed: false,
      })
    }

    // 生成赛道护栏
    state.track.barriers = []
    for (let i = 0; i < 100; i++) {
      const angle = (i * Math.PI * 2) / 100
      const innerRadius = 500
      const outerRadius = 1000

      // 内侧护栏
      state.track.barriers.push({
        x: Math.cos(angle) * innerRadius,
        z: Math.sin(angle) * innerRadius * 0.7,
        width: 20,
        height: 30,
        color: "#FF4444",
      })

      // 外侧护栏
      state.track.barriers.push({
        x: Math.cos(angle) * outerRadius,
        z: Math.sin(angle) * outerRadius * 0.7,
        width: 20,
        height: 30,
        color: "#FF4444",
      })
    }

    // 生成AI汽车
    state.otherCars = []
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5
      state.otherCars.push({
        x: Math.cos(angle) * 700 + (Math.random() - 0.5) * 100,
        z: Math.sin(angle) * 500 + (Math.random() - 0.5) * 100,
        angle: angle + Math.PI / 2,
        speed: 80 + Math.random() * 40,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        aiState: {
          targetCheckpoint: Math.floor(Math.random() * numCheckpoints),
          steerDirection: 0,
        },
      })
    }

    state.particles = []
    state.time = 0
    state.lapStartTime = 0
    state.currentCheckpoint = 0

    setGameState({
      isGameStarted: true,
      isGameOver: false,
      score: 0,
      lapTime: 0,
      bestLap: Number.POSITIVE_INFINITY,
    })

    setCarStats({
      speed: 0,
      rpm: 800,
      gear: 1,
      fuel: 100,
      temperature: 90,
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

      // 更新汽车物理
      updateCarPhysics(state)

      // 更新AI汽车
      updateAICars(state)

      // 更新相机
      updateCamera(state)

      // 更新粒子效果
      updateParticles(state)

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

  // 更新汽车物理
  const updateCarPhysics = (state: any) => {
    const car = state.car
    const keys = state.keys

    // 油门和刹车
    let throttle = 0
    let brake = 0

    if (keys.has("w") || keys.has("W")) throttle = 1
    if (keys.has("s") || keys.has("S")) brake = 1

    // 转向
    let steering = 0
    if (keys.has("a") || keys.has("A")) steering = -1
    if (keys.has("d") || keys.has("D")) steering = 1

    // 手刹
    if (keys.has(" ")) brake = 2

    // 换挡
    if (keys.has("q") || keys.has("Q")) car.gear = Math.max(1, car.gear - 1)
    if (keys.has("e") || keys.has("E")) car.gear = Math.min(6, car.gear + 1)

    // 引擎物理
    const maxSpeed = [0, 60, 100, 140, 180, 220, 260][car.gear] || 260
    const acceleration = throttle * (2000 / car.gear) - brake * 1000 - car.speed * 5

    car.acceleration = acceleration
    car.speed += acceleration * 0.016
    car.speed = Math.max(0, Math.min(car.speed, maxSpeed))

    // 转向物理
    car.steering = steering * Math.min(1, 50 / Math.max(car.speed, 10))
    car.angle += car.steering * (car.speed / 100) * 0.016

    // 位置更新
    car.vx = Math.sin(car.angle) * car.speed
    car.vz = Math.cos(car.angle) * car.speed

    car.x += car.vx * 0.016
    car.z += car.vz * 0.016

    // RPM计算
    car.rpm = 800 + (car.speed / maxSpeed) * 6000

    // 添加轮胎烟雾效果
    if (Math.abs(car.steering) > 0.5 && car.speed > 30) {
      if (Math.random() < 0.3) {
        const smokeX = car.x - Math.sin(car.angle) * 15 + (Math.random() - 0.5) * 10
        const smokeZ = car.z - Math.cos(car.angle) * 15 + (Math.random() - 0.5) * 10
        state.particles.push({
          x: smokeX,
          y: 2,
          z: smokeZ,
          vx: (Math.random() - 0.5) * 10,
          vy: Math.random() * 5,
          vz: (Math.random() - 0.5) * 10,
          life: 1,
          maxLife: 1,
          size: 5 + Math.random() * 8,
          color: "rgba(100, 100, 100, 0.6)",
        })
      }
    }

    // 引擎尾气
    if (throttle > 0.5 && Math.random() < 0.2) {
      state.particles.push({
        x: car.x - Math.sin(car.angle) * 25,
        y: 3,
        z: car.z - Math.cos(car.angle) * 25,
        vx: -Math.sin(car.angle) * 5 + (Math.random() - 0.5) * 3,
        vy: Math.random() * 2,
        vz: -Math.cos(car.angle) * 5 + (Math.random() - 0.5) * 3,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color: "rgba(50, 50, 50, 0.4)",
      })
    }
  }

  // 更新AI汽车
  const updateAICars = (state: any) => {
    state.otherCars.forEach((aiCar: any) => {
      const targetCheckpoint = state.track.checkpoints[aiCar.aiState.targetCheckpoint]

      // 计算到目标检查点的方向
      const dx = targetCheckpoint.x - aiCar.x
      const dz = targetCheckpoint.z - aiCar.z
      const targetAngle = Math.atan2(dx, dz)

      // 转向逻辑
      let angleDiff = targetAngle - aiCar.angle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

      aiCar.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.02)

      // 移动
      aiCar.x += Math.sin(aiCar.angle) * aiCar.speed * 0.016
      aiCar.z += Math.cos(aiCar.angle) * aiCar.speed * 0.016

      // 检查是否到达检查点
      const distance = Math.sqrt(dx * dx + dz * dz)
      if (distance < 100) {
        aiCar.aiState.targetCheckpoint = (aiCar.aiState.targetCheckpoint + 1) % state.track.checkpoints.length
      }
    })
  }

  // 更新相机
  const updateCamera = (state: any) => {
    const camera = state.camera
    const car = state.car

    // 第三人称跟随相机
    const distance = 80
    const height = 20

    camera.targetX = car.x - Math.sin(car.angle) * distance
    camera.targetY = height
    camera.targetZ = car.z - Math.cos(car.angle) * distance

    // 平滑跟随
    camera.x += (camera.targetX - camera.x) * 0.1
    camera.y += (camera.targetY - camera.y) * 0.1
    camera.z += (camera.targetZ - camera.z) * 0.1
    camera.angle = car.angle
  }

  // 更新粒子
  const updateParticles = (state: any) => {
    state.particles = state.particles.filter((particle: any) => {
      particle.x += particle.vx * 0.016
      particle.y += particle.vy * 0.016
      particle.z += particle.vz * 0.016
      particle.life -= 0.02
      particle.vy -= 0.1 // 重力
      return particle.life > 0
    })
  }

  // 检测事件
  const checkEvents = (state: any) => {
    const car = state.car

    // 检测检查点通过
    const currentCheckpoint = state.track.checkpoints[state.currentCheckpoint]
    if (currentCheckpoint && !currentCheckpoint.passed) {
      const dx = car.x - currentCheckpoint.x
      const dz = car.z - currentCheckpoint.z
      const distance = Math.sqrt(dx * dx + dz * dz)

      if (distance < 50) {
        currentCheckpoint.passed = true
        state.currentCheckpoint = (state.currentCheckpoint + 1) % state.track.checkpoints.length

        // 完成一圈
        if (state.currentCheckpoint === 0) {
          const lapTime = state.time - state.lapStartTime
          setGameState((prev) => ({
            ...prev,
            score: prev.score + 1000,
            lapTime: lapTime,
            bestLap: Math.min(prev.bestLap, lapTime),
          }))
          state.lapStartTime = state.time

          // 重置检查点
          state.track.checkpoints.forEach((cp: any) => {
            cp.passed = false
          })
        }
      }
    }

    // 检测护栏碰撞
    state.track.barriers.forEach((barrier: any) => {
      const dx = car.x - barrier.x
      const dz = car.z - barrier.z
      const distance = Math.sqrt(dx * dx + dz * dz)

      if (distance < 25) {
        // 碰撞反弹
        car.speed *= 0.5
        const bounceAngle = Math.atan2(dx, dz)
        car.x += Math.sin(bounceAngle) * 10
        car.z += Math.cos(bounceAngle) * 10

        // 碰撞特效
        for (let i = 0; i < 8; i++) {
          state.particles.push({
            x: car.x,
            y: 5,
            z: car.z,
            vx: (Math.random() - 0.5) * 20,
            vy: Math.random() * 15,
            vz: (Math.random() - 0.5) * 20,
            life: 1,
            maxLife: 1,
            size: 4 + Math.random() * 6,
            color: "rgba(255, 150, 0, 0.8)",
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

    // 相机旋转
    const rotatedX = dx * Math.cos(-camera.angle) - dz * Math.sin(-camera.angle)
    const rotatedZ = dx * Math.sin(-camera.angle) + dz * Math.cos(-camera.angle)

    if (rotatedZ <= 0) return null

    const fov = 800
    const screenX = canvas.width / 2 + (rotatedX * fov) / rotatedZ
    const screenY = canvas.height / 2 - (dy * fov) / rotatedZ
    const scale = fov / rotatedZ

    return { x: screenX, y: screenY, scale, distance: rotatedZ }
  }

  // 渲染场景
  const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any) => {
    // 绘制天空
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#98FB98")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制地面
    ctx.fillStyle = "#228B22"
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4)

    // 绘制赛道
    ctx.fillStyle = "#333"
    const trackPoints: any[] = []
    for (let i = 0; i < state.track.checkpoints.length; i++) {
      const checkpoint = state.track.checkpoints[i]
      const projected = project3D(checkpoint.x, 0, checkpoint.z, state.camera, canvas)
      if (projected) {
        trackPoints.push(projected)
      }
    }

    if (trackPoints.length > 2) {
      ctx.beginPath()
      ctx.moveTo(trackPoints[0].x, trackPoints[0].y)
      for (let i = 1; i < trackPoints.length; i++) {
        ctx.lineTo(trackPoints[i].x, trackPoints[i].y)
      }
      ctx.closePath()
      ctx.fill()
    }

    // 收集所有3D对象并按距离排序
    const objects: any[] = []

    // 添加护栏
    state.track.barriers.forEach((barrier: any) => {
      const projected = project3D(barrier.x, barrier.height / 2, barrier.z, state.camera, canvas)
      if (projected) {
        objects.push({
          ...projected,
          type: "barrier",
          data: barrier,
        })
      }
    })

    // 添加检查点
    state.track.checkpoints.forEach((checkpoint: any, index: number) => {
      if (index === state.currentCheckpoint) {
        const projected = project3D(checkpoint.x, 15, checkpoint.z, state.camera, canvas)
        if (projected) {
          objects.push({
            ...projected,
            type: "checkpoint",
            data: checkpoint,
          })
        }
      }
    })

    // 添加AI汽车
    state.otherCars.forEach((aiCar: any) => {
      const projected = project3D(aiCar.x, 5, aiCar.z, state.camera, canvas)
      if (projected) {
        objects.push({
          ...projected,
          type: "aicar",
          data: aiCar,
        })
      }
    })

    // 添加玩家汽车
    const carProjected = project3D(state.car.x, 5, state.car.z, state.camera, canvas)
    if (carProjected) {
      objects.push({
        ...carProjected,
        type: "car",
        data: state.car,
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
        case "barrier":
          renderBarrier(ctx, obj)
          break
        case "checkpoint":
          renderCheckpoint(ctx, obj)
          break
        case "aicar":
          renderAICar(ctx, obj)
          break
        case "car":
          renderCar(ctx, obj)
          break
        case "particle":
          renderParticle(ctx, obj)
          break
      }
    })

    // 绘制HUD
    renderHUD(ctx, canvas, state)
  }

  // 渲染护栏
  const renderBarrier = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const width = scale * data.width * 0.5
    const height = scale * data.height * 0.5

    ctx.fillStyle = data.color
    ctx.fillRect(x - width / 2, y - height / 2, width, height)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.strokeRect(x - width / 2, y - height / 2, width, height)
  }

  // 渲染检查点
  const renderCheckpoint = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale } = obj
    const size = scale * 30

    // 绘制检查点门
    ctx.strokeStyle = "yellow"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x - size, y - size)
    ctx.lineTo(x - size, y + size)
    ctx.moveTo(x + size, y - size)
    ctx.lineTo(x + size, y + size)
    ctx.moveTo(x - size, y - size)
    ctx.lineTo(x + size, y - size)
    ctx.stroke()

    // 检查点编号
    ctx.fillStyle = "yellow"
    ctx.font = `${Math.max(12, scale * 8)}px Arial`
    ctx.textAlign = "center"
    ctx.fillText((gameStateRef.current.currentCheckpoint + 1).toString(), x, y)
  }

  // 渲染AI汽车
  const renderAICar = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const width = scale * 20
    const height = scale * 10

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(data.angle - gameStateRef.current.camera.angle)

    ctx.fillStyle = data.color
    ctx.fillRect(-width / 2, -height / 2, width, height)
    ctx.strokeStyle = "black"
    ctx.lineWidth = 1
    ctx.strokeRect(-width / 2, -height / 2, width, height)

    // 车窗
    ctx.fillStyle = "rgba(100, 100, 255, 0.5)"
    ctx.fillRect(-width / 3, -height / 3, width * 0.66, height * 0.66)

    ctx.restore()
  }

  // 渲染玩家汽车
  const renderCar = (ctx: CanvasRenderingContext2D, obj: any) => {
    const { x, y, scale, data } = obj
    const width = scale * 25
    const height = scale * 12

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(data.angle - gameStateRef.current.camera.angle)

    // 车身
    ctx.fillStyle = "#FF4444"
    ctx.fillRect(-width / 2, -height / 2, width, height)
    ctx.strokeStyle = "black"
    ctx.lineWidth = 2
    ctx.strokeRect(-width / 2, -height / 2, width, height)

    // 车窗
    ctx.fillStyle = "rgba(100, 100, 255, 0.7)"
    ctx.fillRect(-width / 3, -height / 3, width * 0.66, height * 0.66)

    // 车头灯
    ctx.fillStyle = "white"
    ctx.fillRect(-width / 2 - 2, -height / 4, 4, height / 8)
    ctx.fillRect(-width / 2 - 2, height / 8, 4, height / 8)

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
    ctx.fillRect(10, 10, 280, 160)

    ctx.fillStyle = "white"
    ctx.font = "16px monospace"
    ctx.fillText(`速度: ${Math.round(state.car.speed)} km/h`, 20, 35)
    ctx.fillText(`档位: ${state.car.gear}`, 20, 55)
    ctx.fillText(`转速: ${Math.round(state.car.rpm)} RPM`, 20, 75)
    ctx.fillText(`圈数: ${gameState.score / 1000}`, 20, 95)
    ctx.fillText(`当前圈时间: ${(state.time - state.lapStartTime).toFixed(1)}s`, 20, 115)
    if (gameState.bestLap < Number.POSITIVE_INFINITY) {
      ctx.fillText(`最佳圈速: ${gameState.bestLap.toFixed(1)}s`, 20, 135)
    }

    // 速度表
    ctx.save()
    ctx.translate(canvas.width - 100, canvas.height - 100)

    // 速度表背景
    ctx.strokeStyle = "white"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 50, 0, Math.PI * 2)
    ctx.stroke()

    // 速度指针
    const speedAngle = (state.car.speed / 260) * Math.PI * 1.5 - Math.PI * 0.75
    ctx.strokeStyle = "red"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(speedAngle) * 40, Math.sin(speedAngle) * 40)
    ctx.stroke()

    ctx.restore()

    // 转速表
    ctx.save()
    ctx.translate(canvas.width - 200, canvas.height - 100)

    // 转速表背景
    ctx.strokeStyle = "white"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 50, 0, Math.PI * 2)
    ctx.stroke()

    // 转速指针
    const rpmAngle = ((state.car.rpm - 800) / 6000) * Math.PI * 1.5 - Math.PI * 0.75
    ctx.strokeStyle = "orange"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(rpmAngle) * 40, Math.sin(rpmAngle) * 40)
    ctx.stroke()

    ctx.restore()

    // 小地图
    ctx.save()
    ctx.translate(canvas.width - 150, 100)
    ctx.scale(0.1, 0.1)

    // 绘制赛道
    ctx.strokeStyle = "white"
    ctx.lineWidth = 20
    ctx.beginPath()
    state.track.checkpoints.forEach((checkpoint: any, index: number) => {
      if (index === 0) {
        ctx.moveTo(checkpoint.x, checkpoint.z)
      } else {
        ctx.lineTo(checkpoint.x, checkpoint.z)
      }
    })
    ctx.closePath()
    ctx.stroke()

    // 绘制玩家位置
    ctx.fillStyle = "red"
    ctx.beginPath()
    ctx.arc(state.car.x, state.car.z, 30, 0, Math.PI * 2)
    ctx.fill()

    // 绘制AI汽车
    ctx.fillStyle = "blue"
    state.otherCars.forEach((aiCar: any) => {
      ctx.beginPath()
      ctx.arc(aiCar.x, aiCar.z, 20, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.restore()
  }

  // 更新UI状态
  const updateUI = (state: any) => {
    setCarStats({
      speed: Math.round(state.car.speed),
      rpm: Math.round(state.car.rpm),
      gear: state.car.gear,
      fuel: Math.max(0, 100 - state.time * 0.1),
      temperature: 90 + Math.random() * 10,
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
        <div className="text-lg font-bold">圈数: {Math.floor(gameState.score / 1000)}</div>
        <div className="text-sm">
          速度: {carStats.speed}km/h | 档位: {carStats.gear} | 转速: {carStats.rpm}RPM
        </div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">汽车驾驶模拟器</h3>
            <p className="text-center mb-4">
              使用WASD控制汽车，Q/E换挡，空格手刹。完成赛道圈数获得分数，挑战最佳圈速！
            </p>
            <Button onClick={initGame}>开始驾驶</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">驾驶结束</h3>
            <p className="text-lg mb-2">完成圈数: {Math.floor(gameState.score / 1000)}</p>
            {gameState.bestLap < Number.POSITIVE_INFINITY && (
              <p className="text-lg mb-4">最佳圈速: {gameState.bestLap.toFixed(1)}秒</p>
            )}
            <Button onClick={restartGame}>重新驾驶</Button>
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full border rounded-md bg-green-200" />
      </div>

      {gameState.isGameStarted && !gameState.isGameOver && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={restartGame}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p>控制说明: W加速，S刹车，A/D转向，Q/E换挡，空格手刹。完成赛道圈数，挑战最佳圈速记录！</p>
      </div>
    </div>
  )
}
