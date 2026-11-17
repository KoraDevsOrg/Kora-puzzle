window.KoraClassicPuzzle = {
    selectedPieceId: null,

    init(imgSrc, size) {
        const board = document.getElementById('puzzle-board');
        const tray = document.getElementById('puzzle-tray');
        board.innerHTML = '';
        tray.innerHTML = '';
        this.selectedPieceId = null;

        const totalPieces = size * size;
        let placedCount = 0;
        document.getElementById('total-target').textContent = totalPieces;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

        let ids = [];
        for (let i = 0; i < totalPieces; i++) ids.push(i);
        ids.sort(() => Math.random() - 0.5);

        // Crear celdas de destino en el tablero
        for (let i = 0; i < totalPieces; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.targetId = i;

            // Selección por toque en móvil para colocar pieza
            cell.addEventListener('click', () => {
                if (this.selectedPieceId !== null && cell.children.length === 0) {
                    const targetId = parseInt(cell.dataset.targetId, 10);
                    if (this.selectedPieceId === targetId) {
                        const pieceEl = document.querySelector(`[data-piece-id='${this.selectedPieceId}']`);
                        if (pieceEl) {
                            cell.appendChild(pieceEl);
                            pieceEl.classList.remove('selected');
                            pieceEl.style.width = '100%';
                            pieceEl.style.height = '100%';
                            pieceEl.style.boxShadow = 'none';
                            this.selectedPieceId = null;
                            placedCount++;
                            document.getElementById('score-count').textContent = placedCount;

                            if (placedCount === totalPieces) {
                                window.KoraCore.triggerWin();
                            }
                        }
                    }
                }
            });

            board.appendChild(cell);
        }

        // Crear piezas en la bandeja con tamaño adaptativo escalable (soporta N piezas perfectamente)
        const pieceSize = Math.max(45, Math.floor(260 / size));

        ids.forEach((id) => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.pieceId = id;
            piece.style.width = `${pieceSize}px`;
            piece.style.height = `${pieceSize}px`;

            const col = id % size;
            const row = Math.floor(id / size);
            const div = size > 1 ? size - 1 : 1;

            piece.style.backgroundImage = `url(${imgSrc})`;
            piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
            piece.style.backgroundPosition = `${(col * 100) / div}% ${(row * 100) / div}%`;
            piece.style.borderRadius = '4px';

            // Interacción táctil robusta (Tap para seleccionar y colocar)
            piece.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.puzzle-piece').forEach(p => p.classList.remove('selected'));
                if (this.selectedPieceId === id) {
                    this.selectedPieceId = null;
                } else {
                    this.selectedPieceId = id;
                    piece.classList.add('selected');
                }
            });

            tray.appendChild(piece);
        });
    }
};
