let moves = 0;
let timerSeconds = 0;
let timerInterval = null;

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
                imageUrlInput.value = "[Imagen Local Seleccionada]";
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('start-game-btn').addEventListener('click', () => {
        const mode = document.getElementById('game-mode').value;
        const size = parseInt(document.getElementById('grid-size').value, 10);

        document.getElementById('view-menu').classList.add('hidden');
        document.getElementById('view-game').classList.remove('hidden');

        initPuzzleGame(selectedImageSrc, size, mode);
    });

    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        clearInterval(timerInterval);
        document.getElementById('view-game').classList.add('hidden');
        document.getElementById('win-modal').classList.add('hidden');
        document.getElementById('view-menu').classList.remove('hidden');
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
        document.getElementById('win-modal').classList.add('hidden');
        document.getElementById('view-game').classList.add('hidden');
        document.getElementById('view-menu').classList.remove('hidden');
    });
});

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

function initPuzzleGame(imgSrc, size, mode) {
    const board = document.getElementById('puzzle-board');
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    let totalPieces = size * size;
    let pieces = [];

    for (let i = 0; i < totalPieces; i++) {
        pieces.push(i);
    }

    do {
        pieces.sort(() => Math.random() - 0.5);
    } while (isSolved(pieces));

    renderBoard(board, pieces, size, imgSrc);
    startTimer();
}

function renderBoard(board, pieces, size, imgSrc) {
    board.innerHTML = '';
    moves = 0;
    document.getElementById('move-count').textContent = moves;

    let selectedTile = null;
    const divisor = size > 1 ? size - 1 : 1;

    pieces.forEach((originalIndex, currentIndex) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        tile.dataset.current = currentIndex;
        tile.dataset.original = originalIndex;

        const col = originalIndex % size;
        const row = Math.floor(originalIndex / size);

        const x = (col * 100) / divisor;
        const y = (row * 100) / divisor;

        tile.style.backgroundImage = `url(${imgSrc})`;
        tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
        tile.style.backgroundPosition = `${x}% ${y}%`;

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
