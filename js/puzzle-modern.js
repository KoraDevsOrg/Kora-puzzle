window.KoraModernPuzzle = {
    build(img, gridSize) {
        const boardW = window.KoraDragEngine.boardOffset.w;
        const boardH = window.KoraDragEngine.boardOffset.h;
        const cellW = boardW / gridSize;
        const cellH = boardH / gridSize;

        // Generar partición exacta del tablero en Poliminós (bloques de 2 a 4 celdas conectadas)
        const polyominoes = this.generatePolyominoPartition(gridSize);
        window.KoraDragEngine.reset(polyominoes.length);

        this.drawPolyominoBoardGrid(boardW, boardH, cellW, cellH, polyominoes);

        // Calcular qué poliminós son vecinos entre sí para habilitar el imán fuera del tablero
        this.computePolyominoNeighbors(polyominoes, gridSize);

        polyominoes.forEach(poly => {
            const canvas = this.createPolyominoCanvas(img, poly, gridSize, cellW, cellH);

            window.KoraDragEngine.registerPiece({
                id: poly.id,
                el: canvas,
                targetX: poly.minC * cellW,
                targetY: poly.minR * cellH,
                x: 0,
                y: 0,
                w: (poly.maxC - poly.minC + 1) * cellW,
                h: (poly.maxR - poly.minR + 1) * cellH,
                neighbors: poly.neighbors
            });
        });

        window.KoraDragEngine.scatterLoosePieces();
    },

    generatePolyominoPartition(N) {
        const owner = Array.from({ length: N }, () => Array(N).fill(-1));
        const pieces = [];
        const maxCellsPerPiece = N <= 3 ? 2 : (N <= 5 ? 3 : 4);
        let currentId = 0;

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (owner[r][c] !== -1) continue;

                const cells = [{ r, c }];
                owner[r][c] = currentId;
                const targetSize = Math.floor(Math.random() * (maxCellsPerPiece - 1)) + 2;

                while (cells.length < targetSize) {
                    const candidates = [];
                    cells.forEach(cell => {
                        dirs.forEach(([dr, dc]) => {
                            const nr = cell.r + dr;
                            const nc = cell.c + dc;
                            if (nr >= 0 && nr < N && nc >= 0 && nc < N && owner[nr][nc] === -1) {
                                candidates.push({ r: nr, c: nc });
                            }
                        });
                    });

                    if (candidates.length === 0) break;
                    const pick = candidates[Math.floor(Math.random() * candidates.length)];
                    owner[pick.r][pick.c] = currentId;
                    cells.push(pick);
                }

                pieces.push({ id: currentId, cells, neighbors: [] });
                currentId++;
            }
        }

        // Si quedó alguna celda unitaria (1x1), fusionarla con un poliminó vecino para que todas sean formas compuestas
        for (let i = pieces.length - 1; i >= 0; i--) {
            if (pieces[i].cells.length === 1 && pieces.length > 1) {
                const single = pieces[i].cells[0];
                for (const [dr, dc] of dirs) {
                    const nr = single.r + dr;
                    const nc = single.c + dc;
                    if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
                        const neighborId = owner[nr][nc];
                        if (neighborId !== pieces[i].id) {
                            const targetPiece = pieces.find(p => p.id === neighborId);
                            if (targetPiece) {
                                owner[single.r][single.c] = targetPiece.id;
                                targetPiece.cells.push(single);
                                pieces.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }

        // Reindexar IDs y calcular cajas delimitadoras (Bounding Box)
        pieces.forEach((p, idx) => {
            p.id = idx;
            p.minR = Math.min(...p.cells.map(ce => ce.r));
            p.maxR = Math.max(...p.cells.map(ce => ce.r));
            p.minC = Math.min(...p.cells.map(ce => ce.c));
            p.maxC = Math.max(...p.cells.map(ce => ce.c));
        });

        return pieces;
    },

    computePolyominoNeighbors(pieces, N) {
        const gridMap = Array.from({ length: N }, () => Array(N).fill(-1));
        pieces.forEach(p => {
            p.cells.forEach(cell => {
                gridMap[cell.r][cell.c] = p.id;
            });
        });

        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        pieces.forEach(p => {
            const nSet = new Set();
            p.cells.forEach(cell => {
                dirs.forEach(([dr, dc]) => {
                    const nr = cell.r + dr;
                    const nc = cell.c + dc;
                    if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
                        const otherId = gridMap[nr][nc];
                        if (otherId !== p.id) nSet.add(otherId);
                    }
                });
            });
            p.neighbors = Array.from(nSet);
        });
    },

    drawPolyominoBoardGrid(boardW, boardH, cellW, cellH, pieces) {
        const gridCanvas = document.getElementById('board-grid-canvas');
        gridCanvas.width = boardW;
        gridCanvas.height = boardH;
        const ctx = gridCanvas.getContext('2d');
        ctx.clearRect(0, 0, boardW, boardH);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.5;

        pieces.forEach(poly => {
            this.tracePolyominoOutline(ctx, poly, 0, 0, cellW, cellH);
            ctx.stroke();
        });
    },

    createPolyominoCanvas(img, poly, gridSize, cellW, cellH) {
        const spanCols = poly.maxC - poly.minC + 1;
        const spanRows = poly.maxR - poly.minR + 1;

        const canvas = document.createElement('canvas');
        canvas.className = 'puzzle-piece';
        canvas.width = Math.ceil(spanCols * cellW);
        canvas.height = Math.ceil(spanRows * cellH);

        const ctx = canvas.getContext('2d');

        // Recortar la silueta exacta de la pieza tipo Tetris (L, T, Z, etc.)
        ctx.save();
        this.tracePolyominoOutline(ctx, poly, poly.minR, poly.minC, cellW, cellH);
        ctx.clip();

        const scaleX = img.width / (cellW * gridSize);
        const scaleY = img.height / (cellH * gridSize);

        ctx.drawImage(
            img,
            poly.minC * cellW * scaleX,
            poly.minR * cellH * scaleY,
            spanCols * cellW * scaleX,
            spanRows * cellH * scaleY,
            0,
            0,
            spanCols * cellW,
            spanRows * cellH
        );
        ctx.restore();

        // Dibujar el borde perimetral continuo de la pieza moderna
        ctx.save();
        this.tracePolyominoOutline(ctx, poly, poly.minR, poly.minC, cellW, cellH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();

        return canvas;
    },

    tracePolyominoOutline(ctx, poly, offsetR, offsetC, cellW, cellH) {
        const cellSet = new Set(poly.cells.map(c => `${c.r},${c.c}`));
        const has = (r, c) => cellSet.has(`${r},${c}`);

        ctx.beginPath();
        // Trazar cada celda perteneciente al bloque y su perímetro exterior
        poly.cells.forEach(({ r, c }) => {
            const x = (c - offsetC) * cellW;
            const y = (r - offsetR) * cellH;
            ctx.rect(x, y, cellW, cellH);
        });

        // Guardar segmentos de borde exterior para que el stroke solo dibuje el contorno de la figura
        ctx.beginPath();
        poly.cells.forEach(({ r, c }) => {
            const x = (c - offsetC) * cellW;
            const y = (r - offsetR) * cellH;

            if (!has(r - 1, c)) { ctx.moveTo(x, y); ctx.lineTo(x + cellW, y); }
            if (!has(r + 1, c)) { ctx.moveTo(x, y + cellH); ctx.lineTo(x + cellW, y + cellH); }
            if (!has(r, c - 1)) { ctx.moveTo(x, y); ctx.lineTo(x, y + cellH); }
            if (!has(r, c + 1)) { ctx.moveTo(x + cellW, y); ctx.lineTo(x + cellW, y + cellH); }
        });

        // Si se usa para clip(), necesitamos las áreas cerradas; por ello definimos un método mixto:
        const clipPath = new Path2D();
        poly.cells.forEach(({ r, c }) => {
            const x = (c - offsetC) * cellW;
            const y = (r - offsetR) * cellH;
            clipPath.rect(x, y, cellW + 0.5, cellH + 0.5);
        });
        ctx.clip(clipPath);
    }
};
