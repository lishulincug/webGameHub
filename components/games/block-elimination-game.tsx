"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface Block {
  x: number
  y: number
  color: string
  width: number
  height: number
  isVisible: boolean
}

interface GameState {
  score: number
  timeLeft: number
  isGameOver: boolean
  isGameStarted: boolean
}

const COLORS = ["#FF5252", "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#00BCD4"]
const BLOCK_WIDTH = 50
const BLOCK_HEIGHT = 50
const GAME_DURATION = 60 // 游戏时长（秒）

export function BlockEliminationGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: GAME_DURATION,
    isGameOver: false,
    isGameStarted: false,
  })
  const requestAnimationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // 初始化游戏
  const initGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 设置画布大小
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 创建方块
    const newBlocks: Block[] = []
    const cols = Math.floor(canvas.width / BLOCK_WIDTH)
    const rows = Math.floor(canvas.height / BLOCK_HEIGHT)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        newBlocks.push({
          x: x * BLOCK_WIDTH,
          y: y * BLOCK_HEIGHT,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          width: BLOCK_WIDTH,
          height: BLOCK_HEIGHT,
          isVisible: true,
        })
      }
    }

    setBlocks(newBlocks)
    setGameState({
      score: 0,
      timeLeft: GAME_DURATION,
      isGameOver: false,
      isGameStarted: true,
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
    if (!canvasRef.current) return

    const deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    // 更新游戏时间
    if (gameState.isGameStarted && !gameState.isGameOver) {
      setGameState((prev) => {
        const newTimeLeft = Math.max(0, prev.timeLeft - deltaTime / 1000)
        return {
          ...prev,
          timeLeft: newTimeLeft,
          isGameOver: newTimeLeft <= 0,
        }
      })
    }

    // 绘制游戏
    drawGame()

    // 继续游戏循环
    if (!gameState.isGameOver) {
      requestAnimationRef.current = requestAnimationFrame(gameLoop)
    }
  }

  // 绘制游戏
  const drawGame = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制方块
    blocks.forEach((block) => {
      if (block.isVisible) {
        ctx.fillStyle = block.color
        ctx.fillRect(block.x, block.y, block.width, block.height)
        ctx.strokeStyle = "#FFF"
        ctx.lineWidth = 2
        ctx.strokeRect(block.x, block.y, block.width, block.height)
      }
    })
  }

  // 处理点击事件
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState.isGameOver || !gameState.isGameStarted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 查找点击的方块
    const clickedBlockIndex = blocks.findIndex(
      (block) =>
        block.isVisible && x >= block.x && x <= block.x + block.width && y >= block.y && y <= block.y + block.height,
    )

    if (clickedBlockIndex !== -1) {
      const clickedBlock = blocks[clickedBlockIndex]
      const color = clickedBlock.color

      // 查找相邻的相同颜色方块
      const connectedBlocks = findConnectedBlocks(clickedBlockIndex, color)

      // 如果有连接的方块（至少2个），则消除它们
      if (connectedBlocks.length >= 2) {
        const newBlocks = [...blocks]
        connectedBlocks.forEach((index) => {
          newBlocks[index] = { ...newBlocks[index], isVisible: false }
        })
        setBlocks(newBlocks)

        // 更新分数
        setGameState((prev) => ({
          ...prev,
          score: prev.score + connectedBlocks.length * 10,
        }))
      }
    }
  }

  // 查找相连的相同颜色方块
  const findConnectedBlocks = (startIndex: number, color: string): number[] => {
    const canvas = canvasRef.current
    if (!canvas) return []

    const cols = Math.floor(canvas.width / BLOCK_WIDTH)
    const visited: boolean[] = Array(blocks.length).fill(false)
    const connected: number[] = []

    const dfs = (index: number) => {
      if (
        index < 0 ||
        index >= blocks.length ||
        visited[index] ||
        !blocks[index].isVisible ||
        blocks[index].color !== color
      ) {
        return
      }

      visited[index] = true
      connected.push(index)

      const row = Math.floor(index / cols)
      const col = index % cols

      // 检查上下左右四个方向
      if (row > 0) dfs(index - cols) // 上
      if (row < Math.floor(blocks.length / cols) - 1) dfs(index + cols) // 下
      if (col > 0) dfs(index - 1) // 左
      if (col < cols - 1) dfs(index + 1) // 右
    }

    dfs(startIndex)
    return connected
  }

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

  // 当blocks或gameState变化时重新绘制游戏
  useEffect(() => {
    drawGame()
  }, [blocks, gameState])

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {gameState.score}</div>
        <div className="text-lg font-bold">时间: {Math.ceil(gameState.timeLeft)}秒</div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">方块消除</h3>
            <p className="text-center mb-4">点击相邻的相同颜色方块来消除它们，获得分数！</p>
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

        <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full border rounded-md" />
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 点击相邻的相同颜色方块来消除它们。消除的方块越多，得分越高。</p>
      </div>
    </div>
  )
}
