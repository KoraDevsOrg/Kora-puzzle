window.KoraModernPuzzle = {
    init(imgSrc) {
        const board = document.getElementById('puzzle-board');
        const tray = document.getElementById('puzzle-tray');
        board.innerHTML = '';
        tray.innerHTML = '';

        const totalPieces = 4;
        let placedCount = 0;
        document.getElementById('total-target').textContent = totalPieces;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(4, 1fr)`;
        board.style.gridTemplateRows = `repeat(4, 1fr)`;

        let tetrisPieces = [
            { id: 0, shape: 'L', r: 0, c: 0, rs: 2, cs: 2, w: 130, h: 130 },
            { id: 1, shape: 'T', r: 0, c: 2, rs: 2, cs: 2, w: 130, h: 130 },
            { id: 2, shape: 'Z', r: 2, c: 0, rs: 2, cs: 2, w: 130, h: 130 },
            { id: 3, shape: 'I', r: 2, c: 2, rs: 2, cs: 2, w: 130, h: 130 }
        ];

        let shuffled = [...tetrisPieces].sort(() => Math.random() - 0.5);

        tetrisPieces.forEach((tp) => {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.targetId = tp.id;
            cell.style.gridRow = `${tp.r + 1} / span ${tp.rs}`;
            cell.style.gridColumn = `${tp.c + 1} / span ${tp.cs}`;
            board.appendChild(cell);
        });

        shuffled.forEach((tp) => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.pieceId = tp.id;
            piece.draggable = true;
            piece.style.width = `${tp.w}px`;
            piece.style.height = `${tp.h}px`;

            const bgX = (tp.c * 100) / 3;
            const bgY = (tp.r * 100) / 3;

            piece.style.backgroundImage = `url(${imgSrc})`;
            piece.style.backgroundSize = `300% 300%`;
            piece.style.backgroundPosition = `${bgX}% ${bgY}%`;
            piece.style.clipPath = this.getClipPath(tp.shape);

            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tp.id);
            });

            tray.appendChild(piece);
        });

        document.querySelectorAll('.board-cell').forEach(cell => {
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const pieceId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const targetId = parseInt(cell.dataset.targetId, 10);

                if (pieceId === targetId && cell.children.length === 0) {
                    const pieceEl = document.querySelector(`[data-piece-id='${pieceId}']`);
                    if (pieceEl) {
                        cell.appendChild(pieceEl);
                        pieceEl.draggable = false;
                        pieceEl.style.width = '100%';
                        pieceEl.style.height = '100%';
                        pieceEl.style.position = 'static';
                        pieceEl.style.boxShadow = 'none';
                        placedCount++;
                        document.getElementById('score-count').textContent = placedCount;

                        if (placedCount === totalPieces) {
                            window.KoraCore.triggerWin();
                        }
                    }
                }
            });
        });
    },

    getClipPath(shape) {
        switch(shape) {
            case 'L': return 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 0% 100%)';
            case 'T': return 'polygon(0% 0%, 100% 0%, 100% 50%, 75% 50%, 75% 100%, 25% 100%, 25% 50%, 0% 50%)';
            case 'Z': return 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 50% 100%, 50% 50%, 0% 50%)';
            default: return 'polygon(0% 25%, 100% 25%, 100% 75%, 0% 75%)';
        }
    }
};
