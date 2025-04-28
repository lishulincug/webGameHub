"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  speed: number
  isActive: boolean
}

interface Player extends GameObject {
  lives: number
}

interface Enemy extends GameObject {
  color: string
}

interface Bullet extends GameObject {}

interface GameState {
  score: number
  isGameOver: boolean
  isGameStarted: boolean
}

export function PlaneShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [player, setPlayer] = useState<Player>({
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 5,
    isActive: true,
    lives: 3,
  })
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    isGameStarted: false,
  })
  const requestAnimationRef = useRef<number>()
  const lastEnemySpawnRef = useRef<number>(0)
  const keysPressed = useRef<Set<string>>(new Set())

  // 初始化游戏
  const initGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 初始化玩家位置
    setPlayer({
      x: canvas.width / 2 - 20,
      y: canvas.height - 60,
      width: 40,
      height: 40,
      speed: 5,
      isActive: true,
      lives: 3,
    })

    // 清空敌人和子弹
    setEnemies([])
    setBullets([])

    // 重置游戏状态
    setGameState({
      score: 0,
      isGameOver: false,
      isGameStarted: true,
    })
  }

  // 开始游戏
  const startGame = () => {
    initGame()
    requestAnimationRef.current = requestAnimationFrame(gameLoop)
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame()
    requestAnimationRef.current = requestAnimationFrame(gameLoop)
  }

  // 游戏循环
  const gameLoop = (timestamp: number) => {
    if (!canvasRef.current || gameState.isGameOver) return

    // 生成敌人
    if (timestamp - lastEnemySpawnRef.current > 1000) {
      spawnEnemy()
      lastEnemySpawnRef.current = timestamp
    }

    // 更新游戏状态
    updateGameState()

    // 绘制游戏
    drawGame()

    // 继续游戏循环
    requestAnimationRef.current = requestAnimationFrame(gameLoop)
  }

  // 生成敌人
  const spawnEnemy = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const enemyWidth = 30
    const enemyHeight = 30
    const x = Math.random() * (canvas.width - enemyWidth)

    const newEnemy: Enemy = {
      x,
      y: -enemyHeight,
      width: enemyWidth,
      height: enemyHeight,
      speed: 2 + Math.random() * 2,
      isActive: true,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    }

    setEnemies((prev) => [...prev, newEnemy])
  }

  // 发射子弹
  const fireBullet = () => {
    if (!player.isActive) return

    const newBullet: Bullet = {
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 7,
      isActive: true,
    }

    setBullets((prev) => [...prev, newBullet])
  }

  // 更新游戏状态
  const updateGameState = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // 更新玩家位置
    let newPlayerX = player.x
    let newPlayerY = player.y

    if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a")) {
      newPlayerX = Math.max(0, player.x - player.speed)
    }
    if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d")) {
      newPlayerX = Math.min(canvas.width - player.width, player.x + player.speed)
    }
    if (keysPressed.current.has("ArrowUp") || keysPressed.current.has("w")) {
      newPlayerY = Math.max(0, player.y - player.speed)
    }
    if (keysPressed.current.has("ArrowDown") || keysPressed.current.has("s")) {
      newPlayerY = Math.min(canvas.height - player.height, player.y + player.speed)
    }
    if (keysPressed.current.has(" ")) {
      // 限制射击频率
      if (Math.random() > 0.7) {
        fireBullet()
      }
    }

    setPlayer((prev) => ({ ...prev, x: newPlayerX, y: newPlayerY }))

    // 更新子弹位置
    setBullets((prev) =>
      prev
        .map((bullet) => ({
          ...bullet,
          y: bullet.y - bullet.speed,
          isActive: bullet.y > -bullet.height,
        }))
        .filter((bullet) => bullet.isActive),
    )

    // 更新敌人位置
    setEnemies((prev) =>
      prev
        .map((enemy) => ({
          ...enemy,
          y: enemy.y + enemy.speed,
          isActive: enemy.y < canvas.height,
        }))
        .filter((enemy) => enemy.isActive),
    )

    // 检测碰撞
    checkCollisions()
  }

  // 检测碰撞
  const checkCollisions = () => {
    // 子弹与敌人碰撞
    const newBullets = [...bullets]
    const newEnemies = [...enemies]
    let scoreIncrement = 0

    for (let i = 0; i < newBullets.length; i++) {
      const bullet = newBullets[i]
      if (!bullet.isActive) continue

      for (let j = 0; j < newEnemies.length; j++) {
        const enemy = newEnemies[j]
        if (!enemy.isActive) continue

        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          // 碰撞发生
          bullet.isActive = false
          enemy.isActive = false
          scoreIncrement += 10
          break
        }
      }
    }

    // 敌人与玩家碰撞
    let playerHit = false
    for (let i = 0; i < newEnemies.length; i++) {
      const enemy = newEnemies[i]
      if (!enemy.isActive) continue

      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        // 碰撞发生
        enemy.isActive = false
        playerHit = true
      }
    }

    if (playerHit) {
      setPlayer((prev) => {
        const newLives = prev.lives - 1
        if (newLives <= 0) {
          setGameState((gs) => ({ ...gs, isGameOver: true }))
        }
        return { ...prev, lives: newLives }
      })
    }

    // 更新分数
    if (scoreIncrement > 0) {
      setGameState((prev) => ({ ...prev, score: prev.score + scoreIncrement }))
    }

    // 更新游戏对象
    setBullets(newBullets.filter((bullet) => bullet.isActive))
    setEnemies(newEnemies.filter((enemy) => enemy.isActive))
  }

  // 绘制游戏
  const drawGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制玩家
    if (player.isActive) {
      ctx.fillStyle = "#4CAF50"
      ctx.beginPath()
      ctx.moveTo(player.x + player.width / 2, player.y)
      ctx.lineTo(player.x, player.y + player.height)
      ctx.lineTo(player.x + player.width, player.y + player.height)
      ctx.closePath()
      ctx.fill()
    }

    // 绘制敌人
    enemies.forEach((enemy) => {
      if (enemy.isActive) {
        ctx.fillStyle = enemy.color
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
      }
    })

    // 绘制子弹
    ctx.fillStyle = "#FFC107"
    bullets.forEach((bullet) => {
      if (bullet.isActive) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
      }
    })
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
  }, [player, enemies, bullets, gameState])

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-lg font-bold">生命: {player.lives}</div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">飞机大战</h3>
            <p className="text-center mb-4">使用方向键移动飞机，空格键发射子弹，击落敌机获得分数！</p>
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
        <p>游戏说明: 使用方向键或WASD移动飞机，空格键发射子弹。击落敌机获得分数，避免与敌机相撞。</p>
      </div>
    </div>
  )
}
