"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Bot } from "lucide-react"

// 棋盘大小
const BOARD_SIZE = 15
const EMPTY = 0
const BLACK = 1
const WHITE = 2

// 方向数组（用于检查连珠）
const DIRECTIONS = [
  [0, 1], // 水平
  [1, 0], // 垂直
  [1, 1], // 对角线
  [1, -1], // 反对角线
]

export function GomokuGame() {
  const [board, setBoard] = useState(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(EMPTY)),
  )
  const [currentPlayer, setCurrentPlayer] = useState(BLACK)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    winner: null,
    isPlayerTurn: true,
  })
  const [gameMode, setGameMode] = useState("ai") // "ai" or "human"
  const [lastMove, setLastMove] = useState(null)

  // 检查是否获胜
  const checkWin = useCallback((board, row, col, player) => {
    for (const [dx, dy] of DIRECTIONS) {
      let count = 1

      // 向一个方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i
        const newCol = col + dy * i
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }

      // 向相反方向检查
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i
        const newCol = col - dy * i
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          board[newRow][newCol] === player
        ) {
          count++
        } else {
          break
        }
      }

      if (count >= 5) {
        return true
      }
    }
    return false
  }, [])

  // AI评估函数
  const evaluatePosition = useCallback((board, row, col, player) => {
    let score = 0
    const opponent = player === BLACK ? WHITE : BLACK

    for (const [dx, dy] of DIRECTIONS) {
      // 检查这个方向的连珠情况
      const playerCount = 0
      const opponentCount = 0
      const emptyCount = 0

      // 检查5个位置的窗口
      for (let i = -4; i <= 0; i++) {
        let windowPlayerCount = 0
        let windowOpponentCount = 0
        let windowEmptyCount = 0

        for (let j = 0; j < 5; j++) {
          const newRow = row + dx * (i + j)
          const newCol = col + dy * (i + j)

          if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            const cell = board[newRow][newCol]
            if (cell === player) windowPlayerCount++
            else if (cell === opponent) windowOpponentCount++
            else windowEmptyCount++
          }
        }

        // 评分规则
        if (windowOpponentCount === 0) {
          if (windowPlayerCount === 4) score += 1000
          else if (windowPlayerCount === 3) score += 100
          else if (windowPlayerCount === 2) score += 10
          else if (windowPlayerCount === 1) score += 1
        }

        if (windowPlayerCount === 0) {
          if (windowOpponentCount === 4) score -= 1000
          else if (windowOpponentCount === 3) score -= 100
          else if (windowOpponentCount === 2) score -= 10
        }
      }
    }

    return score
  }, [])

  // AI下棋
  const makeAIMove = useCallback(() => {
    let bestScore = Number.NEGATIVE_INFINITY
    let bestMove = null

    // 遍历所有可能的位置
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === EMPTY) {
          const score = evaluatePosition(board, row, col, WHITE)
          if (score > bestScore) {
            bestScore = score
            bestMove = { row, col }
          }
        }
      }
    }

    if (bestMove) {
      const newBoard = board.map((row) => [...row])
      newBoard[bestMove.row][bestMove.col] = WHITE
      setBoard(newBoard)
      setLastMove(bestMove)

      if (checkWin(newBoard, bestMove.row, bestMove.col, WHITE)) {
        setGameState((prev) => ({
          ...prev,
          isGameOver: true,
          winner: WHITE,
        }))
      } else {
        setCurrentPlayer(BLACK)
        setGameState((prev) => ({ ...prev, isPlayerTurn: true }))
      }
    }
  }, [board, evaluatePosition, checkWin])

  // 处理棋盘点击
  const handleCellClick = (row, col) => {
    if (gameState.isGameOver || board[row][col] !== EMPTY) return
    if (gameMode === "ai" && !gameState.isPlayerTurn) return

    const newBoard = board.map((r) => [...r])
    newBoard[row][col] = currentPlayer
    setBoard(newBoard)
    setLastMove({ row, col })

    if (checkWin(newBoard, row, col, currentPlayer)) {
      setGameState((prev) => ({
        ...prev,
        isGameOver: true,
        winner: currentPlayer,
      }))
    } else {
      const nextPlayer = currentPlayer === BLACK ? WHITE : BLACK
      setCurrentPlayer(nextPlayer)

      if (gameMode === "ai" && nextPlayer === WHITE) {
        setGameState((prev) => ({ ...prev, isPlayerTurn: false }))
      }
    }
  }

  // AI自动下棋
  useEffect(() => {
    if (gameMode === "ai" && currentPlayer === WHITE && !gameState.isGameOver && gameState.isGameStarted) {
      const timer = setTimeout(() => {
        makeAIMove()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameMode, gameState.isGameOver, gameState.isGameStarted, makeAIMove])

  // 初始化游戏
  const initGame = (mode) => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(EMPTY)),
    )
    setCurrentPlayer(BLACK)
    setGameState({
      isGameStarted: true,
      isGameOver: false,
      winner: null,
      isPlayerTurn: true,
    })
    setGameMode(mode)
    setLastMove(null)
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame(gameMode)
  }

  // 渲染棋子
  const renderPiece = (value, row, col) => {
    if (value === EMPTY) return null

    const isLastMove = lastMove && lastMove.row === row && lastMove.col === col

    return (
      <div
        className={`w-6 h-6 rounded-full border-2 ${
          value === BLACK ? "bg-gray-800 border-gray-900" : "bg-white border-gray-300 shadow-md"
        } ${isLastMove ? "ring-2 ring-red-500" : ""}`}
      />
    )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold flex items-center">
          当前玩家:{" "}
          {currentPlayer === BLACK ? (
            <span className="flex items-center ml-2">
              <div className="w-4 h-4 bg-gray-800 rounded-full mr-1"></div>
              黑棋
            </span>
          ) : (
            <span className="flex items-center ml-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded-full mr-1"></div>
              白棋
            </span>
          )}
        </div>
        <div className="text-lg font-bold">
          {gameMode === "ai" ? (
            <span className="flex items-center">
              <User className="w-5 h-5 mr-1" />
              vs
              <Bot className="w-5 h-5 ml-1" />
            </span>
          ) : (
            "双人对战"
          )}
        </div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">五子棋</h3>
            <p className="text-center mb-4">先连成五子者获胜！</p>
            <div className="flex gap-2">
              <Button onClick={() => initGame("ai")}>
                <Bot className="w-4 h-4 mr-1" />
                人机对战
              </Button>
              <Button onClick={() => initGame("human")}>
                <User className="w-4 h-4 mr-1" />
                双人对战
              </Button>
            </div>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-4">{gameState.winner === BLACK ? "黑棋" : "白棋"}获胜！</p>
            <div className="flex gap-2">
              <Button onClick={restartGame}>再玩一次</Button>
              <Button variant="outline" onClick={() => setGameState({ ...gameState, isGameStarted: false })}>
                返回菜单
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center h-full overflow-auto">
          {gameState.isGameStarted && (
            <div className="relative">
              {/* 棋盘背景 */}
              <div className="bg-yellow-100 p-4 rounded-lg shadow-lg">
                <div
                  className="grid gap-0 relative"
                  style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                    width: `${BOARD_SIZE * 24}px`,
                    height: `${BOARD_SIZE * 24}px`,
                  }}
                >
                  {/* 棋盘线条 */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={BOARD_SIZE * 24}
                    height={BOARD_SIZE * 24}
                  >
                    {/* 垂直线 */}
                    {Array(BOARD_SIZE)
                      .fill(0)
                      .map((_, i) => (
                        <line
                          key={`v-${i}`}
                          x1={i * 24 + 12}
                          y1={12}
                          x2={i * 24 + 12}
                          y2={BOARD_SIZE * 24 - 12}
                          stroke="#8B4513"
                          strokeWidth="1"
                        />
                      ))}
                    {/* 水平线 */}
                    {Array(BOARD_SIZE)
                      .fill(0)
                      .map((_, i) => (
                        <line
                          key={`h-${i}`}
                          x1={12}
                          y1={i * 24 + 12}
                          x2={BOARD_SIZE * 24 - 12}
                          y2={i * 24 + 12}
                          stroke="#8B4513"
                          strokeWidth="1"
                        />
                      ))}
                    {/* 天元和星位 */}
                    {[
                      [7, 7], // 天元
                      [3, 3],
                      [3, 11],
                      [11, 3],
                      [11, 11], // 四个星位
                    ].map(([row, col], index) => (
                      <circle key={index} cx={col * 24 + 12} cy={row * 24 + 12} r="2" fill="#8B4513" />
                    ))}
                  </svg>

                  {/* 棋盘格子 */}
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-yellow-200 hover:bg-opacity-50"
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {renderPiece(cell, rowIndex, colIndex)}
                      </div>
                    )),
                  )}
                </div>
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
        <p>游戏说明: 轮流下棋，先连成五子者获胜。支持人机对战和双人对战模式。</p>
      </div>
    </div>
  )
}
