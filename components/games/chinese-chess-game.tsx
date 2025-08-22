"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Bot } from "lucide-react"

// 棋子类型
const PIECES = {
  EMPTY: 0,
  // 红方
  RED_KING: 1,
  RED_ADVISOR: 2,
  RED_ELEPHANT: 3,
  RED_HORSE: 4,
  RED_CHARIOT: 5,
  RED_CANNON: 6,
  RED_SOLDIER: 7,
  // 黑方
  BLACK_KING: 8,
  BLACK_ADVISOR: 9,
  BLACK_ELEPHANT: 10,
  BLACK_HORSE: 11,
  BLACK_CHARIOT: 12,
  BLACK_CANNON: 13,
  BLACK_SOLDIER: 14,
}

// 棋子名称
const PIECE_NAMES = {
  [PIECES.RED_KING]: "帅",
  [PIECES.RED_ADVISOR]: "仕",
  [PIECES.RED_ELEPHANT]: "相",
  [PIECES.RED_HORSE]: "马",
  [PIECES.RED_CHARIOT]: "车",
  [PIECES.RED_CANNON]: "炮",
  [PIECES.RED_SOLDIER]: "兵",
  [PIECES.BLACK_KING]: "将",
  [PIECES.BLACK_ADVISOR]: "士",
  [PIECES.BLACK_ELEPHANT]: "象",
  [PIECES.BLACK_HORSE]: "马",
  [PIECES.BLACK_CHARIOT]: "车",
  [PIECES.BLACK_CANNON]: "炮",
  [PIECES.BLACK_SOLDIER]: "卒",
}

// 初始棋盘布局
const INITIAL_BOARD = [
  [
    PIECES.BLACK_CHARIOT,
    PIECES.BLACK_HORSE,
    PIECES.BLACK_ELEPHANT,
    PIECES.BLACK_ADVISOR,
    PIECES.BLACK_KING,
    PIECES.BLACK_ADVISOR,
    PIECES.BLACK_ELEPHANT,
    PIECES.BLACK_HORSE,
    PIECES.BLACK_CHARIOT,
  ],
  [
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
  ],
  [
    PIECES.EMPTY,
    PIECES.BLACK_CANNON,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.BLACK_CANNON,
    PIECES.EMPTY,
  ],
  [
    PIECES.BLACK_SOLDIER,
    PIECES.EMPTY,
    PIECES.BLACK_SOLDIER,
    PIECES.EMPTY,
    PIECES.BLACK_SOLDIER,
    PIECES.EMPTY,
    PIECES.BLACK_SOLDIER,
    PIECES.EMPTY,
    PIECES.BLACK_SOLDIER,
  ],
  [
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
  ],
  [
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
  ],
  [
    PIECES.RED_SOLDIER,
    PIECES.EMPTY,
    PIECES.RED_SOLDIER,
    PIECES.EMPTY,
    PIECES.RED_SOLDIER,
    PIECES.EMPTY,
    PIECES.RED_SOLDIER,
    PIECES.EMPTY,
    PIECES.RED_SOLDIER,
  ],
  [
    PIECES.EMPTY,
    PIECES.RED_CANNON,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.RED_CANNON,
    PIECES.EMPTY,
  ],
  [
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
    PIECES.EMPTY,
  ],
  [
    PIECES.RED_CHARIOT,
    PIECES.RED_HORSE,
    PIECES.RED_ELEPHANT,
    PIECES.RED_ADVISOR,
    PIECES.RED_KING,
    PIECES.RED_ADVISOR,
    PIECES.RED_ELEPHANT,
    PIECES.RED_HORSE,
    PIECES.RED_CHARIOT,
  ],
]

export function ChineseChessGame() {
  const [board, setBoard] = useState(() => INITIAL_BOARD.map((row) => [...row]))
  const [currentPlayer, setCurrentPlayer] = useState("red")
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    winner: null,
  })
  const [gameMode, setGameMode] = useState("human")

  // 判断是否为红方棋子
  const isRedPiece = (piece) => piece >= PIECES.RED_KING && piece <= PIECES.RED_SOLDIER

  // 判断是否为黑方棋子
  const isBlackPiece = (piece) => piece >= PIECES.BLACK_KING && piece <= PIECES.BLACK_SOLDIER

  // 检查移动是否合法
  const isValidMove = useCallback(
    (fromRow, fromCol, toRow, toCol, piece) => {
      // 基本边界检查
      if (toRow < 0 || toRow >= 10 || toCol < 0 || toCol >= 9) return false

      // 不能吃自己的棋子
      const targetPiece = board[toRow][toCol]
      if ((isRedPiece(piece) && isRedPiece(targetPiece)) || (isBlackPiece(piece) && isBlackPiece(targetPiece))) {
        return false
      }

      const rowDiff = Math.abs(toRow - fromRow)
      const colDiff = Math.abs(toCol - fromCol)

      switch (piece) {
        case PIECES.RED_KING:
        case PIECES.BLACK_KING:
          // 帅/将：只能在九宫格内移动，每次一格
          const isInPalace =
            piece === PIECES.RED_KING
              ? toRow >= 7 && toRow <= 9 && toCol >= 3 && toCol <= 5
              : toRow >= 0 && toRow <= 2 && toCol >= 3 && toCol <= 5
          return isInPalace && ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))

        case PIECES.RED_ADVISOR:
        case PIECES.BLACK_ADVISOR:
          // 仕/士：只能在九宫格内斜着移动
          const isInAdvisorPalace =
            piece === PIECES.RED_ADVISOR
              ? toRow >= 7 && toRow <= 9 && toCol >= 3 && toCol <= 5
              : toRow >= 0 && toRow <= 2 && toCol >= 3 && toCol <= 5
          return isInAdvisorPalace && rowDiff === 1 && colDiff === 1

        case PIECES.RED_ELEPHANT:
        case PIECES.BLACK_ELEPHANT:
          // 相/象：斜着走两格，不能过河，不能被蹩脚
          const canCrossRiver = piece === PIECES.RED_ELEPHANT ? toRow >= 5 : toRow <= 4
          if (!canCrossRiver || rowDiff !== 2 || colDiff !== 2) return false
          // 检查蹩脚
          const blockRow = fromRow + (toRow - fromRow) / 2
          const blockCol = fromCol + (toCol - fromCol) / 2
          return board[blockRow][blockCol] === PIECES.EMPTY

        case PIECES.RED_HORSE:
        case PIECES.BLACK_HORSE:
          // 马：走日字，不能被蹩脚
          if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) return false
          // 检查蹩脚
          const horseBlockRow = rowDiff === 2 ? fromRow + (toRow - fromRow) / 2 : fromRow
          const horseBlockCol = colDiff === 2 ? fromCol + (toCol - fromCol) / 2 : fromCol
          return board[horseBlockRow][horseBlockCol] === PIECES.EMPTY

        case PIECES.RED_CHARIOT:
        case PIECES.BLACK_CHARIOT:
          // 车：直线移动，路径不能有棋子
          if (rowDiff !== 0 && colDiff !== 0) return false
          const stepRow = rowDiff === 0 ? 0 : (toRow - fromRow) / rowDiff
          const stepCol = colDiff === 0 ? 0 : (toCol - fromCol) / colDiff
          for (let i = 1; i < Math.max(rowDiff, colDiff); i++) {
            if (board[fromRow + i * stepRow][fromCol + i * stepCol] !== PIECES.EMPTY) return false
          }
          return true

        case PIECES.RED_CANNON:
        case PIECES.BLACK_CANNON:
          // 炮：直线移动，吃子时需要跳过一个棋子
          if (rowDiff !== 0 && colDiff !== 0) return false
          const cannonStepRow = rowDiff === 0 ? 0 : (toRow - fromRow) / rowDiff
          const cannonStepCol = colDiff === 0 ? 0 : (toCol - fromCol) / colDiff
          let jumpCount = 0
          for (let i = 1; i < Math.max(rowDiff, colDiff); i++) {
            if (board[fromRow + i * cannonStepRow][fromCol + i * cannonStepCol] !== PIECES.EMPTY) {
              jumpCount++
            }
          }
          return targetPiece === PIECES.EMPTY ? jumpCount === 0 : jumpCount === 1

        case PIECES.RED_SOLDIER:
          // 红兵：过河前只能向前，过河后可以左右
          if (fromRow >= 5) {
            // 未过河
            return toRow === fromRow - 1 && toCol === fromCol
          } else {
            // 已过河
            return (
              (toRow === fromRow - 1 && toCol === fromCol) || (toRow === fromRow && Math.abs(toCol - fromCol) === 1)
            )
          }

        case PIECES.BLACK_SOLDIER:
          // 黑卒：过河前只能向前，过河后可以左右
          if (fromRow <= 4) {
            // 未过河
            return toRow === fromRow + 1 && toCol === fromCol
          } else {
            // 已过河
            return (
              (toRow === fromRow + 1 && toCol === fromCol) || (toRow === fromRow && Math.abs(toCol - fromCol) === 1)
            )
          }

        default:
          return false
      }
    },
    [board],
  )

  // 检查是否将军
  const isInCheck = useCallback(
    (board, isRed) => {
      // 找到王的位置
      let kingRow = -1,
        kingCol = -1
      const kingPiece = isRed ? PIECES.RED_KING : PIECES.BLACK_KING

      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === kingPiece) {
            kingRow = row
            kingCol = col
            break
          }
        }
        if (kingRow !== -1) break
      }

      if (kingRow === -1) return true // 王被吃了

      // 检查是否被对方棋子攻击
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
          const piece = board[row][col]
          if (piece !== PIECES.EMPTY && ((isRed && isBlackPiece(piece)) || (!isRed && isRedPiece(piece)))) {
            if (isValidMove(row, col, kingRow, kingCol, piece)) {
              return true
            }
          }
        }
      }

      return false
    },
    [isValidMove],
  )

  // 处理棋盘点击
  const handleCellClick = (row, col) => {
    if (gameState.isGameOver) return

    const piece = board[row][col]

    if (selectedPiece) {
      const { row: fromRow, col: fromCol } = selectedPiece

      if (fromRow === row && fromCol === col) {
        // 取消选择
        setSelectedPiece(null)
        return
      }

      const movingPiece = board[fromRow][fromCol]

      if (isValidMove(fromRow, fromCol, row, col, movingPiece)) {
        // 执行移动
        const newBoard = board.map((r) => [...r])
        newBoard[row][col] = movingPiece
        newBoard[fromRow][fromCol] = PIECES.EMPTY

        // 检查移动后是否自己被将军
        const isRed = isRedPiece(movingPiece)
        if (!isInCheck(newBoard, isRed)) {
          setBoard(newBoard)
          setSelectedPiece(null)

          // 检查对方是否被将军或将死
          const opponentInCheck = isInCheck(newBoard, !isRed)
          if (opponentInCheck) {
            // 简单的将死检查（这里可以进一步完善）
            setGameState((prev) => ({
              ...prev,
              isGameOver: true,
              winner: currentPlayer,
            }))
          } else {
            setCurrentPlayer(currentPlayer === "red" ? "black" : "red")
          }
        }
      }

      setSelectedPiece(null)
    } else {
      // 选择棋子
      if (piece !== PIECES.EMPTY) {
        const isPieceRed = isRedPiece(piece)
        if ((currentPlayer === "red" && isPieceRed) || (currentPlayer === "black" && isBlackPiece(piece))) {
          setSelectedPiece({ row, col })
        }
      }
    }
  }

  // 初始化游戏
  const initGame = (mode) => {
    setBoard(INITIAL_BOARD.map((row) => [...row]))
    setCurrentPlayer("red")
    setSelectedPiece(null)
    setGameState({
      isGameStarted: true,
      isGameOver: false,
      winner: null,
    })
    setGameMode(mode)
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame(gameMode)
  }

  // 渲染棋子
  const renderPiece = (piece, row, col) => {
    if (piece === PIECES.EMPTY) return null

    const isRed = isRedPiece(piece)
    const isSelected = selectedPiece && selectedPiece.row === row && selectedPiece.col === col

    return (
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer
          ${isRed ? "bg-red-100 border-red-500 text-red-700" : "bg-gray-100 border-gray-700 text-gray-800"}
          ${isSelected ? "ring-2 ring-blue-500" : ""}
          hover:shadow-md transition-shadow
        `}
      >
        {PIECE_NAMES[piece]}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">当前玩家: {currentPlayer === "red" ? "红方" : "黑方"}</div>
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
            <h3 className="text-xl font-bold mb-4">中国象棋</h3>
            <p className="text-center mb-4">楚河汉界，智慧对决！</p>
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
            <p className="text-lg mb-4">{gameState.winner === "red" ? "红方" : "黑方"}获胜！</p>
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
                <div className="relative">
                  {/* 楚河汉界 */}
                  <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-6 bg-yellow-200 flex items-center justify-center text-xs font-bold text-gray-700">
                    楚河 ————————— 汉界
                  </div>

                  <div
                    className="grid gap-0 relative"
                    style={{
                      gridTemplateColumns: "repeat(9, 1fr)",
                      width: "288px",
                      height: "320px",
                    }}
                  >
                    {/* 棋盘线条 */}
                    <svg className="absolute inset-0 pointer-events-none" width="288" height="320">
                      {/* 垂直线 */}
                      {Array(9)
                        .fill(0)
                        .map((_, i) => (
                          <line
                            key={`v-${i}`}
                            x1={i * 32 + 16}
                            y1={16}
                            x2={i * 32 + 16}
                            y2={304}
                            stroke="#8B4513"
                            strokeWidth="1"
                          />
                        ))}
                      {/* 水平线 */}
                      {Array(10)
                        .fill(0)
                        .map((_, i) => (
                          <line
                            key={`h-${i}`}
                            x1={16}
                            y1={i * 32 + 16}
                            x2={272}
                            y2={i * 32 + 16}
                            stroke="#8B4513"
                            strokeWidth="1"
                          />
                        ))}
                      {/* 九宫格对角线 */}
                      <line x1={112} y1={16} x2={176} y2={80} stroke="#8B4513" strokeWidth="1" />
                      <line x1={176} y1={16} x2={112} y2={80} stroke="#8B4513" strokeWidth="1" />
                      <line x1={112} y1={240} x2={176} y2={304} stroke="#8B4513" strokeWidth="1" />
                      <line x1={176} y1={240} x2={112} y2={304} stroke="#8B4513" strokeWidth="1" />
                    </svg>

                    {/* 棋盘格子 */}
                    {board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-yellow-200 hover:bg-opacity-50"
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {renderPiece(cell, rowIndex, colIndex)}
                        </div>
                      )),
                    )}
                  </div>
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
        <p>游戏说明: 中国象棋，红方先行。点击选择棋子，再点击目标位置移动。将死对方获胜。</p>
      </div>
    </div>
  )
}
