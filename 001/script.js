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
        // 確保點擊時呼叫 playerMove 函式
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

// 🤖 電腦 AI 下棋邏輯 (不會輸的策略)
function computerMove() {
    // 1. 嘗試自己獲勝 (Win)
    let move = findWinningMove('O'); 
    
    // 2. 嘗試阻止玩家獲勝 (Block)
    if (move === null) move = findWinningMove('X');
    
    // 3. 策略性移動
    if (move === null) {
        const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);

        // a. 佔據中心格 (索引 4)
        if (empty.includes(4)) {
            move = 4;
        } 
        // b. 佔據角落格 (索引 0, 2, 6, 8)
        else {
            const corners = [0, 2, 6, 8];
            const emptyCorners = empty.filter(i => corners.includes(i));
            
            if (emptyCorners.length > 0) {
                // 隨機選擇一個空著的角落
                move = emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
            }
            // c. 佔據邊線格 (如果以上都不適用)
            else {
                move = getRandomMove(); // 隨機選擇任何一個空著的格子（此時只剩下邊線）
            }
        }
    }

    // 執行移動
    board[move] = 'O';
    updateBoard();
    
    // 檢查遊戲狀態
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

// 找到獲勝/防禦的下一步 (已修正邏輯錯誤)
function findWinningMove(player) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // 橫列
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // 直行
        [0, 4, 8], [2, 4, 6] // 對角線
    ];
    for (let [a, b, c] of wins) {
        const line = [board[a], board[b], board[c]];
        // 檢查該行是否有兩個 'player' 標記和一個 null (空格)
        if (line.filter(v => v === player).length === 2 && line.includes(null)) {
            // 返回空格的索引
            return [a, b, c][line.indexOf(null)];
        }
    }
    return null; // 檢查所有組合後才返回 null
}

function getRandomMove() {
    const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
    return empty[Math.floor(Math.random() * empty.length)];
}

// 負責更新 UI 顯示
function updateBoard() {
    const cells = document.getElementsByClassName('cell');
    for (let i = 0; i < 9; i++) {
        cells[i].innerText = board[i] || '';
        
        // 確保 X 和 O 符號的顏色
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
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return wins.some(([a,b,c]) => board[a] === player && board[b] === player && board[c] === player);
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