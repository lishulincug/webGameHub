"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Clock, Trophy, RefreshCw } from "lucide-react"

// 迷宫单元格类型
const CELL_TYPES = {
  WALL: 0,
  PATH: 1,
  START: 2,
  END: 3,
  VISITED: 4,
  COIN: 5,
}

// 方向
const DIRECTIONS = [
  [0, -1], // 上
  [1, 0], // 右
  [0, 1], // 下
  [-1, 0], // 左
]

// 生成迷宫
const generateMaze = (width, height) => {
  // 创建全是墙的迷宫
  const maze = Array(height)
    .fill()
    .map(() => Array(width).fill(CELL_TYPES.WALL))

  // 确保宽高为奇数
  const w = width % 2 === 0 ? width - 1 : width
  const h = height % 2 === 0 ? height - 1 : height

  // 递归分割法生成迷宫
  const generatePath = (x, y) => {
    maze[y][x] = CELL_TYPES.PATH

    // 随机排序方向
    const directions = [...DIRECTIONS]
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[directions[i], directions[j]] = [directions[j], directions[i]]
    }

    // 尝试每个方向
    for (const [dx, dy] of directions) {
      const nx = x + dx * 2
      const ny = y + dy * 2

      if (nx >= 0 && nx < w && ny >= 0 && ny < h && maze[ny][nx] === CELL_TYPES.WALL) {
        maze[y + dy][x + dx] = CELL_TYPES.PATH
        generatePath(nx, ny)
      }
    }
  }

  // 从左上角开始生成
  generatePath(1, 1)

  // 设置起点和终点
  maze[1][1] = CELL_TYPES.START
  maze[h - 2][w - 2] = CELL_TYPES.END

  // 添加金币
  const coinCount = Math.floor((w * h) / 20)
  let coinsAdded = 0

  while (coinsAdded < coinCount) {
    const rx = Math.floor(Math.random() * (w - 2)) + 1
    const ry = Math.floor(Math.random() * (h - 2)) + 1

    if (maze[ry][rx] === CELL_TYPES.PATH) {
      maze[ry][rx] = CELL_TYPES.COIN
      coinsAdded++
    }
  }

  return maze
}

export function MazeGame() {
  const [maze, setMaze] = useState([])
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 })
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    isGameWon: false,
  })
  const [timer, setTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [coins, setCoins] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [difficulty, setDifficulty] = useState("medium")
  const [bestTimes, setBestTimes] = useState({
    easy: Number.POSITIVE_INFINITY,
    medium: Number.POSITIVE_INFINITY,
    hard: Number.POSITIVE_INFINITY,
  })

  const canvasRef = useRef(null)

  // 难度设置
  const DIFFICULTY_SETTINGS = {
    easy: { width: 15, height: 15 },
    medium: { width: 21, height: 21 },
    hard: { width: 31, height: 31 },
  }

  // 初始化游戏
  const initGame = useCallback(
    (selectedDifficulty) => {
      const { width, height } = DIFFICULTY_SETTINGS[selectedDifficulty]
      const newMaze = generateMaze(width, height)

      setMaze(newMaze)
      setPlayerPos({ x: 1, y: 1 })
      setGameState({
        isGameStarted: true,
        isGameOver: false,
        isGameWon: false,
      })
      setTimer(0)
      setDifficulty(selectedDifficulty)

      // 计算总金币数
      let coinCount = 0
      for (let y = 0; y < newMaze.length; y++) {
        for (let x = 0; x < newMaze[y].length; x++) {
          if (newMaze[y][x] === CELL_TYPES.COIN) {
            coinCount++
          }
        }
      }
      setTotalCoins(coinCount)
      setCoins(0)

      // 启动计时器
      if (timerInterval) clearInterval(timerInterval)
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
      setTimerInterval(interval)
    },
    [timerInterval],
  )

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameState.isGameStarted || gameState.isGameOver) return

      let dx = 0
      let dy = 0

      switch (e.key) {
        case "ArrowUp":
        case "w":
          dy = -1
          break
        case "ArrowRight":
        case "d":
          dx = 1
          break
        case "ArrowDown":
        case "s":
          dy = 1
          break
        case "ArrowLeft":
        case "a":
          dx = -1
          break
        default:
          return
      }

      const newX = playerPos.x + dx
      const newY = playerPos.y + dy

      // 检查是否可以移动
      if (newX >= 0 && newX < maze[0].length && newY >= 0 && newY < maze.length) {
        const cellType = maze[newY][newX]

        if (cellType !== CELL_TYPES.WALL) {
          // 移动玩家
          setPlayerPos({ x: newX, y: newY })

          // 更新迷宫状态
          const newMaze = [...maze]

          // 收集金币
          if (cellType === CELL_TYPES.COIN) {
            newMaze[newY][newX] = CELL_TYPES.PATH
            setCoins((prev) => prev + 1)
          }

          // 标记已访问的路径
          if (cellType === CELL_TYPES.PATH) {
            newMaze[newY][newX] = CELL_TYPES.VISITED
          }

          // 检查是否到达终点
          if (cellType === CELL_TYPES.END) {
            handleGameComplete()
          }

          setMaze(newMaze)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, maze, playerPos])

  // 处理游戏完成
  const handleGameComplete = () => {
    clearInterval(timerInterval)
    setGameState({
      ...gameState,
      isGameOver: true,
      isGameWon: true,
    })

    // 更新最佳时间
    setBestTimes((prev) => {
      const newBestTimes = { ...prev }
      if (timer < prev[difficulty]) {
        newBestTimes[difficulty] = timer
      }
      return newBestTimes
    })
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame(difficulty)
  }

  // 绘制迷宫
  useEffect(() => {
    if (!gameState.isGameStarted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const cellSize = Math.min((canvas.width - 2) / maze[0].length, (canvas.height - 2) / maze.length)

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制迷宫
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cellX = x * cellSize
        const cellY = y * cellSize

        switch (maze[y][x]) {
          case CELL_TYPES.WALL:
            ctx.fillStyle = "#1e293b"
            ctx.fillRect(cellX, cellY, cellSize, cellSize)
            break
          case CELL_TYPES.PATH:
            ctx.fillStyle = "#f8fafc"
            ctx.fillRect(cellX, cellY, cellSize, cellSize)
            break
          case CELL_TYPES.START:
            ctx.fillStyle = "#4ade80"
            ctx.fillRect(cellX, cellY, cellSize, cellSize)
            break
          case CELL_TYPES.END:
            ctx.fillStyle = "#f43f5e"
            ctx.fillRect(cellX, cellY, cellSize, cellSize)
            break
          case CELL_TYPES.VISITED:
            ctx.fillStyle = "#e2e8f0"
            ctx.fillRect(cellX, cellY, cellSize, cellSize)
            break
          case CELL_TYPES.COIN:
            ctx.fillStyle = "#f8fafc"
            ctx.fillRect(cellX, cellY, cellSize, cellSize)

            // 绘制金币
            ctx.fillStyle = "#eab308"
            ctx.beginPath()
            ctx.arc(cellX + cellSize / 2, cellY + cellSize / 2, cellSize / 3, 0, Math.PI * 2)
            ctx.fill()
            break
        }
      }
    }

    // 绘制玩家
    ctx.fillStyle = "#3b82f6"
    ctx.beginPath()
    ctx.arc(
      playerPos.x * cellSize + cellSize / 2,
      playerPos.y * cellSize + cellSize / 2,
      cellSize / 2.5,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }, [maze, playerPos, gameState.isGameStarted])

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [timerInterval])

  // 调整画布大小
  useEffect(() => {
    if (!canvasRef.current) return

    const resizeCanvas = () => {
      const canvas = canvasRef.current
      const container = canvas.parentElement

      const size = Math.min(container.clientWidth, container.clientHeight) - 20
      canvas.width = size
      canvas.height = size
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // 移动控制按钮处理
  const handleControlClick = (dx, dy) => {
    if (!gameState.isGameStarted || gameState.isGameOver) return

    const newX = playerPos.x + dx
    const newY = playerPos.y + dy

    // 检查是否可以移动
    if (newX >= 0 && newX < maze[0].length && newY >= 0 && newY < maze.length) {
      const cellType = maze[newY][newX]

      if (cellType !== CELL_TYPES.WALL) {
        // 移动玩家
        setPlayerPos({ x: newX, y: newY })

        // 更新迷宫状态
        const newMaze = [...maze]

        // 收集金币
        if (cellType === CELL_TYPES.COIN) {
          newMaze[newY][newX] = CELL_TYPES.PATH
          setCoins((prev) => prev + 1)
        }

        // 标记已访问的路径
        if (cellType === CELL_TYPES.PATH) {
          newMaze[newY][newX] = CELL_TYPES.VISITED
        }

        // 检查是否到达终点
        if (cellType === CELL_TYPES.END) {
          handleGameComplete()
        }

        setMaze(newMaze)
      }
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold flex items-center">
          <Clock className="w-5 h-5 mr-1" /> {formatTime(timer)}
        </div>
        <div className="text-lg font-bold">
          金币: {coins}/{totalCoins}
        </div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">迷宫探险</h3>
            <p className="text-center mb-4">在迷宫中找到出路，收集金币获得更高分数！</p>
            <div className="flex flex-col gap-2 mb-4">
              <p className="text-center font-medium">选择难度:</p>
              <div className="flex gap-2">
                <Button onClick={() => initGame("easy")}>简单</Button>
                <Button onClick={() => initGame("medium")}>中等</Button>
                <Button onClick={() => initGame("hard")}>困难</Button>
              </div>
            </div>
          </div>
        )}

        {gameState.isGameOver && gameState.isGameWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">恭喜！</h3>
            <p className="text-lg mb-1">你成功走出了迷宫！</p>
            <p className="mb-1">用时: {formatTime(timer)}</p>
            <p className="mb-4">
              收集金币: {coins}/{totalCoins}
            </p>

            {timer === bestTimes[difficulty] && (
              <div className="flex items-center text-yellow-500 mb-4">
                <Trophy className="w-5 h-5 mr-1" /> 新纪录！
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={restartGame}>再玩一次</Button>
              <Button variant="outline" onClick={() => setGameState({ isGameStarted: false, isGameOver: false })}>
                更换难度
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center h-full">
          {gameState.isGameStarted && (
            <div className="flex flex-col items-center">
              <canvas ref={canvasRef} className="border border-gray-300 rounded-md" />

              {/* 移动设备控制按钮 */}
              <div className="md:hidden mt-4 grid grid-cols-3 gap-2 w-full max-w-xs">
                <div></div>
                <Button variant="outline" onClick={() => handleControlClick(0, -1)}>
                  上
                </Button>
                <div></div>
                <Button variant="outline" onClick={() => handleControlClick(-1, 0)}>
                  左
                </Button>
                <Button variant="outline" onClick={() => handleControlClick(0, 1)}>
                  下
                </Button>
                <Button variant="outline" onClick={() => handleControlClick(1, 0)}>
                  右
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {gameState.isGameStarted && !gameState.isGameOver && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={restartGame}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 使用方向键或WASD移动角色，找到迷宫出口。收集金币可以获得更高分数！</p>
      </div>
    </div>
  )
}
