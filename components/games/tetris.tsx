"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Music } from "lucide-react"

// 定义颜色CSS变量
const COLORS = {
  "cyan-500": "#06b6d4",
  "blue-500": "#3b82f6",
  "orange-500": "#f97316",
  "yellow-500": "#eab308",
  "green-500": "#22c55e",
  "purple-500": "#a855f7",
  "red-500": "#ef4444",
}

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "cyan-500" },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "blue-500",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "orange-500",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "yellow-500",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "green-500",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "purple-500",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "red-500",
  },
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_DROP_TIME = 800
const SPEED_INCREASE_FACTOR = 0.95

const createEmptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))

const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS)
  const randKey = keys[Math.floor(Math.random() * keys.length)]
  return TETROMINOS[randKey]
}

export function TetrisGame() {
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [dropTime, setDropTime] = useState(INITIAL_DROP_TIME)
  const [level, setLevel] = useState(1)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [completedRows, setCompletedRows] = useState([])
  const audioRef = useRef(null)
  const dropInterval = useRef(null)

  const checkCollision = (x, y, shape) => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const newX = x + col
          const newY = y + row
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && board[newY][newX] !== 0)) {
            return true
          }
        }
      }
    }
    return false
  }

  const isValidMove = (x, y, shape) => !checkCollision(x, y, shape)

  const moveLeft = useCallback(() => {
    if (currentPiece && isValidMove(currentPiece.x - 1, currentPiece.y, currentPiece.tetromino.shape)) {
      setCurrentPiece((prev) => ({ ...prev, x: prev.x - 1 }))
    }
  }, [currentPiece, board])

  const moveRight = useCallback(() => {
    if (currentPiece && isValidMove(currentPiece.x + 1, currentPiece.y, currentPiece.tetromino.shape)) {
      setCurrentPiece((prev) => ({ ...prev, x: prev.x + 1 }))
    }
  }, [currentPiece, board])

  const moveDown = useCallback(() => {
    if (!currentPiece) return
    if (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.tetromino.shape)) {
      setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }))
    } else {
      placePiece()
    }
  }, [currentPiece, board])

  const rotate = useCallback(() => {
    if (!currentPiece) return
    const rotated = currentPiece.tetromino.shape[0].map((_, i) =>
      currentPiece.tetromino.shape.map((row) => row[i]).reverse(),
    )
    let newX = currentPiece.x
    let newY = currentPiece.y

    // Try to rotate, if not possible, try to adjust position
    if (!isValidMove(newX, newY, rotated)) {
      // Try to move left
      if (isValidMove(newX - 1, newY, rotated)) {
        newX -= 1
      }
      // Try to move right
      else if (isValidMove(newX + 1, newY, rotated)) {
        newX += 1
      }
      // Try to move up
      else if (isValidMove(newX, newY - 1, rotated)) {
        newY -= 1
      }
      // If still not possible, don't rotate
      else {
        return
      }
    }

    setCurrentPiece((prev) => ({
      ...prev,
      x: newX,
      y: newY,
      tetromino: { ...prev.tetromino, shape: rotated },
    }))

    // Continue falling after rotation
    if (isValidMove(newX, newY + 1, rotated) && newY + 1 < BOARD_HEIGHT) {
      setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }))
    }
  }, [currentPiece, board])

  const placePiece = useCallback(() => {
    if (!currentPiece) return
    const newBoard = board.map((row) => [...row])
    currentPiece.tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = y + currentPiece.y
          const boardX = x + currentPiece.x
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.tetromino.color
          }
        }
      })
    })
    setBoard(newBoard)
    clearLines(newBoard)
    spawnNewPiece()
  }, [currentPiece, board])

  const clearLines = useCallback(
    (newBoard) => {
      const linesCleared = []
      const updatedBoard = newBoard.filter((row, index) => {
        if (row.every((cell) => cell !== 0)) {
          linesCleared.push(index)
          return false
        }
        return true
      })

      if (linesCleared.length > 0) {
        setCompletedRows(linesCleared)
        setTimeout(() => {
          while (updatedBoard.length < BOARD_HEIGHT) {
            updatedBoard.unshift(Array(BOARD_WIDTH).fill(0))
          }
          setBoard(updatedBoard)
          setCompletedRows([])

          const newScore = score + linesCleared.length * 100
          setScore(newScore)

          if (Math.floor(newScore / 500) > level - 1) {
            setLevel((prev) => prev + 1)
            setDropTime((prev) => prev * SPEED_INCREASE_FACTOR)
          }
        }, 500)
      }
    },
    [score, level],
  )

  const spawnNewPiece = useCallback(() => {
    const newPiece = {
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0,
      tetromino: randomTetromino(),
    }
    if (checkCollision(newPiece.x, newPiece.y, newPiece.tetromino.shape)) {
      setGameOver(true)
    } else {
      setCurrentPiece(newPiece)
    }
  }, [board])

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      spawnNewPiece()
    }
  }, [currentPiece, gameOver, spawnNewPiece])

  useEffect(() => {
    if (!gameOver) {
      dropInterval.current = setInterval(moveDown, dropTime)
    }
    return () => clearInterval(dropInterval.current)
  }, [moveDown, gameOver, dropTime])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return
      switch (e.key) {
        case "ArrowLeft":
          moveLeft()
          break
        case "ArrowRight":
          moveRight()
          break
        case "ArrowDown":
          moveDown()
          break
        case "ArrowUp":
          rotate()
          break
        default:
          break
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [moveLeft, moveRight, moveDown, rotate, gameOver])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5
      audioRef.current.loop = true
      if (!gameOver && isMusicPlaying) {
        audioRef.current.play().catch((error) => console.error("Audio playback failed:", error))
      } else {
        audioRef.current.pause()
      }
    }
  }, [gameOver, isMusicPlaying])

  const resetGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(null)
    setScore(0)
    setGameOver(false)
    setDropTime(INITIAL_DROP_TIME)
    setLevel(1)
    setCompletedRows([])
    clearInterval(dropInterval.current)
  }

  const renderCell = (x, y) => {
    if (
      currentPiece &&
      currentPiece.tetromino.shape[y - currentPiece.y] &&
      currentPiece.tetromino.shape[y - currentPiece.y][x - currentPiece.x]
    ) {
      return currentPiece.tetromino.color
    }
    return board[y][x]
  }

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying)
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">分数: {score}</div>
        <div className="text-lg font-bold">等级: {level}</div>
        <Button variant="ghost" size="sm" onClick={toggleMusic} className="flex items-center">
          <Music className="w-4 h-4 mr-2" />
          {isMusicPlaying ? "关闭音乐" : "开启音乐"}
        </Button>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!currentPiece && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">俄罗斯方块</h3>
            <p className="text-center mb-4">使用方向键控制方块：左右移动，向上旋转，向下加速。消除完整的行获得分数！</p>
            <Button onClick={resetGame}>开始游戏</Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-4">最终得分: {score}</p>
            <Button onClick={resetGame}>再玩一次</Button>
          </div>
        )}

        <div className="flex justify-center items-center h-full">
          <div
            className="grid bg-gray-100 border border-gray-300 rounded-md shadow-md"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
              width: `${Math.min(BOARD_WIDTH * 20, 300)}px`,
              height: `${Math.min(BOARD_HEIGHT * 20, 400)}px`,
            }}
          >
            {board.map((row, y) =>
              row.map((_, x) => (
                <AnimatePresence key={`${y}-${x}`}>
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: completedRows.includes(y) ? 0 : 1,
                      scale: completedRows.includes(y) ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`${renderCell(x, y) ? "" : "bg-gray-100"}`}
                    style={{
                      border: "1px solid #e5e7eb",
                      backgroundColor: renderCell(x, y) ? COLORS[renderCell(x, y)] : "",
                    }}
                  />
                </AnimatePresence>
              )),
            )}
          </div>
        </div>

        {/* 移动设备控制按钮 */}
        <div className="md:hidden mt-4 grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
          <div></div>
          <Button variant="outline" onClick={rotate} className="w-full">
            上
          </Button>
          <div></div>
          <Button variant="outline" onClick={moveLeft} className="w-full">
            左
          </Button>
          <Button variant="outline" onClick={moveDown} className="w-full">
            下
          </Button>
          <Button variant="outline" onClick={moveRight} className="w-full">
            右
          </Button>
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 使用方向键控制方块：左右移动，向上旋转，向下加速。消除完整的行获得分数！</p>
      </div>
      <audio
        ref={audioRef}
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tetris-kxnh5j7hpNEcFspAndlU2huV5n6dvk.mp3"
      />
    </div>
  )
}
