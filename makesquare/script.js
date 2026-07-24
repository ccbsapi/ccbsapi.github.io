document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const gameMessage = document.getElementById('game-message');
    const resetButton = document.getElementById('reset-button');
    const modeToggle = document.getElementById('mode-toggle');
    const modeLabel = document.getElementById('mode-label');
    const boardSizeRadios = document.querySelectorAll('input[name="board-size"]');

    let ROWS;
    let COLS;
    let MAX_DEPTH; // 盤面サイズに応じて探索深さを変更
    
    let board = [];
    let currentPlayer = 1; // 1: プレイヤー1 (赤), 2: プレイヤー2 (黄)
    let gameOver = false;
    let isVsComputerMode = false; // コンピュータ対戦モードかどうか
    const AI_PLAYER = 2; // コンピュータは常にプレイヤー2と仮定

    let humanStarts = true; // 人間が先手かどうか。モード切り替え時に交互にする

    const playerColors = {
        1: { name: '赤色🔴', diskColor: '#e74c3c', previewColor: 'rgba(231, 76, 60, 0.4)' },
        2: { name: '黄色🟡', diskColor: '#f1c40f', previewColor: 'rgba(241, 196, 15, 0.4)' }
    };

    // 盤面サイズとAIの深さを設定する関数
    function setBoardSize(sizeType) {
        gameBoard.classList.remove('large-board', 'cols-7', 'cols-9');
        if (sizeType === 'small') {
            ROWS = 6;
            COLS = 7;
            MAX_DEPTH = 6; // 6x7盤面では深く探索
            gameBoard.classList.add('cols-7');
            gameBoard.style.setProperty('--cols', COLS); 
            gameBoard.style.setProperty('--rows', ROWS);
            //gameBoard.style.gridTemplateColumns = `repeat(${COLS}, 70px)`;
            //gameBoard.style.gridTemplateRows = `repeat(${ROWS}, 70px)`;
        } else { // 'large'
            ROWS = 10;
            COLS = 9;
            MAX_DEPTH = 5; // 10x9盤面では計算量が多くなるため少し浅く
            gameBoard.classList.add('large-board', 'cols-9');

            gameBoard.style.setProperty('--cols', COLS);
            gameBoard.style.setProperty('--rows', ROWS);
            //gameBoard.style.gridTemplateColumns = `repeat(${COLS}, 55px)`;
            //gameBoard.style.gridTemplateRows = `repeat(${ROWS}, 55px)`;
        }
        initializeBoard(); // 盤面サイズが変更されたら再初期化
    }

    // ボードを初期化
    function initializeBoard() {
        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        gameBoard.innerHTML = '';
        
        // CSSのgrid-template-columnsとgrid-template-rowsはsetBoardSizeで設定済み
        // cellのサイズも動的に設定
        //const cellSize = (gameBoard.classList.contains('large-board') ? 55 : 70);
        //const previewDiskSize = (gameBoard.classList.contains('large-board') ? 50 : 60);

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                //cell.style.width = `${cellSize}px`;
                //cell.style.height = `${cellSize}px`;
                cell.addEventListener('click', () => handleColumnClick(c));

                // ホバーイベントリスナーを各セルに追加
                cell.addEventListener('mouseenter', () => handleCellHover(c, true));
                cell.addEventListener('mouseleave', () => handleCellHover(c, false));
                
                // プレビューディスクを追加
                const previewDisk = document.createElement('div');
                previewDisk.classList.add('preview-disk');
                // previewDisk.style.width = `${previewDiskSize}px`;
                // previewDisk.style.height = `${previewDiskSize}px`;
                cell.appendChild(previewDisk);

                gameBoard.appendChild(cell);
            }
        }
        
        if (isVsComputerMode) {
            // コンピュータモードの場合、先手後手を交互に切り替える
            currentPlayer = humanStarts ? 1 : AI_PLAYER;
        } else {
            // 対人モードの場合は常にプレイヤー1が先手
            currentPlayer = 1;
        }
        humanStarts = !humanStarts; // 次回のために先手を切り替える

        gameMessage.textContent = `${playerColors[currentPlayer].name}の番です`;
        gameOver = false;

        // コンピュータモードで、コンピュータが先手の場合
        if (isVsComputerMode && currentPlayer === AI_PLAYER) {
            setTimeout(makeComputerMove, 500); // 少し待ってからコンピュータが手を打つ
        }
    }

    // セルまたは列がクリックされた時の処理
    async function handleColumnClick(col) {
        if (gameOver) return;
        // コンピュータモードで、現在のプレイヤーがコンピュータの場合、クリックを無効化
        if (isVsComputerMode && currentPlayer === AI_PLAYER) return;

        await makeMove(col);
    }

    // 手を打つ共通ロジック
    async function makeMove(col) {
        let row = -1;
        // 選択された列の一番下の空いているセルを探す
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) {
                row = r;
                break;
            }
        }

        if (row !== -1) {
            board[row][col] = currentPlayer;
            updateBoardUI(row, col); // UI更新

            const winCoords = checkWin(currentPlayer); // 勝利判定を行い、勝利座標を取得

            if (winCoords) {
                gameMessage.textContent = `${playerColors[currentPlayer].name}の勝利！`;
                gameOver = true;
                highlightWinningSquare(winCoords); // 勝利した正方形をハイライト
            } else if (checkDraw()) {
                gameMessage.textContent = '引き分けです！';
                gameOver = true;
            } else {
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                gameMessage.textContent = `${playerColors[currentPlayer].name}の番です`;
                // コンピュータモードで、次のプレイヤーがコンピュータの場合
                if (isVsComputerMode && currentPlayer === AI_PLAYER && !gameOver) {
                    await new Promise(resolve => setTimeout(resolve, 500)); // 少し待ってからコンピュータが手を打つ
                    makeComputerMove();
                }
            }
        }
    }

    // UIを更新（石を配置）
    function updateBoardUI(row, col) {
        const cell = gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add(`player${board[row][col]}`);
        // プレビューディスクを削除
        const previewDisk = cell.querySelector('.preview-disk');
        if (previewDisk) {
            previewDisk.remove();
        }
        // ホバー中の列からプレビューを非表示にする
        handleCellHover(col, false);
    }

    // ホバー時の処理
    function handleCellHover(col, isEntering) {
        if (gameOver) return;
        // コンピュータの番の場合はホバー表示しない
        if (isVsComputerMode && currentPlayer === AI_PLAYER) return;

        let targetRow = -1;
        // 選択された列の一番下の空いているセルを探す
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) {
                targetRow = r;
                break;
            }
        }

        // 列全体のハイライトとプレビューディスクの表示/非表示
        for (let r = 0; r < ROWS; r++) {
            const cell = gameBoard.querySelector(`[data-row="${r}"][data-col="${col}"]`);
            if (cell) {
                if (isEntering) {
                    cell.classList.add('column-highlight');
                } else {
                    cell.classList.remove('column-highlight');
                }
            }
        }

        // 石が落ちる場所にプレビューディスクを表示/非表示
        if (targetRow !== -1) {
            const previewCell = gameBoard.querySelector(`[data-row="${targetRow}"][data-col="${col}"]`);
            if (previewCell) {
                const previewDisk = previewCell.querySelector('.preview-disk');
                if (previewDisk) {
                    if (isEntering) {
                        previewDisk.style.setProperty('--preview-color', playerColors[currentPlayer].previewColor);
                        previewDisk.style.opacity = '1';
                    } else {
                        previewDisk.style.opacity = '0';
                    }
                }
            }
        }
    }

    // 勝利判定（正方形の四頂点）
    // 勝利した場合は、その正方形の座標を配列で返す
    function checkWin(player, currentBoard = board) {
        // 盤面サイズが大きくなったので、sizeの最大値を調整する必要がある
        // sizeは少なくとも1から始まり、盤面の最小辺の長さ-1まで探索できる
        const maxPossibleSize = Math.min(ROWS, COLS) -1; 

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (currentBoard[r][c] === player) {
                    // sizeは1から、正方形の大きさを意味する
                    for (let size = 1; size <= maxPossibleSize; size++) {
                        const r2 = r + size; // 右下隅の行
                        const c2 = c + size; // 右下隅の列

                        // 盤面の境界チェック
                        if (r2 >= ROWS || c2 >= COLS) {
                            continue; // このサイズの正方形は盤面に収まらない
                        }

                        if (
                            currentBoard[r][c2] === player &&
                            currentBoard[r2][c] === player &&
                            currentBoard[r2][c2] === player
                        ) {
                            // 勝利した正方形の座標を返す
                            return [
                                { row: r, col: c },
                                { row: r, col: c2 },
                                { row: r2, col: c },
                                { row: r2, col: c2 }
                            ];
                        }
                    }
                }
            }
        }
        return null; // 勝利なし
    }

    // 引き分け判定
    function checkDraw(currentBoard = board) {
        return currentBoard.every(row => row.every(cell => cell !== 0));
    }

    // 勝利した正方形をハイライト表示
    function highlightWinningSquare(coords) {
        coords.forEach(coord => {
            const cell = gameBoard.querySelector(`[data-row="${coord.row}"][data-col="${coord.col}"]`);
            if (cell) {
                cell.classList.add('win-highlight');
            }
        });
    }

    // 指定された列で石を置ける最も下の行を取得
    function getAvailableRow(col, currentBoard) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (currentBoard[r][col] === 0) {
                return r;
            }
        }
        return -1; // その列は満杯
    }

    // --- ミニマックス法の実装 ---

    // コンピュータが手を打つ
    function makeComputerMove() {
        if (gameOver) return;

        let bestScore = -Infinity;
        let bestMoves = []; // スコアが同じ手を複数格納する配列

        // 最も中央に近い列から探索することで、パフォーマンスを向上させる可能性
        const orderedCols = Array.from({length: COLS}, (_, i) => i);
        const centerCol = Math.floor(COLS / 2);
        orderedCols.sort((a, b) => Math.abs(a - centerCol) - Math.abs(b - centerCol));

        for (let col of orderedCols) {
            const row = getAvailableRow(col, board);
            if (row !== -1) {
                // 仮のボードを作成し、手を打ってみる
                let tempBoard = board.map(arr => [...arr]);
                tempBoard[row][col] = AI_PLAYER;

                // ミニマックスを呼び出し、この手のスコアを取得
                // 相手の番になるので isMaximizingPlayer は false
                let score = minimax(tempBoard, MAX_DEPTH, -Infinity, Infinity, false);

                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [col]; // より良いスコアが見つかったのでリセット
                } else if (score === bestScore) {
                    bestMoves.push(col); // 同じスコアなので追加
                }
            }
        }

        let chosenCol = -1;
        if (bestMoves.length > 0) {
            // スコアが同じ手の中からランダムに選択
            chosenCol = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        } else {
            // 万が一最適な手が見つからなければ、ランダムな手を選択（安全のため）
            const availableCols = [];
            for(let c = 0; c < COLS; c++) {
                if(getAvailableRow(c, board) !== -1) {
                    availableCols.push(c);
                }
            }
            if(availableCols.length > 0) {
                 chosenCol = availableCols[Math.floor(Math.random() * availableCols.length)];
            }
        }

        // 最適な手があれば打つ
        if (chosenCol !== -1) {
            makeMove(chosenCol);
        }
    }

    // ミニマックス関数 (alpha-beta pruning 付き)
    function minimax(currentBoard, depth, alpha, beta, isMaximizingPlayer) {
        // 終端状態チェック (勝利、引き分け、または探索深さに到達)
        const player = isMaximizingPlayer ? AI_PLAYER : (AI_PLAYER === 1 ? 2 : 1); // 現在の手番のプレイヤー
        const opponent = isMaximizingPlayer ? (AI_PLAYER === 1 ? 2 : 1) : AI_PLAYER; // 相手プレイヤー

        // 勝利判定
        if (checkWin(AI_PLAYER, currentBoard)) {
            return 10000000 + depth; // AIが勝つ場合は非常に高いスコア (深さが浅いほど良い)
        } else if (checkWin(opponent, currentBoard)) {
            return -10000000 - depth; // 相手が勝つ場合は非常に低いスコア (深さが浅いほど悪い)
        } else if (checkDraw(currentBoard)) {
            return 0; // 引き分け
        }

        // 探索深さに到達
        if (depth === 0) {
            return evaluateBoard(currentBoard); // 評価関数で盤面を評価
        }

        // 最大化プレイヤー (AI)
        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            // 列の探索順序を中央から外側へ変更 (パフォーマンス最適化)
            const orderedCols = Array.from({length: COLS}, (_, i) => i);
            const centerCol = Math.floor(COLS / 2);
            orderedCols.sort((a, b) => Math.abs(a - centerCol) - Math.abs(b - centerCol));

            for (let col of orderedCols) {
                const row = getAvailableRow(col, currentBoard);
                if (row !== -1) {
                    let tempBoard = currentBoard.map(arr => [...arr]);
                    tempBoard[row][col] = AI_PLAYER;
                    let eval = minimax(tempBoard, depth - 1, alpha, beta, false); // 相手の番
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                    if (beta <= alpha) {
                        break; // Alpha-Beta Pruning
                    }
                }
            }
            return maxEval;
        } 
        // 最小化プレイヤー (人間)
        else {
            let minEval = Infinity;
            // 列の探索順序を中央から外側へ変更 (パフォーマンス最適化)
            const orderedCols = Array.from({length: COLS}, (_, i) => i);
            const centerCol = Math.floor(COLS / 2);
            orderedCols.sort((a, b) => Math.abs(a - centerCol) - Math.abs(b - centerCol));

            for (let col of orderedCols) {
                const row = getAvailableRow(col, currentBoard);
                if (row !== -1) {
                    let tempBoard = currentBoard.map(arr => [...arr]);
                    tempBoard[row][col] = (AI_PLAYER === 1 ? 2 : 1); // 相手の石を置く
                    let eval = minimax(tempBoard, depth - 1, alpha, beta, true); // AIの番
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    if (beta <= alpha) {
                        break; // Alpha-Beta Pruning
                    }
                }
            }
            return minEval;
        }
    }

    // 盤面を評価する関数
    function evaluateBoard(currentBoard) {
        let score = 0;
        const HUMAN_PLAYER = AI_PLAYER === 1 ? 2 : 1;

        // 1. 各列の中央に近いほどボーナス
        const centerCol = Math.floor(COLS / 2); 
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (currentBoard[r][c] === AI_PLAYER) { 
                    const distanceToCenter = Math.abs(c - centerCol);
                    score += (Math.floor(COLS / 2) - distanceToCenter) * 3; 
                }
            }
        }

        // 2. 正方形の形成に関する部分的なリーチを評価
        const maxPossibleSquareSize = Math.min(ROWS, COLS) - 1; 

        for (let player of [AI_PLAYER, HUMAN_PLAYER]) {
            const multiplier = (player === AI_PLAYER) ? 1 : -1;

            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (currentBoard[r][c] === player) {
                        for (let size = 1; size <= maxPossibleSquareSize; size++) {
                            const r2 = r + size;
                            const c2 = c + size;

                            if (r2 >= ROWS || c2 >= COLS) {
                                continue;
                            }

                            const p1 = currentBoard[r][c];
                            const p2 = currentBoard[r][c2];
                            const p3 = currentBoard[r2][c];
                            const p4 = currentBoard[r2][c2];

                            const points = [p1, p2, p3, p4];
                            let ownStones = points.filter(p => p === player).length;
                            let opponentStones = points.filter(p => p === (player === 1 ? 2 : 1)).length;
                            let emptySpots = points.filter(p => p === 0).length;

                            if (opponentStones > 0) continue;

                            if (ownStones === 3 && emptySpots === 1) {
                                score += 5000 * multiplier;
                            } else if (ownStones === 2 && emptySpots === 2) {
                                score += 50 * multiplier;
                            }
                            else if (ownStones === 1 && emptySpots === 3) {
                                score += 5 * multiplier;
                            }
                        }
                    }
                }
            }

            // 3. 縦、横、斜めでの連続する石の数も評価に加える
            for (let i = 0; i < ROWS; i++) {
                for (let j = 0; j < COLS; j++) {
                    if (currentBoard[i][j] === player) {
                        // 水平方向
                        if (j + 1 < COLS && currentBoard[i][j+1] === player) { 
                            score += 1 * multiplier;
                            if (j + 2 < COLS && currentBoard[i][j+2] === player) { 
                                score += 2 * multiplier; 
                            }
                        }
                        // 垂直方向
                        if (i + 1 < ROWS && currentBoard[i+1][j] === player) { 
                            score += 1 * multiplier;
                            if (i + 2 < ROWS && currentBoard[i+2][j] === player) { 
                                score += 2 * multiplier;
                            }
                        }
                        // 右下斜め
                        if (i + 1 < ROWS && j + 1 < COLS && currentBoard[i+1][j+1] === player) { 
                            score += 1 * multiplier;
                            if (i + 2 < ROWS && j + 2 < COLS && currentBoard[i+2][j+2] === player) { 
                                score += 2 * multiplier;
                            }
                        }
                        // 左下斜め
                        if (i + 1 < ROWS && j - 1 >= 0 && currentBoard[i+1][j-1] === player) { 
                            score += 1 * multiplier;
                            if (i + 2 < ROWS && j - 2 >= 0 && currentBoard[i+2][j-2] === player) { 
                                score += 2 * multiplier;
                            }
                        }
                    }
                }
            }
        }
        return score;
    }


    // リセットボタンのイベントリスナー
    resetButton.addEventListener('click', initializeBoard);

    // モード切り替えスイッチのイベントリスナー
    modeToggle.addEventListener('change', () => {
        isVsComputerMode = modeToggle.checked;
        modeLabel.textContent = isVsComputerMode ? 'CPU対戦モード' : '対人モード';
        // モード切り替え時にボードをリセットし、先手後手を切り替える
        humanStarts = true; // 新しいモードでは人間が初期の先手となるようにリセット
        initializeBoard(); 
    });

    // 盤面サイズ切り替えラジオボタンのイベントリスナー
    boardSizeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            setBoardSize(event.target.value); // 選択されたサイズに基づいてボードをセットアップ
        });
    });

    // 初期起動時にデフォルトの盤面サイズを設定
    setBoardSize('small'); // デフォルトは6x7 (標準)
});