const STORAGE_IMG = 'kora_puzzle_image';
const STORAGE_SIZE = 'kora_puzzle_size';

let moves = 0;
let timerSeconds = 0;
let timerInterval = null;
let isPlaying = false;

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

function initBlockPuzzle() {
    const board = document.getElementById('block-puzzle-board');
    if (!board) return;

    const imgSrc = sessionStorage.getItem(STORAGE_IMG) || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800';
    const size = parseInt(sessionStorage.getItem(STORAGE_SIZE) || '4', 10);

    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    let totalPieces = size * size;
    let pieces = [];

    // Generar índices originales
    for (let i = 0; i < totalPieces; i++) {
        pieces.push(i);
    }

    // Mezclar piezas asegurando que no queden ordenadas de inicio
    do {
        pieces.sort(() => Math.random() - 0.5);
    } while (isSolved(pieces));

    renderBlockBoard(board, pieces, size, imgSrc);
    startTimer();
}

function renderBlockBoard(board, pieces, size, imgSrc) {
    board.innerHTML = '';
    moves = 0;
    document.getElementById('move-count').textContent = moves;

    let selectedTile = null;

    pieces.forEach((originalIndex, currentIndex) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        tile.dataset.current = currentIndex;
        tile.dataset.original = originalIndex;

        // Calcular posición de recorte en la imagen de fondo (Sprite slicing)
        const x = (originalIndex % size) * (100 / (size - 1));
        const y = Math.floor(originalIndex / size) * (100 / (size - 1));

        tile.style.backgroundImage = `url(${imgSrc})`;
        tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
        tile.style.backgroundPosition = `${x}% ${y}%`;
        tile.style.cursor = 'pointer';
        tile.style.border = '1px solid rgba(255,255,255,0.2)';
        tile.style.transition = 'transform 0.15s, border-color 0.15s';

        // Evento de selección e intercambio (ideal para táctil y mouse)
        tile.addEventListener('click', () => {
            if (!selectedTile) {
                selectedTile = tile;
                tile.style.borderColor = '#10b981';
                tile.style.transform = 'scale(0.95)';
            } else if (selectedTile === tile) {
                selectedTile.style.borderColor = 'rgba(255,255,255,0.2)';
                selectedTile.style.transform = 'scale(1)';
                selectedTile = null;
            } else {
                // Intercambiar fondos e índices
                let tempBg = tile.style.backgroundPosition;
                let tempOrig = tile.dataset.original;

                tile.style.backgroundPosition = selectedTile.style.backgroundPosition;
                tile.dataset.original = selectedTile.dataset.original;

                selectedTile.style.backgroundPosition = tempBg;
                selectedTile.dataset.original = tempOrig;

                selectedTile.style.borderColor = 'rgba(255,255,255,0.2)';
                selectedTile.style.transform = 'scale(1)';
                selectedTile = null;

                moves++;
                document.getElementById('move-count').textContent = moves;

                checkWinCondition(board);
            }
        });

        board.appendChild(tile);
    });
}

function initClassicPuzzle() {
    // Reutiliza la misma lógica modular para el modo clásico
    initBlockPuzzle();
}

function isSolved(pieces) {
    return pieces.every((val, idx) => val === idx);
}

function checkWinCondition(board) {
    const tiles = board.querySelectorAll('.puzzle-tile');
    let currentArr = Array.from(tiles).map(t => parseInt(t.dataset.original, 10));

    if (isSolved(currentArr)) {
        clearInterval(timerInterval);
        document.getElementById('win-modal').classList.remove('hidden');
    }
}
