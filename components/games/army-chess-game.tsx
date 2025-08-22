"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Shuffle } from "lucide-react"

// 棋子类型
const PIECES = {
  EMPTY: 0,
  // 红方
  RED_COMMANDER: 1, // 司令
  RED_GENERAL: 2, // 军长
  RED_DIVISION: 3, // 师长
  RED_BRIGADE: 4, // 旅长
  RED_REGIMENT: 5, // 团长
  RED_BATTALION: 6, // 营长
  RED_COMPANY: 7, // 连长
  RED_PLATOON: 8, // 排长
  RED_ENGINEER: 9, // 工兵
  RED_BOMB: 10, // 炸弹
  RED_FLAG: 11, // 军旗
  // 蓝方
  BLUE_COMMANDER: 12,
  BLUE_GENERAL: 13,
  BLUE_DIVISION: 14,
  BLUE_BRIGADE: 15,
  BLUE_REGIMENT: 16,
  BLUE_BATTALION: 17,
  BLUE_COMPANY: 18,
  BLUE_PLATOON: 19,
  BLUE_ENGINEER: 20,
  BLUE_BOMB: 21,
  BLUE_FLAG: 22,
  // 特殊
  UNKNOWN: 23, // 未翻开的棋子
}

// 棋子名称
const PIECE_NAMES = {
  [PIECES.RED_COMMANDER]: "司",
  [PIECES.RED_GENERAL]: "军",
  [PIECES.RED_DIVISION]: "师",
  [PIECES.RED_BRIGADE]: "旅",
  [PIECES.RED_REGIMENT]: "团",
  [PIECES.RED_BATTALION]: "营",
  [PIECES.RED_COMPANY]: "连",
  [PIECES.RED_PLATOON]: "排",
  [PIECES.RED_ENGINEER]: "工",
  [PIECES.RED_BOMB]: "炸",
  [PIECES.RED_FLAG]: "旗",
  [PIECES.BLUE_COMMANDER]: "司",
  [PIECES.BLUE_GENERAL]: "军",
  [PIECES.BLUE_DIVISION]: "师",
  [PIECES.BLUE_BRIGADE]: "旅",
  [PIECES.BLUE_REGIMENT]: "团",
  [PIECES.BLUE_BATTALION]: "营",
  [PIECES.BLUE_COMPANY]: "连",
  [PIECES.BLUE_PLATOON]: "排",
  [PIECES.BLUE_ENGINEER]: "工",
  [PIECES.BLUE_BOMB]: "炸",
  [PIECES.BLUE_FLAG]: "旗",
  [PIECES.UNKNOWN]: "？",
}

// 棋子等级（数字越小等级越高）
const PIECE_RANKS = {
  [PIECES.RED_COMMANDER]: 1,
  [PIECES.RED_GENERAL]: 2,
  [PIECES.RED_DIVISION]: 3,
  [PIECES.RED_BRIGADE]: 4,
  [PIECES.RED_REGIMENT]: 5,
  [PIECES.RED_BATTALION]: 6,
  [PIECES.RED_COMPANY]: 7,
  [PIECES.RED_PLATOON]: 8,
  [PIECES.RED_ENGINEER]: 9,
  [PIECES.BLUE_COMMANDER]: 1,
  [PIECES.BLUE_GENERAL]: 2,
  [PIECES.BLUE_DIVISION]: 3,
  [PIECES.BLUE_BRIGADE]: 4,
  [PIECES.BLUE_REGIMENT]: 5,
  [PIECES.BLUE_BATTALION]: 6,
  [PIECES.BLUE_COMPANY]: 7,
  [PIECES.BLUE_PLATOON]: 8,
  [PIECES.BLUE_ENGINEER]: 9,
}

// 生成随机棋盘
const generateRandomBoard = () => {
  const redPieces = [
    PIECES.RED_COMMANDER,
    PIECES.RED_GENERAL,
    PIECES.RED_DIVISION,
    PIECES.RED_BRIGADE,
    PIECES.RED_REGIMENT,
    PIECES.RED_BATTALION,
    PIECES.RED_COMPANY,
    PIECES.RED_PLATOON,
    PIECES.RED_ENGINEER,
    PIECES.RED_ENGINEER,
    PIECES.RED_ENGINEER,
    PIECES.RED_BOMB,
    PIECES.RED_BOMB,
    PIECES.RED_FLAG,
  ]

  const bluePieces = [
    PIECES.BLUE_COMMANDER,
    PIECES.BLUE_GENERAL,
    PIECES.BLUE_DIVISION,
    PIECES.BLUE_BRIGADE,
    PIECES.BLUE_REGIMENT,
    PIECES.BLUE_BATTALION,
    PIECES.BLUE_COMPANY,
    PIECES.BLUE_PLATOON,
    PIECES.BLUE_ENGINEER,
    PIECES.BLUE_ENGINEER,
    PIECES.BLUE_ENGINEER,
    PIECES.BLUE_BOMB,
    PIECES.BLUE_BOMB,
    PIECES.BLUE_FLAG,
  ]

  // 打乱棋子顺序
  const shuffleArray = (array) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const shuffledRed = shuffleArray(redPieces)
  const shuffledBlue = shuffleArray(bluePieces)

  // 创建6x6棋盘
  const board = Array(6)
    .fill(null)
    .map(() => Array(6).fill(PIECES.EMPTY))

  // 放置红方棋子（下半部分）
  let redIndex = 0
  for (let row = 3; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (redIndex < shuffledRed.length) {
        board[row][col] = shuffledRed[redIndex++]
      }
    }
  }

  // 放置蓝方棋子（上半部分）
  let blueIndex = 0
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      if (blueIndex < shuffledBlue.length) {
        board[row][col] = shuffledBlue[blueIndex++]
      }
    }
  }

  return board
}

export function ArmyChessGame() {
  const [board, setBoard] = useState(() => generateRandomBoard())
  const [revealedBoard, setRevealedBoard] = useState(() =>
    Array(6)
      .fill(null)
      .map(() => Array(6).fill(false)),
  )
  const [currentPlayer, setCurrentPlayer] = useState("red")
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    winner: null,
  })
  const [gameMode, setGameMode] = useState("flip") // "flip" or "setup"

  // 判断是否为红方棋子
  const isRedPiece = (piece) => piece >= PIECES.RED_COMMANDER && piece <= PIECES.RED_FLAG

  // 判断是否为蓝方棋子
  const isBluePiece = (piece) => piece >= PIECES.BLUE_COMMANDER && piece <= PIECES.BLUE_FLAG

  // 判断战斗结果
  const getBattleResult = useCallback((attacker, defender) => {
    // 炸弹特殊规则
    if (attacker === PIECES.RED_BOMB || attacker === PIECES.BLUE_BOMB) {
      if (defender === PIECES.RED_ENGINEER || defender === PIECES.BLUE_ENGINEER) {
        return "defender_wins" // 工兵排炸弹
      } else {
        return "both_die" // 炸弹炸死对方，自己也死
      }
    }

    if (defender === PIECES.RED_BOMB || defender === PIECES.BLUE_BOMB) {
      if (attacker === PIECES.RED_ENGINEER || attacker === PIECES.BLUE_ENGINEER) {
        return "attacker_wins" // 工兵排炸弹
      } else {
        return "both_die" // 炸弹炸死对方
      }
    }

    // 军旗不能移动，只能被吃
    if (defender === PIECES.RED_FLAG || defender === PIECES.BLUE_FLAG) {
      return "attacker_wins"
    }

    // 普通战斗
    const attackerRank = PIECE_RANKS[attacker]
    const defenderRank = PIECE_RANKS[defender]

    if (attackerRank < defenderRank) {
      return "attacker_wins"
    } else if (attackerRank > defenderRank) {
      return "defender_wins"
    } else {
      return "both_die" // 同等级同归于尽
    }
  }, [])

  // 检查移动是否合法
  const isValidMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      // 基本边界检查
      if (toRow < 0 || toRow >= 6 || toCol < 0 || toCol >= 6) return false

      // 只能移动到相邻位置
      const rowDiff = Math.abs(toRow - fromRow)
      const colDiff = Math.abs(toCol - fromCol)
      if (rowDiff + colDiff !== 1) return false

      const piece = board[fromRow][fromCol]

      // 军旗和炸弹不能移动
      if (
        piece === PIECES.RED_FLAG ||
        piece === PIECES.BLUE_FLAG ||
        piece === PIECES.RED_BOMB ||
        piece === PIECES.BLUE_BOMB
      ) {
        return false
      }

      return true
    },
    [board],
  )

  // 处理棋盘点击
  const handleCellClick = (row, col) => {
    if (gameState.isGameOver) return

    const piece = board[row][col]
    const isRevealed = revealedBoard[row][col]

    if (gameMode === "flip") {
      // 翻棋模式
      if (!isRevealed && piece !== PIECES.EMPTY) {
        // 翻开棋子
        const newRevealedBoard = revealedBoard.map((r) => [...r])
        newRevealedBoard[row][col] = true
        setRevealedBoard(newRevealedBoard)

        // 检查是否找到军旗
        if (piece === PIECES.RED_FLAG) {
          setGameState((prev) => ({ ...prev, isGameOver: true, winner: "blue" }))
        } else if (piece === PIECES.BLUE_FLAG) {
          setGameState((prev) => ({ ...prev, isGameOver: true, winner: "red" }))
        }

        // 切换玩家
        setCurrentPlayer(currentPlayer === "red" ? "blue" : "red")
      } else if (isRevealed && selectedPiece) {
        // 攻击已翻开的棋子
        const { row: fromRow, col: fromCol } = selectedPiece
        const attackerPiece = board[fromRow][fromCol]

        if (
          isValidMove(fromRow, fromCol, row, col) &&
          ((currentPlayer === "red" && isRedPiece(attackerPiece)) ||
            (currentPlayer === "blue" && isBluePiece(attackerPiece))) &&
          ((isRedPiece(attackerPiece) && isBluePiece(piece)) || (isBluePiece(attackerPiece) && isRedPiece(piece)))
        ) {
          // 执行战斗
          const result = getBattleResult(attackerPiece, piece)
          const newBoard = board.map((r) => [...r])

          switch (result) {
            case "attacker_wins":
              newBoard[row][col] = attackerPiece
              newBoard[fromRow][fromCol] = PIECES.EMPTY
              break
            case "defender_wins":
              newBoard[fromRow][fromCol] = PIECES.EMPTY
              break
            case "both_die":
              newBoard[row][col] = PIECES.EMPTY
              newBoard[fromRow][fromCol] = PIECES.EMPTY
              break
          }

          setBoard(newBoard)
          setSelectedPiece(null)

          // 检查游戏结束条件
          if (piece === PIECES.RED_FLAG && result === "attacker_wins") {
            setGameState((prev) => ({ ...prev, isGameOver: true, winner: "blue" }))
          } else if (piece === PIECES.BLUE_FLAG && result === "attacker_wins") {
            setGameState((prev) => ({ ...prev, isGameOver: true, winner: "red" }))
          } else {
            setCurrentPlayer(currentPlayer === "red" ? "blue" : "red")
          }
        }
      } else if (
        isRevealed &&
        ((currentPlayer === "red" && isRedPiece(piece)) || (currentPlayer === "blue" && isBluePiece(piece)))
      ) {
        // 选择自己的棋子
        setSelectedPiece({ row, col })
      }
    }
  }

  // 初始化游戏
  const initGame = (mode) => {
    setBoard(generateRandomBoard())
    setRevealedBoard(
      Array(6)
        .fill(null)
        .map(() => Array(6).fill(false)),
    )
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

    const isRevealed = revealedBoard[row][col]
    const isSelected = selectedPiece && selectedPiece.row === row && selectedPiece.col === col
    const isRed = isRedPiece(piece)

    if (!isRevealed && gameMode === "flip") {
      return (
        <div className="w-8 h-8 bg-gray-400 border-2 border-gray-600 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-gray-500">
          ？
        </div>
      )
    }

    return (
      <div
        className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold cursor-pointer
          ${isRed ? "bg-red-100 border-red-500 text-red-700" : "bg-blue-100 border-blue-500 text-blue-700"}
          ${isSelected ? "ring-2 ring-yellow-500" : ""}
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
        <div className="text-lg font-bold">当前玩家: {currentPlayer === "red" ? "红方" : "蓝方"}</div>
        <div className="text-lg font-bold">{gameMode === "flip" ? "翻棋模式" : "布局模式"}</div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">军棋</h3>
            <p className="text-center mb-4">翻棋对战，找到对方军旗获胜！</p>
            <div className="flex gap-2">
              <Button onClick={() => initGame("flip")}>
                <Shuffle className="w-4 h-4 mr-1" />
                翻棋模式
              </Button>
            </div>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">游戏结束</h3>
            <p className="text-lg mb-4">{gameState.winner === "red" ? "红方" : "蓝方"}获胜！</p>
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
              <div className="bg-green-100 p-4 rounded-lg shadow-lg">
                <div
                  className="grid gap-1 relative"
                  style={{
                    gridTemplateColumns: "repeat(6, 1fr)",
                    width: "240px",
                    height: "240px",
                  }}
                >
                  {/* 棋盘格子 */}
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="w-10 h-10 bg-yellow-100 border border-gray-400 flex items-center justify-center cursor-pointer hover:bg-yellow-200"
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
        <p>游戏说明: 翻棋模式，轮流翻开棋子。找到对方军旗或消灭对方所有棋子获胜。</p>
      </div>
    </div>
  )
}
