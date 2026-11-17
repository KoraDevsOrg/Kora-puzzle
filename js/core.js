window.KoraCore = {
    selectedMode: 'classic',
    gridSize: 4,
    selectedImageSrc: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    timerSeconds: 0,
    timerInterval: null,

    init() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        const slider = document.getElementById('grid-slider');
        const gridLabel = document.getElementById('grid-label');
        const urlInput = document.getElementById('image-url');
        const localInput = document.getElementById('local-image');
        const preview = document.getElementById('image-preview');
        const presets = document.querySelectorAll('.preset-thumb');

        // Selección de Modo (Clásico vs Moderno)
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMode = btn.dataset.mode;
                this.updateSliderLabel();
            });
        });

        // Selector dinámico de cantidad de piezas (2x2 hasta 10x10)
        slider.addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value, 10);
            this.updateSliderLabel();
        });

        // Galería de imágenes predefinidas
        presets.forEach(img => {
            img.addEventListener('click', () => {
                presets.forEach(p => p.classList.remove('active'));
                img.classList.add('active');
                this.selectedImageSrc = img.src;
                preview.src = img.src;
                urlInput.value = img.src;
            });
        });

        // URL pública personalizada
        urlInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) {
                this.selectedImageSrc = val;
                preview.src = val;
                presets.forEach(p => p.classList.remove('active'));
            }
        });

        // Carga desde la galería local del teléfono
        localInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.selectedImageSrc = ev.target.result;
                    preview.src = this.selectedImageSrc;
                    urlInput.value = '[Imagen Local del Teléfono]';
                    presets.forEach(p => p.classList.remove('active'));
                };
                reader.readAsDataURL(file);
            }
        });

        // Iniciar juego
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.launchGame();
        });

        // Botones de barra superior
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('win-modal').classList.add('hidden');
            this.showMenu();
        });

        const guideBtn = document.getElementById('toggle-guide-btn');
        guideBtn.addEventListener('click', () => {
            const guideImg = document.getElementById('board-guide');
            guideImg.classList.toggle('hidden-guide');
            guideBtn.classList.toggle('active');
        });

        document.getElementById('scatter-btn').addEventListener('click', () => {
            window.KoraDragEngine.scatterLoosePieces();
        });
    },

    updateSliderLabel() {
        const s = this.gridSize;
        const total = s * s;
        const gridLabel = document.getElementById('grid-label');
        if (this.selectedMode === 'classic') {
            gridLabel.textContent = `${s} x ${s} (${total} piezas)`;
        } else {
            const approxBlocks = Math.max(4, Math.round(total / 2.6));
            gridLabel.textContent = `Matriz ${s}x${s} (~${approxBlocks} bloques Tetris)`;
        }
    },

    launchGame() {
        document.getElementById('view-menu').classList.add('hidden');
        document.getElementById('view-game').classList.remove('hidden');

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.setupBoardDimensions(img);
            this.startTimer();

            if (this.selectedMode === 'classic') {
                window.KoraClassicPuzzle.build(img, this.gridSize);
            } else {
                window.KoraModernPuzzle.build(img, this.gridSize);
            }
        };
        img.onerror = () => {
            alert('No se pudo cargar la imagen. Intenta con otra URL o sube una foto de tu galería.');
            this.showMenu();
        };
        img.src = this.selectedImageSrc;
    },

    setupBoardDimensions(img) {
        const workspace = document.getElementById('workspace');
        const board = document.getElementById('puzzle-board');
        const guide = document.getElementById('board-guide');

        const wsRect = workspace.getBoundingClientRect();
        const maxBoardW = wsRect.width - 16;
        const maxBoardH = wsRect.height * 0.56;
        const sizePx = Math.floor(Math.min(maxBoardW, maxBoardH));

        board.style.width = `${sizePx}px`;
        board.style.height = `${sizePx}px`;
        guide.src = img.src;
    },

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerSeconds = 0;
        document.getElementById('timer').textContent = '00:00';
        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
            const s = String(this.timerSeconds % 60).padStart(2, '0');
            document.getElementById('timer').textContent = `${m}:${s}`;
        }, 1000);
    },

    showMenu() {
        clearInterval(this.timerInterval);
        document.getElementById('view-game').classList.add('hidden');
        document.getElementById('win-modal').classList.add('hidden');
        document.getElementById('view-menu').classList.remove('hidden');
    },

    triggerWin() {
        clearInterval(this.timerInterval);
        const timeStr = document.getElementById('timer').textContent;
        document.getElementById('win-stats-text').textContent = `Completado en ${timeStr}`;
        setTimeout(() => {
            document.getElementById('win-modal').classList.remove('hidden');
        }, 300);
    }
};

document.addEventListener('DOMContentLoaded', () => window.KoraCore.init());
