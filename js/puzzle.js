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
    document.getElementById('move-count').textContent = moves;

    if (mode === 'classic') {
        initClassicSlidePuzzle(board, size, imgSrc);
    } else {
        initModernPolyominoDragPuzzle(board, size, imgSrc);
    }

    startTimer();
}

/* ==========================================
   MODO CLÁSICO: Jigsaw Deslizante (Caja con hueco)
   ========================================== */
function initClassicSlidePuzzle(board, size, imgSrc) {
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    let total = size * size;
    let tilesArray = [];
    for (let i = 0; i < total; i++) tilesArray.push(i);

    // Mezclar asegurando que tenga solución
    do {
        tilesArray.sort(() => Math.random() - 0.5);
    } while (isSolved(tilesArray));

    // El último elemento es el espacio vacío inicial
    let emptyIndex = total - 1;

    renderSlideBoard();

    function renderSlideBoard() {
        board.innerHTML = '';
        tilesArray.forEach((origIdx, currIdx) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.dataset.index = currIdx;

            if (origIdx === total - 1) {
                tile.classList.add('empty-tile');
            } else {
                const col = origIdx % size;
                const row = Math.floor(origIdx / size);
                const div = size > 1 ? size - 1 : 1;

                tile.style.backgroundImage = `url(${imgSrc})`;
                tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
                tile.style.backgroundPosition = `${(col * 100) / div}% ${(row * 100) / div}%`;

                // Evento Drag & Drop / Click para mover al espacio vacío
                tile.addEventListener('click', () => tryMove(currIdx));
                
                // Soporte táctil de arrastre hacia la casilla vacía
                tile.draggable = true;
                tile.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', currIdx));
                tile.addEventListener('dragover', (e) => e.preventDefault());
                tile.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    tryMove(fromIdx);
                });
            }

            board.appendChild(tile);
        });
    }

    function tryMove(idx) {
        const r1 = Math.floor(idx / size), c1 = idx % size;
        const r2 = Math.floor(tilesArray.indexOf(total - 1) / size), c2 = tilesArray.indexOf(total - 1) % size;

        // Comprobar si es adyacente al espacio vacío
        const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
        if (dist === 1) {
            const emptyPos = tilesArray.indexOf(total - 1);
            [tilesArray[idx], tilesArray[emptyPos]] = [tilesArray[emptyPos], tilesArray[idx]];
            moves++;
            document.getElementById('move-count').textContent = moves;
            renderSlideBoard();

            if (isSolved(tilesArray)) {
                clearInterval(timerInterval);
                document.getElementById('win-modal').classList.remove('hidden');
            }
        }
    }
}

function isSolved(arr) {
    return arr.every((val, idx) => val === idx);
}

/* ==========================================
   MODO MODERNO: Poliminós / Bloques Irregulares con Drag & Drop libre
   ========================================== */
function initModernPolyominoDragPuzzle(board, size, imgSrc) {
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    // Definir bloques asimétricos modernos (Poliminós)
    let blocks = [
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

    if (size !== 4) {
        blocks = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                blocks.push({ id: blocks.length, r, c, rs: 1, cs: 1 });
            }
        }
    }

    let positions = blocks.map(b => ({ r: b.r, c: b.c }));
    do {
        positions.sort(() => Math.random() - 0.5);
    } while (blocks.every((b, idx) => b.r === positions[idx].r && b.c === positions[idx].c));

    let draggedBlock = null;

    renderPolyBoard();

    function renderPolyBoard() {
        board.innerHTML = '';
        blocks.forEach((block, index) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.dataset.index = index;

            const currentPos = positions[index];
            tile.style.gridRow = `${currentPos.r + 1} / span ${block.rs}`;
            tile.style.gridColumn = `${currentPos.c + 1} / span ${block.cs}`;

            const bgX = (block.c * 100) / (size - block.cs || 1);
            const bgY = (block.r * 100) / (size - block.rs || 1);

            tile.style.backgroundImage = `url(${imgSrc})`;
            tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
            tile.style.backgroundPosition = `${bgX}% ${bgY}%`;

            // Configurar Drag & Drop nativo para escritorio y móvil
            tile.draggable = true;
            
            tile.addEventListener('dragstart', () => {
                draggedBlock = index;
                tile.classList.add('dragging');
            });

            tile.addEventListener('dragend', () => {
                tile.classList.remove('dragging');
            });

            tile.addEventListener('dragover', (e) => e.preventDefault());

            tile.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedBlock !== null && draggedBlock !== index) {
                    // Intercambiar posiciones de los bloques asimétricos
                    [positions[draggedBlock], positions[index]] = [positions[index], positions[draggedBlock]];
                    moves++;
                    document.getElementById('move-count').textContent = moves;
                    renderPolyBoard();

                    // Verificar victoria moderna
                    let won = blocks.every((b, i) => positions[i].r === b.r && positions[i].c === b.c);
                    if (won) {
                        clearInterval(timerInterval);
                        document.getElementById('win-modal').classList.remove('hidden');
                    }
                }
            });

            board.appendChild(tile);
        });
    }
}
