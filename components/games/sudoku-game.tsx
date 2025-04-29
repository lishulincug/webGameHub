"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Clock, RefreshCw } from "lucide-react"

// 数独生成和验证函数
const generateSudoku = () => {
  // 创建空白数独板
  const board = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0))

  // 填充对角线上的3个3x3方块
  fillDiagonal(board)

  // 填充剩余单元格
  solveSudoku(board)

  // 创建玩家板（复制解决方案）
  const solution = board.map((row) => [...row])

  // 根据难度移除单元格
  const difficulty = 0.6 // 移除60%的数字
  const playerBoard = board.map((row) => [...row])
  const totalCells = 81
  const cellsToRemove = Math.floor(totalCells * difficulty)

  let removed = 0
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    if (playerBoard[row][col] !== 0) {
      playerBoard[row][col] = 0
      removed++
    }
  }

  return { playerBoard, solution }
}

// 填充对角线上的3x3方块
const fillDiagonal = (board) => {
  for (let i = 0; i < 9; i += 3) {
    fillBox(board, i, i)
  }
}

// 填充3x3方块
const fillBox = (board, row, col) => {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  shuffle(nums)
  let numIndex = 0

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[row + i][col + j] = nums[numIndex++]
    }
  }
}

// 打乱数组
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// 检查数字是否可以放在指定位置
const isSafe = (board, row, col, num) => {
  // 检查行
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false
  }

  // 检查列
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) return false
  }

  // 检查3x3方块
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false
    }
  }

  return true
}

// 解决数独
const solveSudoku = (board) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        shuffle(nums)
        for (const num of nums) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num
            if (solveSudoku(board)) {
              return true
            }
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

// 验证数独是否完成
const validateSudoku = (board) => {
  // 检查是否有空格
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) return false
    }
  }

  // 检查每行
  for (let row = 0; row < 9; row++) {
    const rowSet = new Set()
    for (let col = 0; col < 9; col++) {
      if (rowSet.has(board[row][col])) return false
      rowSet.add(board[row][col])
    }
  }

  // 检查每列
  for (let col = 0; col < 9; col++) {
    const colSet = new Set()
    for (let row = 0; row < 9; row++) {
      if (colSet.has(board[row][col])) return false
      colSet.add(board[row][col])
    }
  }

  // 检查每个3x3方块
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const boxSet = new Set()
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const num = board[boxRow + row][boxCol + col]
          if (boxSet.has(num)) return false
          boxSet.add(num)
        }
      }
    }
  }

  return true
}

export function SudokuGame() {
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    isGameWon: false,
  })
  const [sudoku, setSudoku] = useState({ playerBoard: [], solution: [] })
  const [userBoard, setUserBoard] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [errors, setErrors] = useState([])
  const [timer, setTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [hints, setHints] = useState(3)

  // 初始化游戏
  const initGame = useCallback(() => {
    const { playerBoard, solution } = generateSudoku()
    setSudoku({ playerBoard, solution })
    setUserBoard(playerBoard.map((row) => [...row]))
    setGameState({
      isGameStarted: true,
      isGameOver: false,
      isGameWon: false,
    })
    setSelectedCell(null)
    setErrors([])
    setTimer(0)
    setHints(3)

    // 启动计时器
    if (timerInterval) clearInterval(timerInterval)
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)
    setTimerInterval(interval)
  }, [timerInterval])

  // 重新开始游戏
  const restartGame = () => {
    initGame()
  }

  // 处理单元格点击
  const handleCellClick = (row, col) => {
    if (gameState.isGameOver) return
    if (sudoku.playerBoard[row][col] !== 0) return // 不能修改初始数字
    setSelectedCell({ row, col })
  }

  // 处理数字输入
  const handleNumberInput = (num) => {
    if (!selectedCell || gameState.isGameOver) return

    const { row, col } = selectedCell
    const newBoard = userBoard.map((r) => [...r])
    newBoard[row][col] = num === 0 ? 0 : num

    // 检查是否有错误
    const newErrors = [...errors]
    const errorIndex = errors.findIndex((err) => err.row === row && err.col === col)

    if (num !== 0 && num !== sudoku.solution[row][col]) {
      // 添加错误
      if (errorIndex === -1) {
        newErrors.push({ row, col })
      }
    } else {
      // 移除错误
      if (errorIndex !== -1) {
        newErrors.splice(errorIndex, 1)
      }
    }

    setUserBoard(newBoard)
    setErrors(newErrors)

    // 检查游戏是否完成
    if (validateSudoku(newBoard)) {
      setGameState({
        ...gameState,
        isGameOver: true,
        isGameWon: true,
      })
      clearInterval(timerInterval)
    }
  }

  // 使用提示
  const useHint = () => {
    if (!selectedCell || hints <= 0 || gameState.isGameOver) return

    const { row, col } = selectedCell
    if (sudoku.playerBoard[row][col] !== 0) return // 不能修改初始数字

    const correctValue = sudoku.solution[row][col]
    const newBoard = userBoard.map((r) => [...r])
    newBoard[row][col] = correctValue

    // 移除错误
    const newErrors = errors.filter((err) => !(err.row === row && err.col === col))

    setUserBoard(newBoard)
    setErrors(newErrors)
    setHints(hints - 1)

    // 检查游戏是否完成
    if (validateSudoku(newBoard)) {
      setGameState({
        ...gameState,
        isGameOver: true,
        isGameWon: true,
      })
      clearInterval(timerInterval)
    }
  }

  // 清除选中单元格
  const clearCell = () => {
    if (!selectedCell || gameState.isGameOver) return
    const { row, col } = selectedCell
    if (sudoku.playerBoard[row][col] !== 0) return // 不能修改初始数字

    const newBoard = userBoard.map((r) => [...r])
    newBoard[row][col] = 0

    // 移除错误
    const newErrors = errors.filter((err) => !(err.row === row && err.col === col))

    setUserBoard(newBoard)
    setErrors(newErrors)
  }

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

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold flex items-center">
          <Clock className="w-5 h-5 mr-1" /> {formatTime(timer)}
        </div>
        <div className="text-lg font-bold">提示: {hints}</div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && !gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">数独挑战</h3>
            <p className="text-center mb-4">填充数字1-9，使每行、每列和每个3x3方块中的数字不重复。</p>
            <Button onClick={initGame}>开始游戏</Button>
          </div>
        )}

        {gameState.isGameOver && gameState.isGameWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">恭喜！</h3>
            <p className="text-lg mb-2">你完成了数独挑战！</p>
            <p className="text-lg mb-4">用时: {formatTime(timer)}</p>
            <Button onClick={restartGame}>再玩一次</Button>
          </div>
        )}

        <div className="flex justify-center items-center h-full">
          {gameState.isGameStarted && (
            <div className="flex flex-col items-center">
              {/* 数独网格 */}
              <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 mb-4">
                {userBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isInitial = sudoku.playerBoard[rowIndex][colIndex] !== 0
                    const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex
                    const hasError = errors.some((err) => err.row === rowIndex && err.col === colIndex)
                    const borderRight =
                      (colIndex + 1) % 3 === 0 && colIndex < 8
                        ? "border-r-2 border-gray-800"
                        : "border-r border-gray-300"
                    const borderBottom =
                      (rowIndex + 1) % 3 === 0 && rowIndex < 8
                        ? "border-b-2 border-gray-800"
                        : "border-b border-gray-300"

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer ${
                          isInitial ? "bg-gray-100 font-bold" : ""
                        } ${isSelected ? "bg-blue-200" : ""} ${
                          hasError ? "text-red-500" : ""
                        } ${borderRight} ${borderBottom}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {cell !== 0 ? cell : ""}
                      </div>
                    )
                  }),
                )}
              </div>

              {/* 数字输入面板 */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                    onClick={() => handleNumberInput(num)}
                  >
                    {num}
                  </Button>
                ))}
                <Button variant="outline" className="w-8 h-8 sm:w-10 sm:h-10 p-0" onClick={clearCell}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={useHint} disabled={hints <= 0}>
                  提示 ({hints})
                </Button>
                <Button variant="outline" onClick={restartGame}>
                  <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 填充数字1-9，使每行、每列和每个3x3方块中的数字不重复。点击空格后选择数字填入。</p>
      </div>
    </div>
  )
}
