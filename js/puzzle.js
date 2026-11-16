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

        initEngine(selectedImageSrc, size, mode);
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

function initEngine(imgSrc, size, mode) {
    const board = document.getElementById('puzzle-board');
    const tray = document.getElementById('puzzle-tray');
    board.innerHTML = '';
    tray.innerHTML = '';
    placedCount = 0;

    if (mode === 'classic') {
        // MODO CLÁSICO: Jigsaw con bordes curvos entrelazados simulados por SVG ClipPath
        totalPiecesCount = size * size;
        document.getElementById('total-target').textContent = totalPiecesCount;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

        let ids = [];
        for (let i = 0; i < totalPiecesCount; i++) ids.push(i);
        ids.sort(() => Math.random() - 0.5);

        for (let i = 0; i < totalPiecesCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.targetId = i;
            board.appendChild(cell);
        }

        ids.forEach((id) => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.pieceId = id;
            piece.style.width = '70px';
            piece.style.height = '70px';

            const col = id % size;
            const row = Math.floor(id / size);
            const div = size > 1 ? size - 1 : 1;

            piece.style.backgroundImage = `url(${imgSrc})`;
            piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
            piece.style.backgroundPosition = `${(col * 100) / div}% ${(row * 100) / div}%`;
            piece.style.borderRadius = '8px'; // Simula borde curvo de pieza clásica

            initTouchDrag(piece);
            tray.appendChild(piece);
        });

    } else {
        // MODO MODERNO: Piezas tipo Tetris (L, T, Z, I) en cuadrícula 4x4
        totalPiecesCount = 4;
        document.getElementById('total-target').textContent = totalPiecesCount;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(4, 1fr)`;
        board.style.gridTemplateRows = `repeat(4, 1fr)`;

        // Formas Tetris compuestas
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
            piece.style.width = `${tp.w}px`;
            piece.style.height = `${tp.h}px`;

            const bgX = (tp.c * 100) / 3;
            const bgY = (tp.r * 100) / 3;

            piece.style.backgroundImage = `url(${imgSrc})`;
            piece.style.backgroundSize = `300% 300%`;
            piece.style.backgroundPosition = `${bgX}% ${bgY}%`;
            piece.style.clipPath = getTetrisClipPath(tp.shape); // Genera la forma exacta L, T, Z

            initTouchDrag(piece);
            tray.appendChild(piece);
        });
    }

    startTimer();
}

/* ==========================================
   MOTOR UNIVERSAL DE ARRASTRE TÁCTIL Y MOUSE (Touch & Drop)
   ========================================== */
function initTouchDrag(piece) {
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;

    function dragStart(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;

        const rect = piece.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;

        piece.classList.add('dragging');
        piece.style.left = `${initialX}px`;
        piece.style.top = `${initialY}px`;

        if (e.type === 'touchstart') {
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('touchend', dragEnd);
        } else {
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
        }
    }

    function dragMove(e) {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        piece.style.left = `${initialX + dx}px`;
        piece.style.top = `${initialY + dy}px`;
    }

    function dragEnd(e) {
        piece.classList.remove('dragging');
        piece.style.left = '';
        piece.style.top = '';

        if (e.type === 'touchend') {
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('touchend', dragEnd);
        } else {
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
        }

        // Comprobar colisión con las celdas del tablero
        const touchX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const touchY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const cells = document.querySelectorAll('.board-cell');
        let matched = false;

        cells.forEach(cell => {
            const rect = cell.getBoundingClientRect();
            if (
                touchX >= rect.left && touchX <= rect.right &&
                touchY >= rect.top && touchY <= rect.bottom
            ) {
                const pieceId = parseInt(piece.dataset.pieceId, 10);
                const targetId = parseInt(cell.dataset.targetId, 10);

                if (pieceId === targetId && cell.children.length === 0) {
                    cell.appendChild(piece);
                    piece.style.width = '100%';
                    piece.style.height = '100%';
                    piece.style.position = 'static';
                    piece.style.boxShadow = 'none';
                    matched = true;
                    placedCount++;
                    document.getElementById('score-count').textContent = placedCount;

                    if (placedCount === totalPiecesCount) {
                        clearInterval(timerInterval);
                        document.getElementById('win-modal').classList.remove('hidden');
                    }
                }
            }
        });
    }

    piece.addEventListener('mousedown', dragStart);
    piece.addEventListener('touchstart', dragStart, { passive: false });
}

/* Formas poligonales estilo Tetris (L, T, Z, I) */
function getTetrisClipPath(shape) {
    switch(shape) {
        case 'L': return 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 0% 100%)';
        case 'T': return 'polygon(0% 0%, 100% 0%, 100% 50%, 75% 50%, 75% 100%, 25% 100%, 25% 50%, 0% 50%)';
        case 'Z': return 'polygon(0% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 100%, 50% 100%, 50% 50%, 0% 50%)';
        default: return 'polygon(0% 25%, 100% 25%, 100% 75%, 0% 75%)';
    }
}
