"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface Bird {
  x: number
  y: number
  width: number
  height: number
  velocity: number
  gravity: number
  lift: number
  rotation: number
}

interface Pipe {
  x: number
  topHeight: number
  bottomY: number
  width: number
  gap: number
  counted: boolean
}

interface GameState {
  score: number
  highScore: number
  isGameOver: boolean
  isGameStarted: boolean
  bird: Bird
  pipes: Pipe[]
}

export function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestAnimationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const birdImageRef = useRef<HTMLImageElement | null>(null)
  const pipeImageRef = useRef<HTMLImageElement | null>(null)
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: 0,
    isGameOver: false,
    isGameStarted: false,
    bird: {
      x: 0,
      y: 0,
      width: 34,
      height: 24,
      velocity: 0,
      gravity: 0.5,
      lift: -8,
      rotation: 0,
    },
    pipes: [],
  })

  // 初始化游戏
  const initGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 初始化鸟的位置
    const bird = {
      x: canvas.width / 4,
      y: canvas.height / 2,
      width: 34,
      height: 24,
      velocity: 0,
      gravity: 0.5,
      lift: -8,
      rotation: 0,
    }

    // 初始化管道
    const pipes: Pipe[] = []

    setGameState({
      score: 0,
      highScore: gameState.highScore,
      isGameOver: false,
      isGameStarted: true,
      bird,
      pipes,
    })

    // 加载图像
    if (!birdImageRef.current) {
      const birdImage = new Image()
      birdImage.src = "/placeholder.svg?height=24&width=34"
      birdImage.crossOrigin = "anonymous"
      birdImageRef.current = birdImage
    }

    if (!pipeImageRef.current) {
      const pipeImage = new Image()
      pipeImage.src = "/placeholder.svg?height=400&width=52"
      pipeImage.crossOrigin = "anonymous"
      pipeImageRef.current = pipeImage
    }

    if (!backgroundImageRef.current) {
      const bgImage = new Image()
      bgImage.src = "/placeholder.svg?height=400&width=800"
      bgImage.crossOrigin = "anonymous"
      backgroundImageRef.current = bgImage
    }
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
    updateGameState(deltaTime / 16, timestamp) // 标准化为60fps

    // 绘制游戏
    drawGame()

    // 继续游戏循环
    requestAnimationRef.current = requestAnimationFrame(gameLoop)
  }

  // 更新游戏状态
  const updateGameState = (deltaTime: number, timestamp: number) => {
    setGameState((prevState) => {
      if (!canvasRef.current) return prevState
      const canvas = canvasRef.current

      // 复制状态
      const newState = { ...prevState }
      const newBird = { ...newState.bird }
      let newPipes = [...newState.pipes]
      let { score, isGameOver } = newState

      // 更新鸟的位置和速度
      newBird.velocity += newBird.gravity * deltaTime
      newBird.y += newBird.velocity * deltaTime

      // 计算鸟的旋转角度
      newBird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, newBird.velocity * 0.1))

      // 检查鸟是否碰到地面或天花板
      if (newBird.y > canvas.height - newBird.height || newBird.y < 0) {
        isGameOver = true
      }

      // 每120帧添加一个新管道
      if (timestamp % 120 === 0 || newPipes.length === 0) {
        const pipeGap = 120
        const minHeight = 50
        const maxHeight = canvas.height - pipeGap - minHeight
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight

        newPipes.push({
          x: canvas.width,
          topHeight,
          bottomY: topHeight + pipeGap,
          width: 52,
          gap: pipeGap,
          counted: false,
        })
      }

      // 更新管道位置
      newPipes = newPipes
        .map((pipe) => {
          const newPipe = { ...pipe }
          newPipe.x -= 2 * deltaTime

          // 检查鸟是否通过管道
          if (!newPipe.counted && newPipe.x + newPipe.width < newBird.x) {
            newPipe.counted = true
            score += 1
          }

          return newPipe
        })
        .filter((pipe) => pipe.x + pipe.width > 0)

      // 检查碰撞
      for (const pipe of newPipes) {
        if (checkCollision(newBird, pipe)) {
          isGameOver = true
          break
        }
      }

      // 更新最高分
      const highScore = isGameOver && score > prevState.highScore ? score : prevState.highScore

      return {
        ...prevState,
        bird: newBird,
        pipes: newPipes,
        score,
        highScore,
        isGameOver,
      }
    })
  }

  // 检查碰撞
  const checkCollision = (bird: Bird, pipe: Pipe) => {
    // 检查鸟是否与上管道碰撞
    if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width && bird.y < pipe.topHeight) {
      return true
    }

    // 检查鸟是否与下管道碰撞
    if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width && bird.y + bird.height > pipe.bottomY) {
      return true
    }

    return false
  }

  // 鸟飞翔
  const flap = () => {
    if (gameState.isGameOver) return

    setGameState((prevState) => {
      const newBird = { ...prevState.bird }
      newBird.velocity = newBird.lift

      return {
        ...prevState,
        bird: newBird,
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
    ctx.fillStyle = "#70c5ce"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (backgroundImageRef.current) {
      // 绘制背景图像
      ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height)
    }

    // 绘制管道
    ctx.fillStyle = "#73bf2e"
    gameState.pipes.forEach((pipe) => {
      // 上管道
      if (pipeImageRef.current) {
        ctx.save()
        ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight / 2)
        ctx.rotate(Math.PI)
        ctx.translate(-(pipe.x + pipe.width / 2), -(pipe.topHeight / 2))
        ctx.drawImage(pipeImageRef.current, pipe.x, 0, pipe.width, pipe.topHeight)
        ctx.restore()
      } else {
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight)
      }

      // 下管道
      if (pipeImageRef.current) {
        ctx.drawImage(pipeImageRef.current, pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY)
      } else {
        ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY)
      }
    })

    // 绘制地面
    ctx.fillStyle = "#ded895"
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20)

    // 绘制鸟
    ctx.save()
    ctx.translate(gameState.bird.x + gameState.bird.width / 2, gameState.bird.y + gameState.bird.height / 2)
    ctx.rotate(gameState.bird.rotation)
    ctx.translate(-(gameState.bird.x + gameState.bird.width / 2), -(gameState.bird.y + gameState.bird.height / 2))

    if (birdImageRef.current) {
      ctx.drawImage(
        birdImageRef.current,
        gameState.bird.x,
        gameState.bird.y,
        gameState.bird.width,
        gameState.bird.height,
      )
    } else {
      ctx.fillStyle = "#f8e71c"
      ctx.fillRect(gameState.bird.x, gameState.bird.y, gameState.bird.width, gameState.bird.height)

      // 绘制眼睛
      ctx.fillStyle = "#000"
      ctx.beginPath()
      ctx.arc(gameState.bird.x + gameState.bird.width - 5, gameState.bird.y + 8, 3, 0, Math.PI * 2)
      ctx.fill()

      // 绘制嘴巴
      ctx.fillStyle = "#ff6b6b"
      ctx.beginPath()
      ctx.moveTo(gameState.bird.x + gameState.bird.width, gameState.bird.y + 12)
      ctx.lineTo(gameState.bird.x + gameState.bird.width + 5, gameState.bird.y + 10)
      ctx.lineTo(gameState.bird.x + gameState.bird.width, gameState.bird.y + 15)
      ctx.fill()
    }

    ctx.restore()

    // 绘制分数
    ctx.fillStyle = "#fff"
    ctx.font = "bold 32px Arial"
    ctx.textAlign = "center"
    ctx.fillText(gameState.score.toString(), canvas.width / 2, 50)
  }

  // 键盘和点击事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "ArrowUp") && gameState.isGameStarted && !gameState.isGameOver) {
        e.preventDefault()
        flap()
      }
    }

    const handleClick = () => {
      if (gameState.isGameStarted && !gameState.isGameOver) {
        flap()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    if (canvasRef.current) {
      canvasRef.current.addEventListener("click", handleClick)
      canvasRef.current.addEventListener("touchstart", handleClick)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("click", handleClick)
        canvasRef.current.removeEventListener("touchstart", handleClick)
      }
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
        <div className="text-lg font-bold">最高分: {gameState.highScore}</div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">Flappy Bird</h3>
            <p className="text-center mb-4">点击屏幕或按空格键/上方向键让小鸟飞翔。穿过管道之间的缝隙，获得高分！</p>
            <Button onClick={startGame}>开始游戏</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-2">得分: {gameState.score}</p>
            <p className="text-lg mb-4">最高分: {gameState.highScore}</p>
            <Button onClick={restartGame}>再玩一次</Button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full border rounded-md cursor-pointer"
          tabIndex={0}
          onClick={() => {
            if (!gameState.isGameStarted && !gameState.isGameOver) {
              startGame()
            }
          }}
        />
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 点击屏幕或按空格键/上方向键让小鸟飞翔。穿过管道之间的缝隙，获得高分！</p>
      </div>
    </div>
  )
}
