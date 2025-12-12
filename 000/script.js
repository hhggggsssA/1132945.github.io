// 遊戲主變數
 let board = Array(9).fill(null); // 棋盤狀態
 let current = 'X'; // 當前玩家（玩家為X）
 let active = true; 
 // 初始化棋盤
function init() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    board = Array(9).fill(null);
    active = true;
    current = 'X';
    document.getElementById('status').innerText = '玩家 (X) 先手';
    // 建立9個格子
   for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.onclick = () => playerMove(i);
    boardEl.appendChild(cell);
    }
   }
   function playerMove(i) {
    if (!active || board[i]) return;
    board[i] = 'X';
    updateBoard();
    if (checkWin('X')) {
    endGame('玩家 (X) 勝利！');
    return;
    } else if (isFull()) {
    endGame('平手！');
    return;
    }
    current = 'O';
    document.getElementById('status').innerText = '電腦思考中...';
    setTimeout(computerMove, 700); // 模擬電腦思考時間
   }
   // 電腦AI下棋邏輯
 function computerMove() {
     // 1. 嘗試自己獲勝
     let move = findWinningMove('O');
     // 2. 嘗試阻止玩家獲勝
     if (move === null) move = findWinningMove('X');
     // 3. 否則隨機下在空格
     if (move === null) move = getRandomMove();
     board[move] = 'O';
     updateBoard();
     if (checkWin('O')) {
         endGame('電腦 (O) 勝利！');
         return;
         } else if (isFull()) {
         endGame('平手！');
         return;
         }
         current = 'X';
         document.getElementById('status').innerText = '輪到玩家 (X)';
         }
         function findWinningMove(player) {
            const wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
            ];
            for (let [a,b,c] of wins) {
            const line = [board[a], board[b], board[c]];
            if (line.filter(v => v === player).length === 2 && line.includes(null)) {
            return [a,b,c][line.indexOf(null)];
            }
           
            return null;
           }}
           function getRandomMove() {
             const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
             return empty[Math.floor(Math.random() * empty.length)];
             }
             // JavaScript - 修正 updateBoard 以搭配 CSS 動畫
function updateBoard() {
    const cells = document.getElementsByClassName('cell');
    for (let i = 0; i < 9; i++) {
        cells[i].innerText = board[i] || '';
        
        // 額外新增：確保 CSS 的 :contains 選擇器能正常運作
        // 這是為了讓 X 和 O 符號能獨立套用顏色和動畫
        if (board[i] === 'X') {
             cells[i].style.color = '#4169E1'; // 皇家藍
        } else if (board[i] === 'O') {
             cells[i].style.color = '#FF6347'; // 番茄紅
        } else {
             cells[i].style.color = 'initial';
        }
    }
}
                 function checkWin(player) {
                     const wins = [
                     [0,1,2],[3,4,5],[6,7,8],
                     [0,3,6],[1,4,7],[2,5,8],
                     [0,4,8],[2,4,6]
                     ];
                     return wins.some(([a,b,c]) => board[a] === player && board[b] === player
                    && board[c] === player);
                     }
                     function isFull() {
                         return board.every(cell => cell !== null);
                         }
                         // 結束遊戲
                         function endGame(message) {
                         document.getElementById('status').innerText = message;
                         active = false;
                         }
                         // 重開一局
 function resetGame() {
     init();
     }
     // 初始化
     init();
                        
                    
                
        
    