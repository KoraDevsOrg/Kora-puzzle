window.KoraClassicPuzzle = {
    build(img, gridSize) {
        const total = gridSize * gridSize;
        window.KoraDragEngine.reset(total);

        const boardW = window.KoraDragEngine.boardOffset.w;
        const boardH = window.KoraDragEngine.boardOffset.h;
        const cellW = boardW / gridSize;
        const cellH = boardH / gridSize;
        const pad = Math.ceil(Math.min(cellW, cellH) * 0.28);

        this.drawBoardGrid(boardW, boardH, gridSize);

        // Generar matriz de pestañas complementarias (+1 saliente, -1 entrante, 0 plano)
        const hEdges = Array.from({ length: gridSize }, () => Array(gridSize - 1).fill(0));
        const vEdges = Array.from({ length: gridSize - 1 }, () => Array(gridSize).fill(0));

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize - 1; c++) {
                hEdges[r][c] = Math.random() > 0.5 ? 1 : -1;
            }
        }
        for (let r = 0; r < gridSize - 1; r++) {
            for (let c = 0; c < gridSize; c++) {
                vEdges[r][c] = Math.random() > 0.5 ? 1 : -1;
            }
        }

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const id = r * gridSize + c;
                const tabs = {
                    top: r === 0 ? 0 : -vEdges[r - 1][c],
                    right: c === gridSize - 1 ? 0 : hEdges[r][c],
                    bottom: r === gridSize - 1 ? 0 : vEdges[r][c],
                    left: c === 0 ? 0 : -hEdges[r][c - 1]
                };

                const neighbors = [];
                if (r > 0) neighbors.push((r - 1) * gridSize + c);
                if (r < gridSize - 1) neighbors.push((r + 1) * gridSize + c);
                if (c > 0) neighbors.push(r * gridSize + (c - 1));
                if (c < gridSize - 1) neighbors.push(r * gridSize + (c + 1));

                const canvas = this.createJigsawPieceCanvas(
                    img, r, c, gridSize, cellW, cellH, pad, tabs
                );

                window.KoraDragEngine.registerPiece({
                    id,
                    el: canvas,
                    targetX: c * cellW - pad,
                    targetY: r * cellH - pad,
                    x: 0,
                    y: 0,
                    w: cellW + pad * 2,
                    h: cellH + pad * 2,
                    neighbors
                });
            }
        }

        window.KoraDragEngine.scatterLoosePieces();
    },

    drawBoardGrid(w, h, gridSize) {
        const gridCanvas = document.getElementById('board-grid-canvas');
        gridCanvas.width = w;
        gridCanvas.height = h;
        const ctx = gridCanvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;

        const stepX = w / gridSize;
        const stepY = h / gridSize;
        for (let i = 1; i < gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * stepX, 0);
            ctx.lineTo(i * stepX, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * stepY);
            ctx.lineTo(w, i * stepY);
            ctx.stroke();
        }
    },

    createJigsawPieceCanvas(img, r, c, gridSize, cellW, cellH, pad, tabs) {
        const canvas = document.createElement('canvas');
        canvas.className = 'puzzle-piece';
        canvas.width = Math.ceil(cellW + pad * 2);
        canvas.height = Math.ceil(cellH + pad * 2);

        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(pad, pad);

        this.traceJigsawPath(ctx, cellW, cellH, tabs);
        ctx.clip();

        const scaleX = img.width / (cellW * gridSize);
        const scaleY = img.height / (cellH * gridSize);

        ctx.drawImage(
            img,
            (c * cellW - pad) * scaleX,
            (r * cellH - pad) * scaleY,
            (cellW + pad * 2) * scaleX,
            (cellH + pad * 2) * scaleY,
            -pad,
            -pad,
            cellW + pad * 2,
            cellH + pad * 2
        );

        ctx.restore();

        // Contorno biselado de la pieza
        ctx.save();
        ctx.translate(pad, pad);
        this.traceJigsawPath(ctx, cellW, cellH, tabs);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();

        return canvas;
    },

    traceJigsawPath(ctx, w, h, tabs) {
        ctx.beginPath();
        ctx.moveTo(0, 0);

        // Lado Superior
        this.drawEdge(ctx, 0, 0, w, 0, tabs.top);
        // Lado Derecho
        this.drawEdge(ctx, w, 0, w, h, tabs.right);
        // Lado Inferior
        this.drawEdge(ctx, w, h, 0, h, tabs.bottom);
        // Lado Izquierdo
        this.drawEdge(ctx, 0, h, 0, 0, tabs.left);

        ctx.closePath();
    },

    drawEdge(ctx, x1, y1, x2, y2, tabDir) {
        if (tabDir === 0) {
            ctx.lineTo(x2, y2);
            return;
        }
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        // Vector normal hacia afuera en sentido horario
        const nx = uy * tabDir;
        const ny = -ux * tabDir;

        const tabLen = len * 0.22;
        const p = (along, out) => [
            x1 + ux * (len * along) + nx * (tabLen * out),
            y1 + uy * (len * along) + ny * (tabLen * out)
        ];

        ctx.lineTo(...p(0.36, 0));
        ctx.bezierCurveTo(...p(0.34, 0.45), ...p(0.30, 1.0), ...p(0.50, 1.0));
        ctx.bezierCurveTo(...p(0.70, 1.0), ...p(0.66, 0.45), ...p(0.64, 0));
        ctx.lineTo(x2, y2);
    }
};
