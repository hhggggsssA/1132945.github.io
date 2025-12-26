const SIZE = 9;
const EMPTY = 0, BLACK = 1, WHITE = 2;
const KOMI = 7.5;

class GoGame {
    constructor() {
        this.board = [];
        this.currentTurn = BLACK;
        this.history = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.passCount = 0;
        this.isGameOver = false;
        this.isAIEnabled = true;
        this.koCoordinate = null;
        this.lastMove = null;

        this.ui = {
            board: document.getElementById('board'),
            status: document.getElementById('game-status'),
            turnIcon: document.getElementById('turn-icon'),
            logs: document.getElementById('game-logs'),
            capB: document.getElementById('capture-black'),
            capW: document.getElementById('capture-white'),
            moveCount: document.getElementById('move-count'),
            modal: document.getElementById('game-over-modal'),
            modalBtn: document.getElementById('btn-modal-restart')
        };

        this.init();
        this.bindEvents();
    }

    init() {
        this.board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
        this.history = [];
        this.captures = { [BLACK]: 0, [WHITE]: 0 };
        this.currentTurn = BLACK;
        this.passCount = 0;
        this.isGameOver = false;
        this.koCoordinate = null;
        this.lastMove = null;

        this.renderBoard();
        this.updateUI();
        this.log("遊戲開始！黑棋先手（貼目 7.5）");
        this.ui.modal.classList.add('hidden');
    }

    saveHistory() {
        this.history.push({
            board: JSON.stringify(this.board),
            captures: { ...this.captures },
            ko: this.koCoordinate ? { ...this.koCoordinate } : null,
            lastMove: this.lastMove ? { ...this.lastMove } : null,
            turn: this.currentTurn
        });
    }

    restoreHistory(state) {
        this.board = JSON.parse(state.board);
        this.captures = { ...state.captures };
        this.koCoordinate = state.ko;
        this.lastMove = state.lastMove;
        this.currentTurn = state.turn;
    }

    renderBoard() {
        this.ui.board.innerHTML = '';
        const starPoints = [[2,2], [6,2], [4,4], [2,6], [6,6]];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                if (starPoints.some(p => p[0] === r && p[1] === c)) {
                    cell.classList.add('star-point');
                }
                cell.onclick = () => this.handleHumanMove(r, c);
                this.ui.board.appendChild(cell);
            }
        }
    }

    getGroupData(board, r, c) {
        const color = board[r][c];
        if (color === EMPTY) return null;

        const group = [];
        const liberties = new Set();
        const visited = new Set();
        const stack = [{ r, c }];
        visited.add(`${r},${c}`);

        while (stack.length) {
            const cur = stack.pop();
            group.push(cur);

            [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => {
                const nr = cur.r + dr, nc = cur.c + dc;
                if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return;
                if (board[nr][nc] === EMPTY) liberties.add(`${nr},${nc}`);
                else if (board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    stack.push({ r: nr, c: nc });
                }
            });
        }
        return { group, liberties };
    }

    checkMove(r, c, player) {
        if (this.board[r][c] !== EMPTY) return { valid: false };
        if (this.koCoordinate && this.koCoordinate.r === r && this.koCoordinate.c === c)
            return { valid: false, msg: "打劫禁止立即回提" };

        const temp = this.board.map(row => [...row]);
        temp[r][c] = player;
        const opponent = player === BLACK ? WHITE : BLACK;
        const captured = [];

        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return;
            if (temp[nr][nc] === opponent) {
                const g = this.getGroupData(temp, nr, nc);
                if (g.liberties.size === 0) captured.push(...g.group);
            }
        });

        const self = this.getGroupData(temp, r, c);
        if (captured.length === 0 && self.liberties.size === 0)
            return { valid: false, msg: "禁著點（自殺）" };

        return { valid: true, captured };
    }

    executeMove(r, c) {
        if (this.isGameOver) return false;
        const check = this.checkMove(r, c, this.currentTurn);
        if (!check.valid) {
            if (check.msg) this.log(check.msg);
            return false;
        }

        this.saveHistory();

        this.board[r][c] = this.currentTurn;
        this.lastMove = { r, c };

        if (check.captured.length) {
            check.captured.forEach(p => this.board[p.r][p.c] = EMPTY);
            this.captures[this.currentTurn] += check.captured.length;
            this.koCoordinate = check.captured.length === 1 ? check.captured[0] : null;
        } else {
            this.koCoordinate = null;
        }

        this.passCount = 0;
        this.currentTurn = this.currentTurn === BLACK ? WHITE : BLACK;
        this.drawStones();
        this.updateUI();
        return true;
    }

    aiMove() {
        if (this.isGameOver) return;
        this.log("AI 思考中...");
        const moves = [];

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const chk = this.checkMove(r, c, WHITE);
                if (chk.valid) {
                    let score = Math.random() * 5;
                    score += chk.captured.length * 40;
                    if (r >= 2 && r <= 6 && c >= 2 && c <= 6) score += 2;
                    if (r === 0 || r === 8 || c === 0 || c === 8) score -= 2;
                    moves.push({ r, c, score });
                }
            }
        }

        if (!moves.length) {
            this.log("AI 虛手");
            this.pass();
            return;
        }

        moves.sort((a, b) => b.score - a.score);
        this.executeMove(moves[0].r, moves[0].c);
    }

    handleHumanMove(r, c) {
        if (this.currentTurn === BLACK && this.executeMove(r, c)) {
            if (this.isAIEnabled) setTimeout(() => this.aiMove(), 600);
        }
    }

    pass() {
        if (this.isGameOver) return;
        this.passCount++;
        this.log(`${this.currentTurn === BLACK ? "黑" : "白"}方虛手`);
        if (this.passCount >= 2) return this.endGame();
        this.currentTurn = this.currentTurn === BLACK ? WHITE : BLACK;
        this.updateUI();
        if (this.currentTurn === WHITE && this.isAIEnabled)
            setTimeout(() => this.aiMove(), 600);
    }

    undo() {
        if (!this.history.length || this.isGameOver) return;
        const state = this.history.pop();
        this.restoreHistory(state);
        this.drawStones();
        this.updateUI();
        this.log("已悔棋");
    }

    drawStones() {
        document.querySelectorAll('.stone,.territory').forEach(e => e.remove());
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (this.board[r][c]) {
                    const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
                    const s = document.createElement('div');
                    s.className = `stone ${this.board[r][c] === BLACK ? 'black' : 'white'}`;
                    if (this.lastMove && this.lastMove.r === r && this.lastMove.c === c)
                        s.classList.add('last-move');
                    cell.appendChild(s);
                }
            }
        }
    }

    updateUI() {
        this.ui.status.innerText = this.isGameOver ? "對局結束" :
            (this.currentTurn === BLACK ? "黑方思考中" : "白方思考中");
        this.ui.turnIcon.className = `stone-icon ${this.currentTurn === BLACK ? 'black' : 'white'}`;
        this.ui.capB.innerText = this.captures[BLACK];
        this.ui.capW.innerText = this.captures[WHITE];
        this.ui.moveCount.innerText = this.history.length;
    }

    log(msg) {
        const d = document.createElement('div');
        d.className = 'log-item';
        d.innerText = msg;
        this.ui.logs.prepend(d);
    }

    bindEvents() {
        document.getElementById('btn-pass').onclick = () => this.pass();
        document.getElementById('btn-undo').onclick = () => this.undo();
        document.getElementById('btn-restart').onclick = () => location.reload();
        this.ui.modalBtn.onclick = () => location.reload();
        document.getElementById('toggle-ai').onchange = e => this.isAIEnabled = e.target.checked;
    }

    endGame() {
        this.isGameOver = true;
        this.log("遊戲結束");
        this.ui.modal.classList.remove('hidden');
    }
}

window.onload = () => new GoGame();
