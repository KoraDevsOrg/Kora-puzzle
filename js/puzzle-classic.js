window.KoraClassicPuzzle = {
    init(imgSrc, size) {
        const board = document.getElementById('puzzle-board');
        const tray = document.getElementById('puzzle-tray');
        board.innerHTML = '';
        tray.innerHTML = '';

        const totalPieces = size * size;
        let placedCount = 0;
        document.getElementById('total-target').textContent = totalPieces;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

        let ids = [];
        for (let i = 0; i < totalPieces; i++) ids.push(i);
        ids.sort(() => Math.random() - 0.5);

        // Crear celdas de destino
        for (let i = 0; i < totalPieces; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.targetId = i;
            board.appendChild(cell);
        }

        // Crear piezas en la bandeja con HTML5 Drag and Drop nativo optimizado
        ids.forEach((id) => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.pieceId = id;
            piece.draggable = true;
            piece.style.width = `${300 / size}px`;
            piece.style.height = `${300 / size}px`;

            const col = id % size;
            const row = Math.floor(id / size);
            const div = size > 1 ? size - 1 : 1;

            piece.style.backgroundImage = `url(${imgSrc})`;
            piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
            piece.style.backgroundPosition = `${(col * 100) / div}% ${(row * 100) / div}%`;

            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', id);
            });

            tray.appendChild(piece);
        });

        // Habilitar soltar en las celdas
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
    }
};
