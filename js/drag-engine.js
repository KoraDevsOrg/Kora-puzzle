window.KoraDragEngine = {
    pieces: [],
    boardOffset: { x: 0, y: 0 },
    snapTolerance: 22,
    topZIndex: 20,

    reset(totalCount) {
        this.pieces = [];
        this.topZIndex = 20;
        const layer = document.getElementById('pieces-layer');
        layer.innerHTML = '';

        const wsRect = document.getElementById('workspace').getBoundingClientRect();
        const bRect = document.getElementById('puzzle-board').getBoundingClientRect();
        this.boardOffset = {
            x: bRect.left - wsRect.left,
            y: bRect.top - wsRect.top,
            w: bRect.width,
            h: bRect.height
        };

        document.getElementById('total-target').textContent = totalCount;
        document.getElementById('score-count').textContent = '0';
    },

    registerPiece(pieceObj) {
        // pieceObj: { id, el, targetX, targetY, x, y, w, h, neighbors: [], groupId, locked }
        pieceObj.groupId = `grp_${pieceObj.id}`;
        pieceObj.locked = false;
        this.pieces.push(pieceObj);
        document.getElementById('pieces-layer').appendChild(pieceObj.el);
        this.bindPointerEvents(pieceObj);
    },

    scatterLoosePieces() {
        const wsRect = document.getElementById('workspace').getBoundingClientRect();
        const trayRect = document.getElementById('tray-zone').getBoundingClientRect();

        const minY = trayRect.top - wsRect.top + 6;
        const maxY = wsRect.height - 10;

        // Agrupar por groupId para mover grupos enteros juntos
        const processedGroups = new Set();

        this.pieces.forEach(p => {
            if (p.locked || processedGroups.has(p.groupId)) return;
            processedGroups.add(p.groupId);

            const groupMembers = this.pieces.filter(m => m.groupId === p.groupId);
            const randX = Math.random() * Math.max(20, wsRect.width - p.w - 20) + 5;
            const randY = minY + Math.random() * Math.max(15, (maxY - minY - p.h));

            const dx = randX - p.x;
            const dy = randY - p.y;

            groupMembers.forEach(m => {
                m.x += dx;
                m.y += dy;
                m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
            });
        });
    },

    bindPointerEvents(piece) {
        let startPointerX = 0;
        let startPointerY = 0;
        let activeGroup = [];
        let initialPositions = [];

        const onPointerDown = (e) => {
            if (piece.locked) return;
            e.preventDefault();
            e.stopPropagation();

            const pt = e.touches ? e.touches[0] : e;
            startPointerX = pt.clientX;
            startPointerY = pt.clientY;

            activeGroup = this.pieces.filter(p => p.groupId === piece.groupId && !p.locked);
            this.topZIndex++;

            initialPositions = activeGroup.map(m => {
                m.el.style.zIndex = this.topZIndex;
                m.el.classList.add('dragging');
                return { member: m, startX: m.x, startY: m.y };
            });

            window.addEventListener('mousemove', onPointerMove, { passive: false });
            window.addEventListener('mouseup', onPointerUp);
            window.addEventListener('touchmove', onPointerMove, { passive: false });
            window.addEventListener('touchend', onPointerUp);
        };

        const onPointerMove = (e) => {
            e.preventDefault();
            const pt = e.touches ? e.touches[0] : e;
            const dx = pt.clientX - startPointerX;
            const dy = pt.clientY - startPointerY;

            for (let i = 0; i < initialPositions.length; i++) {
                const item = initialPositions[i];
                item.member.x = item.startX + dx;
                item.member.y = item.startY + dy;
                item.member.el.style.transform = `translate3d(${item.member.x}px, ${item.member.y}px, 0)`;
            }
        };

        const onPointerUp = () => {
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerUp);
            window.removeEventListener('touchmove', onPointerMove);
            window.removeEventListener('touchend', onPointerUp);

            activeGroup.forEach(m => m.el.classList.remove('dragging'));
            this.evaluateSnaps(activeGroup);
        };

        piece.el.addEventListener('mousedown', onPointerDown);
        piece.el.addEventListener('touchstart', onPointerDown, { passive: false });
    },

    evaluateSnaps(activeGroup) {
        let snappedToBoard = false;

        // 1. Verificar si algún miembro del grupo está cerca de su posición final en el tablero
        for (const member of activeGroup) {
            const absTargetX = this.boardOffset.x + member.targetX;
            const absTargetY = this.boardOffset.y + member.targetY;
            const distToBoard = Math.hypot(member.x - absTargetX, member.y - absTargetY);

            if (distToBoard <= this.snapTolerance) {
                const shiftX = absTargetX - member.x;
                const shiftY = absTargetY - member.y;

                activeGroup.forEach(m => {
                    m.x += shiftX;
                    m.y += shiftY;
                    m.locked = true;
                    m.el.classList.add('locked', 'snap-effect');
                    m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
                });
                snappedToBoard = true;
                break;
            }
        }

        // 2. Si aún no está bloqueado en el tablero, verificar imán con piezas vecinas (Cluster Snapping)
        if (!snappedToBoard) {
            for (const member of activeGroup) {
                for (const neighborId of member.neighbors) {
                    const neighbor = this.pieces.find(p => p.id === neighborId);
                    if (!neighbor || neighbor.groupId === member.groupId) continue;

                    // Vector exacto que debería existir entre ambas piezas
                    const expectedDX = member.targetX - neighbor.targetX;
                    const expectedDY = member.targetY - neighbor.targetY;

                    const idealMemberX = neighbor.x + expectedDX;
                    const idealMemberY = neighbor.y + expectedDY;

                    const dist = Math.hypot(member.x - idealMemberX, member.y - idealMemberY);

                    if (dist <= this.snapTolerance) {
                        const corrX = idealMemberX - member.x;
                        const corrY = idealMemberY - member.y;
                        const targetGroupId = neighbor.groupId;
                        const isNeighborLocked = neighbor.locked;

                        activeGroup.forEach(m => {
                            m.x += corrX;
                            m.y += corrY;
                            m.groupId = targetGroupId;
                            if (isNeighborLocked) {
                                m.locked = true;
                                m.el.classList.add('locked');
                            }
                            m.el.classList.add('snap-effect');
                            setTimeout(() => m.el.classList.remove('snap-effect'), 400);
                            m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
                        });
                        break;
                    }
                }
            }
        }

        this.updateProgress();
    },

    updateProgress() {
        const lockedCount = this.pieces.filter(p => p.locked).length;
        document.getElementById('score-count').textContent = lockedCount;

        if (lockedCount === this.pieces.length && this.pieces.length > 0) {
            window.KoraCore.triggerWin();
        }
    }
};
