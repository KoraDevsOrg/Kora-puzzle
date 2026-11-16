let moves = 0;
let timerSeconds = 0;
let timerInterval = null;
let selectedTile = null;

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

        // Ocultar menú y mostrar pantalla de juego correctamente
        document.getElementById('view-menu').classList.add('hidden');
        document.getElementById('view-game').classList.remove('hidden');

        initPuzzle(selectedImageSrc, size, mode);
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

function initPuzzle(imgSrc, size, mode) {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = '';
    moves = 0;
    selectedTile = null;
    document.getElementById('move-count').textContent = moves;

    if (mode === 'modern') {
        initModernPolyominoPuzzle(board, size, imgSrc);
    } else {
        initClassicPuzzle(board, size, imgSrc);
    }

    startTimer();
}

/* MODO CLÁSICO: Cuadrícula estándar 1x1 */
function initClassicPuzzle(board, size, imgSrc) {
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    let total = size * size;
    let pieces = [];
    for (let i = 0; i < total; i++) pieces.push(i);

    do {
        pieces.sort(() => Math.random() - 0.5);
    } while (isSolved(pieces));

    pieces.forEach((origIdx, currIdx) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        tile.dataset.original = origIdx;

        const col = origIdx % size;
        const row = Math.floor(origIdx / size);
        const div = size > 1 ? size - 1 : 1;

        tile.style.backgroundImage = `url(${imgSrc})`;
        tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
        tile.style.backgroundPosition = `${(col * 100) / div}% ${(row * 100) / div}%`;

        setupClassicInteraction(tile, board);
        board.appendChild(tile);
    });
}

/* MODO MODERNO: Bloques Irregulares / Poliminós (Estilo Bloques Deslizantes) */
function initModernPolyominoPuzzle(board, size, imgSrc) {
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    let blocks = [];
    if (size === 4) {
        // Estructura de bloques asimétricos con spans (ancho y alto variable)
        blocks = [
            { id: 0, r: 0, c: 0, rs: 1, cs: 2 },
            { id: 1, r: 0, c: 2, rs: 2, cs: 1 },
            { id: 2, r: 0, c: 3, rs: 1, cs: 1 },
            { id: 3, r: 1, c: 0, rs: 2, cs: 1 },
            { id: 4, r: 1, c: 1, rs: 1, cs: 2 },
            { id: 5, r: 1, c: 3, rs: 2, cs: 1 },
            { id: 6, r: 2, c: 1, rs: 1, cs: 1 },
            { id: 7, r: 2, c: 2, rs: 2, cs: 2 },
            { id: 8, r: 3, c: 0, rs: 1, cs: 1 },
            { id: 9, r: 3, c: 1, rs: 1, cs: 1 }
        ];
    } else {
        // Generador dinámico para otros tamaños
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                blocks.push({ id: blocks.length, r, c, rs: 1, cs: 1 });
            }
        }
    }

    let shuffledCoords = blocks.map(b => ({ r: b.r, c: b.c }));
    do {
        shuffledCoords.sort(() => Math.random() - 0.5);
    } while (blocks.every((b, idx) => b.r === shuffledCoords[idx].r && b.c === shuffledCoords[idx].c));

    blocks.forEach((block, index) => {
        const tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        tile.dataset.originalId = block.id;
        tile.dataset.origR = block.r;
        tile.dataset.origC = block.c;

        const targetCoord = shuffledCoords[index];
        tile.style.gridRow = `${targetCoord.r + 1} / span ${block.rs}`;
        tile.style.gridColumn = `${targetCoord.c + 1} / span ${block.cs}`;
        tile.dataset.currR = targetCoord.r;
        tile.dataset.currC = targetCoord.c;

        const bgX = (block.c * 100) / (size - block.cs || 1);
        const bgY = (block.r * 100) / (size - block.rs || 1);

        tile.style.backgroundImage = `url(${imgSrc})`;
        tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
        tile.style.backgroundPosition = `${bgX}% ${bgY}%`;

        setupModernInteraction(tile, board);
        board.appendChild(tile);
    });
}

function setupModernInteraction(tile, board) {
    tile.addEventListener('click', () => {
        if (!selectedTile) {
            selectedTile = tile;
            tile.classList.add('selected');
        } else if (selectedTile === tile) {
            tile.classList.remove('selected');
            selectedTile = null;
        } else {
            let tempRow = tile.style.gridRow;
            let tempCol = tile.style.gridColumn;
            let tempCurrR = tile.dataset.currR;
            let tempCurrC = tile.dataset.currC;

            tile.style.gridRow = selectedTile.style.gridRow;
            tile.style.gridColumn = selectedTile.style.gridColumn;
            tile.dataset.currR = selectedTile.dataset.currR;
            tile.dataset.currC = selectedTile.dataset.currC;

            selectedTile.style.gridRow = tempRow;
            selectedTile.style.gridColumn = tempCol;
            selectedTile.dataset.currR = tempCurrR;
            selectedTile.dataset.currC = tempCurrC;

            selectedTile.classList.remove('selected');
            selectedTile = null;

            moves++;
            document.getElementById('move-count').textContent = moves;

            checkModernWin(board);
        }
    });
}

function setupClassicInteraction(tile, board) {
    tile.addEventListener('click', () => {
        if (!selectedTile) {
            selectedTile = tile;
            tile.classList.add('selected');
        } else if (selectedTile === tile) {
            tile.classList.remove('selected');
            selectedTile = null;
        } else {
            let tempBg = tile.style.backgroundPosition;
            let tempOrig = tile.dataset.original;

            tile.style.backgroundPosition = selectedTile.style.backgroundPosition;
            tile.dataset.original = selectedTile.dataset.original;

            selectedTile.style.backgroundPosition = tempBg;
            selectedTile.dataset.original = tempOrig;

            selectedTile.classList.remove('selected');
            selectedTile = null;

            moves++;
            document.getElementById('move-count').textContent = moves;

            checkClassicWin(board);
        }
    });
}

function isSolved(pieces) {
    return pieces.every((val, idx) => val === idx);
}

function checkClassicWin(board) {
    const tiles = board.querySelectorAll('.puzzle-tile');
    let arr = Array.from(tiles).map(t => parseInt(t.dataset.original, 10));
    if (isSolved(arr)) {
        clearInterval(timerInterval);
        document.getElementById('win-modal').classList.remove('hidden');
    }
}

function checkModernWin(board) {
    const tiles = board.querySelectorAll('.puzzle-tile');
    let won = Array.from(tiles).every(t => t.dataset.currR === t.dataset.origR && t.dataset.currC === t.dataset.origC);
    if (won) {
        clearInterval(timerInterval);
        document.getElementById('win-modal').classList.remove('hidden');
    }
}
