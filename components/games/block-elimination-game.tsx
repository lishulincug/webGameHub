"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"

interface Block {
  id: number
  x: number
  y: number
  color: string
  type: "normal" | "special" | "bomb"
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
}

interface FloatingScore {
  id: number
  x: number
  y: number
  score: number
  life: number
}

interface GameState {
  score: number
  level: number
  lines: number
  isGameOver: boolean
  isGameStarted: boolean
  combo: number
  targetScore: number
}

const COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"]
const GRID_WIDTH = 10
const GRID_HEIGHT = 20
const BLOCK_SIZE = 25

export function BlockEliminationGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    isGameStarted: false,
    combo: 0,
    targetScore: 1000,
  })

  const [blocks, setBlocks] = useState<Block[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([])
  const [selectedBlocks, setSelectedBlocks] = useState<number[]>([])

  const particleIdRef = useRef(0)
  const floatingScoreIdRef = useRef(0)

  // 初始化游戏
  const initializeGame = useCallback(() => {
    const newBlocks: Block[] = []
    let blockId = 0

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (Math.random() > 0.3) {
          const blockType = Math.random() > 0.95 ? "bomb" : Math.random() > 0.9 ? "special" : "normal"
          newBlocks.push({
            id: blockId++,
            x,
            y,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            type: blockType,
          })
        }
      }
    }

    setBlocks(newBlocks)
    setParticles([])
    setFloatingScores([])
    setSelectedBlocks([])
  }, [])

  // 创建粒子效果
  const createParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 2 + Math.random() * 3
      newParticles.push({
        id: particleIdRef.current++,
        x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
        y: y * BLOCK_SIZE + BLOCK_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 60,
        maxLife: 60,
      })
    }
    setParticles((prev) => [...prev, ...newParticles])
  }, [])

  // 创建浮动分数
  const createFloatingScore = useCallback((x: number, y: number, score: number) => {
    const newFloatingScore: FloatingScore = {
      id: floatingScoreIdRef.current++,
      x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
      y: y * BLOCK_SIZE + BLOCK_SIZE / 2,
      score,
      life: 60,
    }
    setFloatingScores((prev) => [...prev, newFloatingScore])
  }, [])

  // 查找相邻的相同颜色方块
  const findConnectedBlocks = useCallback((startBlock: Block, allBlocks: Block[]): Block[] => {
    const visited = new Set<number>()
    const connected: Block[] = []
    const queue = [startBlock]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.id)) continue

      visited.add(current.id)
      connected.push(current)

      // 查找相邻的相同颜色方块
      const neighbors = allBlocks.filter((block) => {
        if (visited.has(block.id) || block.color !== current.color) return false
        const dx = Math.abs(block.x - current.x)
        const dy = Math.abs(block.y - current.y)
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
      })

      queue.push(...neighbors)
    }

    return connected
  }, [])

  // 处理方块点击
  const handleBlockClick = useCallback(
    (clickedBlock: Block) => {
      if (!gameState.isGameStarted || gameState.isGameOver) return

      const connectedBlocks = findConnectedBlocks(clickedBlock, blocks)

      if (connectedBlocks.length >= 2) {
        // 创建粒子效果
        connectedBlocks.forEach((block) => {
          createParticles(block.x, block.y, block.color, block.type === "bomb" ? 12 : 8)
        })

        // 计算分数
        let baseScore = connectedBlocks.length * 10
        if (clickedBlock.type === "special") baseScore *= 2
        if (clickedBlock.type === "bomb") baseScore *= 3

        const comboMultiplier = Math.max(1, gameState.combo)
        const finalScore = baseScore * comboMultiplier

        // 创建浮动分数
        createFloatingScore(clickedBlock.x, clickedBlock.y, finalScore)

        // 更新游戏状态
        setGameState((prev) => ({
          ...prev,
          score: prev.score + finalScore,
          combo: prev.combo + 1,
          lines: prev.lines + Math.floor(connectedBlocks.length / 5),
        }))

        // 移除被消除的方块
        setBlocks((prev) => prev.filter((block) => !connectedBlocks.some((cb) => cb.id === block.id)))

        // 方块下落
        setTimeout(() => {
          setBlocks((prev) => {
            const newBlocks = [...prev]

            // 按列处理方块下落
            for (let x = 0; x < GRID_WIDTH; x++) {
              const columnBlocks = newBlocks.filter((block) => block.x === x).sort((a, b) => b.y - a.y)

              let newY = GRID_HEIGHT - 1
              columnBlocks.forEach((block) => {
                block.y = newY
                newY--
              })
            }

            return newBlocks
          })
        }, 100)
      } else {
        // 重置连击
        setGameState((prev) => ({ ...prev, combo: 0 }))
      }
    },
    [blocks, gameState, findConnectedBlocks, createParticles, createFloatingScore],
  )

  // 处理画布点击
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!gameState.isGameStarted || gameState.isGameOver) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = Math.floor((event.clientX - rect.left) / BLOCK_SIZE)
      const y = Math.floor((event.clientY - rect.top) / BLOCK_SIZE)

      const clickedBlock = blocks.find((block) => block.x === x && block.y === y)
      if (clickedBlock) {
        handleBlockClick(clickedBlock)
      }
    },
    [blocks, gameState, handleBlockClick],
  )

  // 更新粒子和浮动分数
  const updateEffects = useCallback(() => {
    setParticles((prev) =>
      prev
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // 重力
          life: particle.life - 1,
        }))
        .filter((particle) => particle.life > 0),
    )

    setFloatingScores((prev) =>
      prev
        .map((score) => ({
          ...score,
          y: score.y - 1,
          life: score.life - 1,
        }))
        .filter((score) => score.life > 0),
    )
  }, [])

  // 渲染游戏
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 清空画布
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制网格
    ctx.strokeStyle = "#16213e"
    ctx.lineWidth = 1
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * BLOCK_SIZE, 0)
      ctx.lineTo(x * BLOCK_SIZE, GRID_HEIGHT * BLOCK_SIZE)
      ctx.stroke()
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * BLOCK_SIZE)
      ctx.lineTo(GRID_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE)
      ctx.stroke()
    }

    // 绘制方块
    blocks.forEach((block) => {
      const x = block.x * BLOCK_SIZE
      const y = block.y * BLOCK_SIZE

      // 方块主体
      ctx.fillStyle = block.color
      ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)

      // 方块边框
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1
      ctx.strokeRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2)

      // 特殊方块标记
      if (block.type === "special") {
        ctx.fillStyle = "#ffffff"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillText("★", x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2 + 4)
      } else if (block.type === "bomb") {
        ctx.fillStyle = "#ffffff"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillText("💣", x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2 + 4)
      }
    })

    // 绘制粒子
    particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife
      ctx.fillStyle =
        particle.color +
        Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0")
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, 3 * alpha, 0, Math.PI * 2)
      ctx.fill()
    })

    // 绘制浮动分数
    floatingScores.forEach((score) => {
      const alpha = score.life / 60
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.font = "bold 16px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`+${score.score}`, score.x, score.y)
    })

    // 绘制连击提示
    if (gameState.combo > 1) {
      ctx.fillStyle = "#ff6b6b"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`连击 x${gameState.combo}!`, canvas.width / 2, 30)
    }
  }, [blocks, particles, floatingScores, gameState.combo])

  // 游戏循环
  const gameLoop = useCallback(() => {
    updateEffects()
    render()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateEffects, render])

  // 开始游戏
  const startGame = () => {
    setGameState({
      score: 0,
      level: 1,
      lines: 0,
      isGameOver: false,
      isGameStarted: true,
      combo: 0,
      targetScore: 1000,
    })
    initializeGame()
  }

  // 重新开始游戏
  const restartGame = () => {
    startGame()
  }

  // 检查游戏结束
  useEffect(() => {
    if (gameState.isGameStarted && !gameState.isGameOver) {
      // 检查是否还有可消除的方块
      const hasValidMoves = blocks.some((block) => {
        const connected = findConnectedBlocks(block, blocks)
        return connected.length >= 2
      })

      if (!hasValidMoves && blocks.length > 0) {
        setGameState((prev) => ({ ...prev, isGameOver: true }))
      }

      // 检查是否达到目标分数
      if (gameState.score >= gameState.targetScore) {
        setGameState((prev) => ({
          ...prev,
          level: prev.level + 1,
          targetScore: prev.targetScore * 2,
        }))
        // 添加新方块
        setTimeout(() => {
          const newBlocks: Block[] = []
          let blockId = Math.max(...blocks.map((b) => b.id), 0) + 1

          for (let y = 0; y < 3; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
              if (Math.random() > 0.5) {
                const blockType = Math.random() > 0.95 ? "bomb" : Math.random() > 0.9 ? "special" : "normal"
                newBlocks.push({
                  id: blockId++,
                  x,
                  y,
                  color: COLORS[Math.floor(Math.random() * COLORS.length)],
                  type: blockType,
                })
              }
            }
          }

          setBlocks((prev) => {
            const shiftedBlocks = prev.map((block) => ({ ...block, y: block.y + 3 }))
            return [...newBlocks, ...shiftedBlocks]
          })
        }, 500)
      }
    }
  }, [gameState, blocks, findConnectedBlocks])

  // 启动游戏循环
  useEffect(() => {
    if (gameState.isGameStarted) {
      gameLoop()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.isGameStarted, gameLoop])

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-lg font-bold">等级: {gameState.level}</div>
        <div className="text-lg font-bold">目标: {gameState.targetScore}</div>
      </div>

      <div className="relative">
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">方块消除</h3>
            <p className="text-center mb-4">点击相邻的相同颜色方块来消除它们！</p>
            <p className="text-center mb-4 text-sm text-muted-foreground">★ 特殊方块得分翻倍，💣 炸弹方块得分三倍！</p>
            <Button onClick={startGame}>开始游戏</Button>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-2">最终得分: {gameState.score}</p>
            <p className="text-lg mb-4">达到等级: {gameState.level}</p>
            <Button onClick={restartGame}>再玩一次</Button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={GRID_WIDTH * BLOCK_SIZE}
          height={GRID_HEIGHT * BLOCK_SIZE}
          className="border border-gray-300 cursor-pointer"
          onClick={handleCanvasClick}
        />
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>点击相邻的相同颜色方块来消除它们，连击可以获得更高分数！</p>
      </div>
    </div>
  )
}
