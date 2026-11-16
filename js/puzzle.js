let timerSeconds = 0;
let timerInterval = null;
let placedCount = 0;
let totalPiecesCount = 0;

document.addEventListener("DOMContentLoaded", () => {
    const imageUrlInput = document.getElementById('image-url');
    const localImageInput = document.getElementById('local-image');
    const imagePreview = document.getElementById('image-preview');
    let selectedImageSrc = imageUrlInput.value;

    imageUrlInput.addEventListener('input', (e) => {
        selectedImageSrc = e.target.value;
        imagePreview.src = selectedImageSrc;
    });

    localImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                selectedImageSrc = event.target.result;
                imagePreview.src = selectedImageSrc;
                imageUrlInput.value = "[Imagen Local]";
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('start-game-btn').addEventListener('click', () => {
        const mode = document.getElementById('game-mode').value;
        const size = parseInt(document.getElementById('grid-size').value, 10);

        document.getElementById('view-menu').classList.add('hidden');
        document.getElementById('view-game').classList.remove('hidden');

        initAssemblyPuzzle(selectedImageSrc, size, mode);
    });

    document.getElementById('back-to-menu-btn').addEventListener('click', resetToMenu);
    document.getElementById('play-again-btn').addEventListener('click', () => {
        document.getElementById('win-modal').classList.add('hidden');
        resetToMenu();
    });
});

function resetToMenu() {
    clearInterval(timerInterval);
    document.getElementById('view-game').classList.add('hidden');
    document.getElementById('win-modal').classList.add('hidden');
    document.getElementById('view-menu').classList.remove('hidden');
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerSeconds = 0;
    timerInterval = setInterval(() => {
        timerSeconds++;
        const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
        const secs = (timerSeconds % 60).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
}

function initAssemblyPuzzle(imgSrc, size, mode) {
    const board = document.getElementById('puzzle-board');
    const tray = document.getElementById('puzzle-tray');
    board.innerHTML = '';
    tray.innerHTML = '';
    placedCount = 0;

    if (mode === 'classic') {
        // Modo Clásico: Cuadrículas estándar 1x1 estilo Jigsaw de caja
        totalPiecesCount = size * size;
        document.getElementById('total-target').textContent = totalPiecesCount;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

        let piecesData = [];
        for (let i = 0; i < totalPiecesCount; i++) {
            piecesData.push(i);
        }
        piecesData.sort(() => Math.random() - 0.5);

        // Crear celdas de destino en el tablero
        for (let i = 0; i < totalPiecesCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.targetIndex = i;

            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const pieceId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (parseInt(cell.dataset.targetIndex, 10) === pieceId && cell.children.length === 0) {
                    const pieceEl = document.querySelector(`[data-piece-id='${pieceId}']`);
                    if (pieceEl) {
                        cell.appendChild(pieceEl);
                        pieceEl.draggable = false;
                        pieceEl.style.width = '100%';
                        pieceEl.style.height = '100%';
                        pieceEl.style.boxShadow = 'none';
                        placedCount++;
                        document.getElementById('score-count').textContent = placedCount;
                        checkWinCondition();
                    }
                }
            });
            board.appendChild(cell);
        }

        // Crear piezas en la bandeja
        piecesData.forEach((origIdx) => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.pieceId = origIdx;
            piece.draggable = true;
            piece.style.width = '60px';
            piece.style.height = '60px';

            const col = origIdx % size;
            const row = Math.floor(origIdx / size);
            const div = size > 1 ? size - 1 : 1;

            piece.style.backgroundImage = `url(${imgSrc})`;
            piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
            piece.style.backgroundPosition = `${(col * 100) / div}% ${(row * 100) / div}%`;

            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', origIdx);
            });

            tray.appendChild(piece);
        });

    } else {
        // Modo Moderno: Piezas asimétricas estilo Tetris / Dominó (Vertical y Horizontal)
        totalPiecesCount = 5; // Bloques compuestos
        document.getElementById('total-target').textContent = totalPiecesCount;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(4, 1fr)`;
        board.style.gridTemplateRows = `repeat(4, 1fr)`;

        let polyominos = [
            { id: 0, r: 0, c: 0, rs: 1, cs: 2, w: 120, h: 60 }, // Dominó Horizontal
            { id: 1, r: 0, c: 2, rs: 2, cs: 1, w: 60, h: 120 }, // Dominó Vertical
            { id: 2, r: 2, c: 0, rs: 2, cs: 2, w: 120, h: 120 }, // Bloque Cuadrado 2x2
            { id: 3, r: 2, c: 2, rs: 1, cs: 2, w: 120, h: 60 }, // Dominó Horizontal
            { id: 4, r: 3, c: 2, rs: 1, cs: 2, w: 120, h: 60 }  // Dominó Horizontal
        ];

        let shuffledPoly = [...polyominos].sort(() => Math.random() - 0.5);

        // Crear zonas en el tablero moderno
        polyominos.forEach((poly) => {
            const zone = document.createElement('div');
            zone.className = 'board-cell';
            zone.dataset.polyId = poly.id;
            zone.style.gridRow = `${poly.r + 1} / span ${poly.rs}`;
            zone.style.gridColumn = `${poly.c + 1} / span ${poly.cs}`;

            zone.addEventListener('dragover', (e) => e.preventDefault());
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                const droppedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (droppedId === poly.id && zone.children.length === 0) {
                    const pEl = document.querySelector(`[data-poly-id='${droppedId}']`);
                    if (pEl) {
                        zone.appendChild(pEl);
                        pEl.draggable = false;
                        pEl.style.width = '100%';
                        pEl.style.height = '100%';
                        pEl.style.boxShadow = 'none';
                        placedCount++;
                        document.getElementById('score-count').textContent = placedCount;
                        checkWinCondition();
                    }
                }
            });
            board.appendChild(zone);
        });

        // Crear piezas asimétricas en la bandeja
        shuffledPoly.forEach((poly) => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.polyId = poly.id;
            piece.draggable = true;
            piece.style.width = `${poly.w * 0.75}px`;
            piece.style.height = `${poly.h * 0.75}px`;

            const bgX = (poly.c * 100) / 3;
            const bgY = (poly.r * 100) / 3;

            piece.style.backgroundImage = `url(${imgSrc})`;
            piece.style.backgroundSize = `400% 400%`;
            piece.style.backgroundPosition = `${bgX}% ${bgY}%`;

            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', poly.id);
            });

            tray.appendChild(piece);
        });
    }

    startTimer();
}

function checkWinCondition() {
    if (placedCount === totalPiecesCount) {
        clearInterval(timerInterval);
        document.getElementById('win-modal').classList.remove('hidden');
    }
}
