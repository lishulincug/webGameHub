"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface Platform {
  x: number
  y: number
  width: number
  hasCoin: boolean
  coinCollected: boolean
}

interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityY: number
  velocityX: number
  isJumping: boolean
  direction: "left" | "right" | "idle"
}

interface GameState {
  score: number
  isGameOver: boolean
  isGameStarted: boolean
  platforms: Platform[]
  player: Player
  highestPlatform: number
}

export function JumpAdventureGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestAnimationRef = useRef<number>()
  const keysPressed = useRef<Set<string>>(new Set())
  const lastTimeRef = useRef<number>(0)

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    isGameStarted: false,
    platforms: [],
    player: {
      x: 0,
      y: 0,
      width: 30,
      height: 30,
      velocityY: 0,
      velocityX: 0,
      isJumping: false,
      direction: "idle",
    },
    highestPlatform: 0,
  })

  // 初始化游戏
  const initGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 创建平台
    const platforms: Platform[] = []
    const platformCount = 10
    const platformWidth = 80

    // 起始平台
    platforms.push({
      x: canvas.width / 2 - platformWidth / 2,
      y: canvas.height - 50,
      width: platformWidth,
      hasCoin: false,
      coinCollected: false,
    })

    // 随机生成其他平台
    for (let i = 1; i < platformCount; i++) {
      const x = Math.random() * (canvas.width - platformWidth)
      const y = canvas.height - 100 - i * 80
      const hasCoin = Math.random() > 0.6

      platforms.push({
        x,
        y,
        width: platformWidth,
        hasCoin,
        coinCollected: false,
      })
    }

    // 初始化玩家
    const player = {
      x: canvas.width / 2 - 15,
      y: canvas.height - 80,
      width: 30,
      height: 30,
      velocityY: 0,
      velocityX: 0,
      isJumping: false,
      direction: "idle" as const,
    }

    setGameState({
      score: 0,
      isGameOver: false,
      isGameStarted: true,
      platforms,
      player,
      highestPlatform: 0,
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

      // 更新玩家位置和速度
      let { player, platforms, score, isGameOver, highestPlatform } = { ...prevState }
      const newPlayer = { ...player }

      // 水平移动
      newPlayer.velocityX = 0
      if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a")) {
        newPlayer.velocityX = -5 * deltaTime
        newPlayer.direction = "left"
      }
      if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d")) {
        newPlayer.velocityX = 5 * deltaTime
        newPlayer.direction = "right"
      }
      if (newPlayer.velocityX === 0) {
        newPlayer.direction = "idle"
      }

      // 跳跃
      if (
        (keysPressed.current.has("ArrowUp") || keysPressed.current.has("w") || keysPressed.current.has(" ")) &&
        !newPlayer.isJumping
      ) {
        newPlayer.velocityY = -12
        newPlayer.isJumping = true
      }

      // 应用重力
      newPlayer.velocityY += 0.5 * deltaTime

      // 更新玩家位置
      newPlayer.x += newPlayer.velocityX
      newPlayer.y += newPlayer.velocityY

      // 边界检查
      if (newPlayer.x < 0) newPlayer.x = 0
      if (newPlayer.x > canvas.width - newPlayer.width) newPlayer.x = canvas.width - newPlayer.width

      // 检查是否掉出屏幕底部
      if (newPlayer.y > canvas.height) {
        isGameOver = true
      }

      // 检查与平台的碰撞
      let isOnPlatform = false
      const newPlatforms = platforms.map((platform) => {
        const newPlatform = { ...platform }

        // 检查玩家是否站在平台上
        if (
          newPlayer.velocityY > 0 &&
          newPlayer.x + newPlayer.width > platform.x &&
          newPlayer.x < platform.x + platform.width &&
          newPlayer.y + newPlayer.height > platform.y &&
          newPlayer.y + newPlayer.height < platform.y + 10
        ) {
          newPlayer.y = platform.y - newPlayer.height
          newPlayer.velocityY = 0
          newPlayer.isJumping = false
          isOnPlatform = true

          // 收集金币
          if (platform.hasCoin && !platform.coinCollected) {
            newPlatform.coinCollected = true
            score += 10
          }

          // 更新最高平台
          const platformHeight = canvas.height - platform.y
          if (platformHeight > highestPlatform) {
            highestPlatform = platformHeight
            score = Math.max(score, Math.floor(highestPlatform / 10))
          }
        }

        return newPlatform
      })

      // 如果玩家达到屏幕一半高度，向下移动所有平台
      if (newPlayer.y < canvas.height / 2) {
        const offset = canvas.height / 2 - newPlayer.y
        newPlayer.y = canvas.height / 2

        const updatedPlatforms = newPlatforms.map((platform) => {
          const newPlatform = { ...platform }
          newPlatform.y += offset

          // 如果平台移出屏幕底部，重新生成在顶部
          if (newPlatform.y > canvas.height) {
            newPlatform.y = 0
            newPlatform.x = Math.random() * (canvas.width - newPlatform.width)
            newPlatform.hasCoin = Math.random() > 0.6
            newPlatform.coinCollected = false
            score += 5 // 奖励分数
          }

          return newPlatform
        })

        return {
          ...prevState,
          player: newPlayer,
          platforms: updatedPlatforms,
          score,
          isGameOver,
          highestPlatform,
        }
      }

      return {
        ...prevState,
        player: newPlayer,
        platforms: newPlatforms,
        score,
        isGameOver,
        highestPlatform,
      }
    })
  }

  // 绘制游戏
  const drawGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制背景
    ctx.fillStyle = "#e0f7fa"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制云朵
    ctx.fillStyle = "#ffffff"
    for (let i = 0; i < 5; i++) {
      const x = (i * canvas.width) / 5 + Math.sin(Date.now() / 10000 + i) * 30
      const y = 50 + i * 20
      drawCloud(ctx, x, y, 40 + i * 5)
    }

    // 绘制平台
    gameState.platforms.forEach((platform) => {
      // 平台
      ctx.fillStyle = "#4CAF50"
      ctx.fillRect(platform.x, platform.y, platform.width, 10)

      // 金币
      if (platform.hasCoin && !platform.coinCollected) {
        ctx.fillStyle = "#FFC107"
        ctx.beginPath()
        ctx.arc(platform.x + platform.width / 2, platform.y - 15, 7, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // 绘制玩家
    const player = gameState.player
    ctx.fillStyle = "#2196F3"

    // 绘制身体
    ctx.fillRect(player.x, player.y, player.width, player.height)

    // 绘制眼睛
    ctx.fillStyle = "#FFFFFF"
    if (player.direction === "left") {
      ctx.fillRect(player.x + 5, player.y + 8, 5, 5)
    } else if (player.direction === "right") {
      ctx.fillRect(player.x + player.width - 10, player.y + 8, 5, 5)
    } else {
      ctx.fillRect(player.x + 5, player.y + 8, 5, 5)
      ctx.fillRect(player.x + player.width - 10, player.y + 8, 5, 5)
    }

    // 绘制分数
    ctx.fillStyle = "#000000"
    ctx.font = "20px Arial"
    ctx.fillText(`分数: ${gameState.score}`, 10, 30)
  }

  // 绘制云朵
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.arc(x + size / 2, y - size / 4, size / 3, 0, Math.PI * 2)
    ctx.arc(x + size, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key)

      // 防止空格键滚动页面
      if (e.key === " " && gameState.isGameStarted && !gameState.isGameOver) {
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
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">跳跃冒险</h3>
            <p className="text-center mb-4">
              使用方向键或WASD移动角色，空格键或上方向键跳跃。收集金币并尽可能向上攀登！
            </p>
            <Button onClick={startGame}>开始游戏</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-4">最终得分: {gameState.score}</p>
            <Button onClick={restartGame}>再玩一次</Button>
          </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full border rounded-md" tabIndex={0} />
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 使用方向键或WASD移动角色，空格键或上方向键跳跃。收集金币并尽可能向上攀登！</p>
      </div>
    </div>
  )
}
