"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface Car {
  x: number
  y: number
  width: number
  height: number
  speed: number
  angle: number
  color: string
  isPlayer?: boolean
}

interface Obstacle {
  x: number
  y: number
  width: number
  height: number
}

interface GameState {
  score: number
  time: number
  lap: number
  isGameOver: boolean
  isGameStarted: boolean
  playerCar: Car
  otherCars: Car[]
  obstacles: Obstacle[]
}

export function RacingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestAnimationRef = useRef<number>()
  const keysPressed = useRef<Set<string>>(new Set())
  const lastTimeRef = useRef<number>(0)
  const trackRef = useRef<HTMLImageElement | null>(null)

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    time: 0,
    lap: 0,
    isGameOver: false,
    isGameStarted: false,
    playerCar: {
      x: 0,
      y: 0,
      width: 30,
      height: 50,
      speed: 0,
      angle: 0,
      color: "#FF5252",
      isPlayer: true,
    },
    otherCars: [],
    obstacles: [],
  })

  // 初始化游戏
  const initGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 创建赛道图像
    if (!trackRef.current) {
      const trackImage = new Image()
      trackImage.src = "/placeholder.svg?height=800&width=800"
      trackImage.crossOrigin = "anonymous"
      trackRef.current = trackImage
    }

    // 初始化玩家车辆
    const playerCar = {
      x: canvas.width / 2,
      y: canvas.height - 100,
      width: 30,
      height: 50,
      speed: 0,
      angle: 0,
      color: "#FF5252",
      isPlayer: true,
    }

    // 初始化其他车辆
    const otherCars: Car[] = []
    for (let i = 0; i < 3; i++) {
      otherCars.push({
        x: canvas.width / 2 + (i - 1) * 40,
        y: canvas.height - 200 - i * 100,
        width: 30,
        height: 50,
        speed: 2 + Math.random(),
        angle: 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      })
    }

    // 初始化障碍物
    const obstacles: Obstacle[] = []
    for (let i = 0; i < 5; i++) {
      obstacles.push({
        x: Math.random() * (canvas.width - 20),
        y: Math.random() * (canvas.height - 300),
        width: 20 + Math.random() * 30,
        height: 20 + Math.random() * 30,
      })
    }

    setGameState({
      score: 0,
      time: 0,
      lap: 0,
      isGameOver: false,
      isGameStarted: true,
      playerCar,
      otherCars,
      obstacles,
    })
  }

  // 开始游戏
  const startGame = () => {
    initGame()
    lastTimeRef.current = performance.now()
    requestAnimationRef.current = requestAnimationFrame(gameLoop)
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame()
    lastTimeRef.current = performance.now()
    requestAnimationRef.current = requestAnimationFrame(gameLoop)
  }

  // 游戏循环
  const gameLoop = (timestamp: number) => {
    if (!canvasRef.current || gameState.isGameOver) return

    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    // 更新游戏状态
    updateGameState(deltaTime / 16) // 标准化为60fps

    // 绘制游戏
    drawGame()

    // 继续游戏循环
    requestAnimationRef.current = requestAnimationFrame(gameLoop)
  }

  // 更新游戏状态
  const updateGameState = (deltaTime: number) => {
    setGameState((prevState) => {
      if (!canvasRef.current) return prevState
      const canvas = canvasRef.current

      // 更新时间
      const newTime = prevState.time + deltaTime / 60 // 转换为秒

      // 复制状态
      let { playerCar, otherCars, obstacles, score, lap, isGameOver } = { ...prevState }
      const newPlayerCar = { ...playerCar }

      // 更新玩家车辆
      // 加速和减速
      if (keysPressed.current.has("ArrowUp") || keysPressed.current.has("w")) {
        newPlayerCar.speed = Math.min(newPlayerCar.speed + 0.1 * deltaTime, 5)
      } else if (keysPressed.current.has("ArrowDown") || keysPressed.current.has("s")) {
        newPlayerCar.speed = Math.max(newPlayerCar.speed - 0.2 * deltaTime, -2)
      } else {
        // 自然减速
        if (newPlayerCar.speed > 0) {
          newPlayerCar.speed = Math.max(newPlayerCar.speed - 0.05 * deltaTime, 0)
        } else if (newPlayerCar.speed < 0) {
          newPlayerCar.speed = Math.min(newPlayerCar.speed + 0.05 * deltaTime, 0)
        }
      }

      // 转向
      if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a")) {
        newPlayerCar.angle -= 0.05 * deltaTime * (newPlayerCar.speed / 2)
      }
      if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d")) {
        newPlayerCar.angle += 0.05 * deltaTime * (newPlayerCar.speed / 2)
      }

      // 更新位置
      newPlayerCar.x += Math.sin(newPlayerCar.angle) * newPlayerCar.speed * deltaTime
      newPlayerCar.y -= Math.cos(newPlayerCar.angle) * newPlayerCar.speed * deltaTime

      // 边界检查
      if (newPlayerCar.x < 0) newPlayerCar.x = 0
      if (newPlayerCar.x > canvas.width - newPlayerCar.width) newPlayerCar.x = canvas.width - newPlayerCar.width
      if (newPlayerCar.y < 0) newPlayerCar.y = 0
      if (newPlayerCar.y > canvas.height - newPlayerCar.height) newPlayerCar.y = canvas.height - newPlayerCar.height

      // 检查是否完成一圈
      if (
        newPlayerCar.y > canvas.height - 60 &&
        newPlayerCar.y < canvas.height - 40 &&
        Math.abs(newPlayerCar.x - canvas.width / 2) < 50
      ) {
        if (prevState.playerCar.y < canvas.height - 60) {
          lap += 1
          score += 100
        }
      }

      // 更新其他车辆
      const newOtherCars = otherCars.map((car) => {
        const newCar = { ...car }

        // 简单的AI行为
        if (Math.random() > 0.95) {
          newCar.angle += (Math.random() - 0.5) * 0.1
        }

        // 更新位置
        newCar.x += Math.sin(newCar.angle) * newCar.speed * deltaTime
        newCar.y -= Math.cos(newCar.angle) * newCar.speed * deltaTime

        // 边界检查和反弹
        if (newCar.x < 0 || newCar.x > canvas.width - newCar.width) {
          newCar.angle = -newCar.angle
        }
        if (newCar.y < 0 || newCar.y > canvas.height - newCar.height) {
          newCar.angle = Math.PI - newCar.angle
        }

        return newCar
      })

      // 检查碰撞
      // 与其他车辆碰撞
      for (const car of newOtherCars) {
        if (checkCollision(newPlayerCar, car)) {
          newPlayerCar.speed *= -0.5 // 反弹并减速
          isGameOver = true
        }
      }

      // 与障碍物碰撞
      for (const obstacle of obstacles) {
        if (checkCollision(newPlayerCar, obstacle)) {
          newPlayerCar.speed *= -0.5 // 反弹并减速
          isGameOver = true
        }
      }

      return {
        ...prevState,
        playerCar: newPlayerCar,
        otherCars: newOtherCars,
        score,
        time: newTime,
        lap,
        isGameOver,
      }
    })
  }

  // 检查碰撞
  const checkCollision = (
    obj1: { x: number; y: number; width: number; height: number },
    obj2: { x: number; y: number; width: number; height: number },
  ) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    )
  }

  // 绘制游戏
  const drawGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制赛道背景
    ctx.fillStyle = "#333333"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制赛道边界
    ctx.fillStyle = "#666666"
    ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100)

    // 绘制赛道
    ctx.fillStyle = "#444444"
    ctx.fillRect(100, 100, canvas.width - 200, canvas.height - 200)

    // 绘制起点/终点线
    ctx.fillStyle = "#FFFFFF"
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(canvas.width / 2 - 50 + i * 20, canvas.height - 50, 10, 10)
    }

    // 绘制障碍物
    ctx.fillStyle = "#8B4513" // 棕色
    gameState.obstacles.forEach((obstacle) => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    })

    // 绘制其他车辆
    gameState.otherCars.forEach((car) => {
      drawCar(ctx, car)
    })

    // 绘制玩家车辆
    drawCar(ctx, gameState.playerCar)

    // 绘制UI信息
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "16px Arial"
    ctx.fillText(`圈数: ${gameState.lap}`, 10, 30)
    ctx.fillText(`时间: ${gameState.time.toFixed(1)}秒`, 10, 50)
    ctx.fillText(`分数: ${gameState.score}`, 10, 70)
  }

  // 绘制车辆
  const drawCar = (ctx: CanvasRenderingContext2D, car: Car) => {
    ctx.save()

    // 移动到车辆中心
    ctx.translate(car.x + car.width / 2, car.y + car.height / 2)

    // 旋转
    ctx.rotate(car.angle)

    // 绘制车身
    ctx.fillStyle = car.color
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height)

    // 绘制车窗
    ctx.fillStyle = "#333333"
    ctx.fillRect(-car.width / 2 + 5, -car.height / 2 + 5, car.width - 10, 10)

    // 恢复画布状态
    ctx.restore()
  }

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key)

      // 防止方向键滚动页面
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key) &&
        gameState.isGameStarted &&
        !gameState.isGameOver
      ) {
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState.isGameStarted, gameState.isGameOver])

  // 组件挂载和卸载时的处理
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth
        canvasRef.current.height = canvasRef.current.offsetHeight
        drawGame()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current)
      }
    }
  }, [])

  // 当游戏状态变化时重新绘制游戏
  useEffect(() => {
    drawGame()
  }, [gameState])

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-lg font-bold">圈数: {gameState.lap}</div>
        <div className="text-lg font-bold">时间: {gameState.time.toFixed(1)}秒</div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">赛车竞速</h3>
            <p className="text-center mb-4">
              使用方向键或WASD控制赛车。上/W加速，下/S减速，左右/AD转向。尽可能多跑几圈并避免碰撞！
            </p>
            <Button onClick={startGame}>开始游戏</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-2">最终得分: {gameState.score}</p>
            <p className="text-lg mb-4">完成圈数: {gameState.lap}</p>
            <Button onClick={restartGame}>再玩一次</Button>
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full border rounded-md" tabIndex={0} />
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 使用方向键或WASD控制赛车。上/W加速，下/S减速，左右/AD转向。尽可能多跑几圈并避免碰撞！</p>
      </div>
    </div>
  )
}
