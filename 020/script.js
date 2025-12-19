const BOARD_SIZE = 8;
let board = [];
let currentPlayer = 1; // 1:黑, 2:白
let isAnimating = false;

// 進階權重矩陣
const WEIGHTS = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, 5, 1, 1, 5, -2, 10],
    [5, -2, 1, 1, 1, 1, -2, 5],
    [5, -2, 1, 1, 1, 1, -2, 5],
    [10, -2, 5, 1, 1, 5, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100]
];

function initGame() {
    board = Array(8).fill().map(() => Array(8).fill(0));
    board[3][3] = 2; board[4][4] = 2;
    board[3][4] = 1; board[4][3] = 1;
    currentPlayer = 1;
    renderBoard();
    updateUI();
}

async function handleCellClick(r, c) {
    if (isAnimating || currentPlayer !== 1 || !isValidMove(r, c, 1)) return;
    await executeTurn(r, c, 1);
    
    if (canMove(2)) {
        setTimeout(computerTurn, 800);
    } else if (canMove(1)) {
        updateMessage("電腦無處下子，換黑棋繼續");
    } else {
        checkWinner();
    }
}

async function executeTurn(r, c, color) {
    isAnimating = true;
    const flips = getFlips(r, c, color);
    
    // 1. 下子
    board[r][c] = color;
    renderBoard(); 

    // 2. 依序翻轉動畫
    for (let i = 0; i < flips.length; i++) {
        await new Promise(res => setTimeout(res, 250)); // 間隔 0.25 秒
        const [fr, fc] = flips[i];
        board[fr][fc] = color;
        
        // 抓取 DOM 直接變更 Class 觸發 CSS transition
        const cellIdx = fr * 8 + fc;
        const piece = document.getElementById('board').children[cellIdx].querySelector('.piece');
        if (piece) {
            piece.className = `piece ${color === 1 ? 'black' : 'white'}`;
        }
    }

    currentPlayer = 3 - color;
    isAnimating = false;
    updateUI();
}

function computerTurn() {
    const moves = getAllMoves(2);
    if (moves.length === 0) {
        currentPlayer = 1;
        updateUI();
        return;
    }

    const level = document.getElementById('ai-level').value;
    let chosen = (level === 'basic') 
        ? moves[Math.floor(Math.random() * moves.length)]
        : moves.reduce((a, b) => WEIGHTS[a.r][a.c] > WEIGHTS[b.r][b.c] ? a : b);

    executeTurn(chosen.r, chosen.c, 2).then(() => {
        if (!canMove(1) && canMove(2)) setTimeout(computerTurn, 800);
        else if (!canMove(1) && !canMove(2)) checkWinner();
    });
}

// --- 邏輯函式 ---
function getFlips(r, c, color) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    let total = [];
    dirs.forEach(([dr, dc]) => {
        let temp = [], nr = r + dr, nc = c + dc;
        while(nr>=0 && nr<8 && nc>=0 && nc<8 && board[nr][nc] === (3-color)) {
            temp.push([nr, nc]); nr += dr; nc += dc;
        }
        if(nr>=0 && nr<8 && nc>=0 && nc<8 && board[nr][nc] === color) total = total.concat(temp);
    });
    return total;
}

function isValidMove(r, c, color) { return board[r][c] === 0 && getFlips(r, c, color).length > 0; }
function canMove(color) { return getAllMoves(color).length > 0; }
function getAllMoves(color) {
    let m = [];
    for(let r=0; r<8; r++) for(let c=0; c<8; c++) if(isValidMove(r, c, color)) m.push({r, c});
    return m;
}

function renderBoard() {
    const b = document.getElementById('board');
    b.innerHTML = '';
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell' + (currentPlayer===1 && !isAnimating && isValidMove(r, c, 1) ? ' valid-move' : '');
            if(board[r][c] !== 0) {
                const p = document.createElement('div');
                p.className = `piece ${board[r][c]===1 ? 'black' : 'white'}`;
                p.innerHTML = '<div class="front"></div><div class="back"></div>';
                cell.appendChild(p);
            }
            cell.onclick = () => handleCellClick(r, c);
            b.appendChild(cell);
        }
    }
}

function updateUI() {
    let b=0, w=0;
    board.flat().forEach(v => { if(v===1) b++; if(v===2) w++; });
    document.getElementById('black-score').innerText = b;
    document.getElementById('white-score').innerText = w;
    document.getElementById('p1-card').classList.toggle('active', currentPlayer===1);
    document.getElementById('p2-card').classList.toggle('active', currentPlayer===2);
    updateMessage(currentPlayer===1 ? "輪到黑棋 (您)" : "電腦思考中...");
}

function updateMessage(m) { document.getElementById('status-msg').innerText = m; }

function checkWinner() {
    let b = parseInt(document.getElementById('black-score').innerText);
    let w = parseInt(document.getElementById('white-score').innerText);
    let msg = b > w ? "最後結果：黑棋勝利！" : (w > b ? "最後結果：白棋勝利！" : "最後結果：平手！");
    alert(msg);
}

function resetGame() { isAnimating = false; initGame(); }
initGame();