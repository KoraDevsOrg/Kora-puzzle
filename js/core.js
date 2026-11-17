window.KoraCore = {
    selectedImageSrc: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    timerSeconds: 0,
    timerInterval: null,

    init() {
        const imageUrlInput = document.getElementById('image-url');
        const localImageInput = document.getElementById('local-image');
        const imagePreview = document.getElementById('image-preview');

        imageUrlInput.addEventListener('input', (e) => {
            this.selectedImageSrc = e.target.value;
            imagePreview.src = this.selectedImageSrc;
        });

        localImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.selectedImageSrc = event.target.result;
                    imagePreview.src = this.selectedImageSrc;
                    imageUrlInput.value = "[Imagen Local]";
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('start-game-btn').addEventListener('click', () => {
            const size = parseInt(document.getElementById('grid-size').value, 10);

            document.getElementById('view-menu').classList.add('hidden');
            document.getElementById('view-game').classList.remove('hidden');

            this.startTimer();
            window.KoraPuzzleEngine.init(this.selectedImageSrc, size);
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.resetToMenu());
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('win-modal').classList.add('hidden');
            this.resetToMenu();
        });
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerSeconds = 0;
        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            const mins = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
            const secs = (this.timerSeconds % 60).toString().padStart(2, '0');
            const timerEl = document.getElementById('timer');
            if (timerEl) timerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    },

    resetToMenu() {
        clearInterval(this.timerInterval);
        document.getElementById('view-game').classList.add('hidden');
        document.getElementById('win-modal').classList.add('hidden');
        document.getElementById('view-menu').classList.remove('hidden');
    },

    triggerWin() {
        clearInterval(this.timerInterval);
        document.getElementById('win-modal').classList.remove('hidden');
    }
};

document.addEventListener("DOMContentLoaded", () => window.KoraCore.init());
