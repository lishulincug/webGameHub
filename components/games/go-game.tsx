"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, User } from "lucide-react"

// 棋盘大小
const BOARD_SIZE = 19
const EMPTY = 0
const BLACK = 1
const WHITE = 2

export function GoGame() {
  const [board, setBoard] = useState(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(EMPTY)),
  )
  const [currentPlayer, setCurrentPlayer] = useState(BLACK)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    blackCaptures: 0,
    whiteCaptures: 0,
  })
  const [gameMode, setGameMode] = useState("human")
  const [lastMove, setLastMove] = useState(null)
  const [koPosition, setKoPosition] = useState(null)

  // 获取相邻位置
  const getNeighbors = useCallback((row, col) => {
    const neighbors = []
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]

    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        neighbors.push([newRow, newCol])
      }
    }
    return neighbors
  }, [])

  // 获取连通的同色棋子群
  const getGroup = useCallback(
    (board, row, col, visited = new Set()) => {
      const key = `${row},${col}`
      if (visited.has(key)) return []

      const piece = board[row][col]
      if (piece === EMPTY) return []

      visited.add(key)
      const group = [[row, col]]

      for (const [nr, nc] of getNeighbors(row, col)) {
        if (board[nr][nc] === piece) {
          group.push(...getGroup(board, nr, nc, visited))
        }
      }

      return group
    },
    [getNeighbors],
  )

  // 检查棋子群是否有气
  const hasLiberty = useCallback(
    (board, group) => {
      for (const [row, col] of group) {
        for (const [nr, nc] of getNeighbors(row, col)) {
          if (board[nr][nc] === EMPTY) {
            return true
          }
        }
      }
      return false
    },
    [getNeighbors],
  )

  // 移除被吃的棋子
  const removeCaptures = useCallback(
    (board, opponent) => {
      const newBoard = board.map((row) => [...row])
      let captures = 0
      const visited = new Set()

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const key = `${row},${col}`
          if (board[row][col] === opponent && !visited.has(key)) {
            const group = getGroup(board, row, col, new Set())
            group.forEach(([r, c]) => visited.add(`${r},${c}`))

            if (!hasLiberty(board, group)) {
              // 移除这个群
              for (const [r, c] of group) {
                newBoard[r][c] = EMPTY
                captures++
              }
            }
          }
        }
      }

      return { board: newBoard, captures }
    },
    [getGroup, hasLiberty],
  )

  // 检查是否为自杀手
  const isSuicide = useCallback(
    (board, row, col, player) => {
      const testBoard = board.map((r) => [...r])
      testBoard[row][col] = player

      // 先移除对方被吃的棋子
      const opponent = player === BLACK ? WHITE : BLACK
      const { board: afterCaptures } = removeCaptures(testBoard, opponent)

      // 检查自己的棋子群是否有气
      const group = getGroup(afterCaptures, row, col, new Set())
      return !hasLiberty(afterCaptures, group)
    },
    [removeCaptures, getGroup, hasLiberty],
  )

  // 处理棋盘点击
  const handleCellClick = useCallback(
    (row, col) => {
      if (gameState.isGameOver || board[row][col] !== EMPTY) return

      // 检查是否为自杀手
      if (isSuicide(board, row, col, currentPlayer)) return

      // 检查劫争
      if (koPosition && koPosition.row === row && koPosition.col === col) return

      // 下棋
      const newBoard = board.map((r) => [...r])
      newBoard[row][col] = currentPlayer

      // 移除对方被吃的棋子
      const opponent = currentPlayer === BLACK ? WHITE : BLACK
      const { board: finalBoard, captures } = removeCaptures(newBoard, opponent)

      setBoard(finalBoard)
      setLastMove({ row, col })

      // 更新被吃棋子数
      setGameState((prev) => ({
        ...prev,
        blackCaptures: currentPlayer === BLACK ? prev.blackCaptures : prev.blackCaptures + captures,
        whiteCaptures: currentPlayer === WHITE ? prev.whiteCaptures : prev.whiteCaptures + captures,
      }))

      // 检查劫争（简化版）
      if (captures === 1) {
        // 找到被吃的位置作为劫争位置
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === opponent && finalBoard[r][c] === EMPTY) {
              setKoPosition({ row: r, col: c })
              break
            }
          }
        }
      } else {
        setKoPosition(null)
      }

      // 切换玩家
      setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK)
    },
    [board, currentPlayer, gameState.isGameOver, isSuicide, koPosition, removeCaptures],
  )

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
      blackCaptures: 0,
      whiteCaptures: 0,
    })
    setGameMode(mode)
    setLastMove(null)
    setKoPosition(null)
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame(gameMode)
  }

  // 结束游戏（简化版，实际围棋需要复杂的计算）
  const endGame = () => {
    setGameState((prev) => ({ ...prev, isGameOver: true }))
  }

  // 渲染棋子
  const renderPiece = (value, row, col) => {
    if (value === EMPTY) return null

    const isLastMove = lastMove && lastMove.row === row && lastMove.col === col

    return (
      <div
        className={`w-5 h-5 rounded-full border ${
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
        <div className="text-sm">
          <div>黑棋提子: {gameState.blackCaptures}</div>
          <div>白棋提子: {gameState.whiteCaptures}</div>
        </div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">围棋</h3>
            <p className="text-center mb-4">黑白对弈，围地制胜！</p>
            <div className="flex gap-2">
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
            <p className="text-lg mb-2">黑棋提子: {gameState.blackCaptures}</p>
            <p className="text-lg mb-4">白棋提子: {gameState.whiteCaptures}</p>
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
              <div className="bg-yellow-100 p-2 rounded-lg shadow-lg">
                <div
                  className="grid gap-0 relative"
                  style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                    width: `${BOARD_SIZE * 16}px`,
                    height: `${BOARD_SIZE * 16}px`,
                  }}
                >
                  {/* 棋盘线条 */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={BOARD_SIZE * 16}
                    height={BOARD_SIZE * 16}
                  >
                    {/* 垂直线 */}
                    {Array(BOARD_SIZE)
                      .fill(0)
                      .map((_, i) => (
                        <line
                          key={`v-${i}`}
                          x1={i * 16 + 8}
                          y1={8}
                          x2={i * 16 + 8}
                          y2={BOARD_SIZE * 16 - 8}
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
                          x1={8}
                          y1={i * 16 + 8}
                          x2={BOARD_SIZE * 16 - 8}
                          y2={i * 16 + 8}
                          stroke="#8B4513"
                          strokeWidth="1"
                        />
                      ))}
                    {/* 星位 */}
                    {[
                      [3, 3],
                      [3, 9],
                      [3, 15],
                      [9, 3],
                      [9, 9],
                      [9, 15],
                      [15, 3],
                      [15, 9],
                      [15, 15],
                    ].map(([row, col], index) => (
                      <circle key={index} cx={col * 16 + 8} cy={row * 16 + 8} r="2" fill="#8B4513" />
                    ))}
                  </svg>

                  {/* 棋盘格子 */}
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-yellow-200 hover:bg-opacity-50"
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
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={restartGame}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
          </Button>
          <Button variant="outline" onClick={endGame}>
            结束游戏
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 围棋对弈，黑棋先行。围地多者获胜，提子计分。点击空位下棋。</p>
      </div>
    </div>
  )
}
