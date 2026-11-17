window.KoraPuzzleEngine = {
    init(imgSrc, size) {
        const board = document.getElementById('puzzle-board');
        const container = document.getElementById('pieces-container');
        board.innerHTML = '';
        container.innerHTML = '';

        const totalPieces = size * size;
        let placedCount = 0;
        document.getElementById('total-target').textContent = totalPieces;
        document.getElementById('score-count').textContent = placedCount;

        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

        const boardRect = board.getBoundingClientRect();
        const pieceSize = boardRect.width / size;

        // Crear celdas de destino en el tablero
        const targetPositions = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const slot = document.createElement('div');
                slot.className = 'board-slot';
                slot.dataset.index = r * size + c;
                board.appendChild(slot);

                // Calcular coordenadas absolutas de destino respecto a la pantalla
                targetPositions.push({
                    row: r,
                    col: c,
                    id: r * size + c
                });
            }
        }

        // Generar piezas aleatorias flotando en el contenedor inferior
        let pieceIds = [];
        for (let i = 0; i < totalPieces; i++) pieceIds.push(i);
        pieceIds.sort(() => Math.random() - 0.5);

        pieceIds.forEach((id) => {
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

            // Posición inicial aleatoria dentro de la bandeja flotante
            const containerRect = container.getBoundingClientRect();
            const randomX = Math.random() * (containerRect.width - pieceSize - 20) + 10;
            const randomY = Math.random() * (containerRect.height - pieceSize - 20) + 10;

            piece.style.left = `${randomX}px`;
            piece.style.top = `${randomY}px`;

            this.enableFreeDrag(piece, size, pieceSize, () => {
                placedCount++;
                document.getElementById('score-count').textContent = placedCount;
                if (placedCount === totalPieces) {
                    window.KoraCore.triggerWin();
                }
            });

            container.appendChild(piece);
        });
    },

    enableFreeDrag(piece, size, pieceSize, onPlaced) {
        let startX = 0, startY = 0;
        let initialX = 0, initialY = 0;

        const dragStart = (e) => {
            if (piece.dataset.locked === "true") return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;

            const rect = piece.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            // Mover la pieza al body temporalmente para que flote por ENCIMA de todo sin restricciones de overflow
            document.body.appendChild(piece);
            piece.style.left = `${initialX}px`;
            piece.style.top = `${initialY}px`;
            piece.classList.add('dragging');

            if (e.type === 'touchstart') {
                document.addEventListener('touchmove', dragMove, { passive: false });
                document.addEventListener('touchend', dragEnd);
            } else {
                document.addEventListener('mousemove', dragMove);
                document.addEventListener('mouseup', dragEnd);
            }
        };

        const dragMove = (e) => {
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            piece.style.left = `${initialX + dx}px`;
            piece.style.top = `${initialY + dy}px`;
        };

        const dragEnd = (e) => {
            piece.classList.remove('dragging');

            if (e.type === 'touchend') {
                document.removeEventListener('touchmove', dragMove);
                document.removeEventListener('touchend', dragEnd);
            } else {
                document.removeEventListener('mousemove', dragMove);
                document.removeEventListener('mouseup', dragEnd);
            }

            // Comprobar si se soltó cerca de su celda correcta en el tablero
            const pieceRect = piece.getBoundingClientRect();
            const board = document.getElementById('puzzle-board');
            const slots = board.querySelectorAll('.board-slot');
            const pieceId = parseInt(piece.dataset.pieceId, 10);

            let snapped = false;

            slots.forEach((slot, index) => {
                if (index === pieceId && slot.children.length === 0) {
                    const slotRect = slot.getBoundingClientRect();

                    // Margen de imán (tolerancia de cercanía en píxeles)
                    const tolerance = pieceSize * 0.6;
                    const distance = Math.hypot(
                        pieceRect.left - slotRect.left,
                        pieceRect.top - slotRect.top
                    );

                    if (distance < tolerance) {
                        // ¡Imán activado! La pieza encaja perfectamente en el slot
                        slot.appendChild(piece);
                        piece.style.position = 'absolute';
                        piece.style.left = '0px';
                        piece.style.top = '0px';
                        piece.style.width = '100%';
                        piece.style.height = '100%';
                        piece.dataset.locked = "true";
                        snapped = true;
                        onPlaced();
                    }
                }
            });

            // Si no embonó en el tablero, regresa al contenedor libre o se queda donde la soltó
            if (!snapped) {
                const container = document.getElementById('pieces-container');
                container.appendChild(piece);
                // Posicionar de forma relativa al contenedor actual para evitar desajustes
                const containerRect = container.getBoundingClientRect();
                piece.style.left = `${Math.max(0, pieceRect.left - containerRect.left)}px`;
                piece.style.top = `${Math.max(0, pieceRect.top - containerRect.top)}px`;
            }
        };

        piece.addEventListener('mousedown', dragStart);
        piece.addEventListener('touchstart', dragStart, { passive: false });
    }
};
