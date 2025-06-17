class ImageLayer {
    constructor(names, zIndex = 4) {
        this.names = names;
        this.images = {};
        this.canvas = null;
        this.ctx = null;
        this.enabled = true;
        this.hoveredImage = null;
        this.createCanvas(zIndex);
        this.loadImages();
        window.addEventListener('resize', () => this.update());
    }

    createCanvas(zIndex) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'imageLayerCanvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = String(zIndex);
        this.canvas.style.pointerEvents = 'none';
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        console.log('ImageLayer canvas created');
    }

    loadImages() {
        this.names.forEach(name => {
            const img = new Image();
            img.onload = () => {
                console.log(`${name} image loaded`);
                this.update();
            };
            img.onerror = () => {
                console.warn(`${name} image failed to load`);
            };
            img.src = `images/${name}.png`;
            this.images[name] = img;
        });
    }

    update() {
        if (!this.canvas || !this.ctx || !this.enabled) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.clearRect(0, 0, width, height);

        // 기준 이미지 비율 계산 (첫 번째 이미지 사용)
        const baseImg = this.images[this.names[0]];
        if (baseImg && baseImg.complete) {
            const imgAspect = baseImg.naturalWidth / baseImg.naturalHeight;
            const screenAspect = width / height;
            let drawWidth, drawHeight, drawX, drawY;
            if (imgAspect > screenAspect) {
                drawHeight = height;
                drawWidth = height * imgAspect;
                drawX = (width - drawWidth) / 2;
                drawY = 0;
            } else {
                drawWidth = width;
                drawHeight = width / imgAspect;
                drawX = 0;
                drawY = (height - drawHeight) / 2;
            }

            // 전역 패닝 오프셋 적용
            const panOffset = window.fireApp ? window.fireApp.panOffset : { x: 0, y: 0 };
            drawX += panOffset.x;
            drawY += panOffset.y;

            // 순서대로 이미지 그리기
            this.names.forEach(name => {
                const img = this.images[name];
                if (img && img.complete) {
                    // 호버 효과 적용
                    if (name === this.hoveredImage) {
                        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                        this.ctx.shadowBlur = 20;
                    } else {
                        this.ctx.shadowColor = 'transparent';
                        this.ctx.shadowBlur = 0;
                    }
                    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                }
            });

            // 컨텍스트 초기화
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
    }

    enable() {
        this.enabled = true;
        if (this.canvas) this.canvas.style.display = 'block';
        this.update();
    }

    disable() {
        this.enabled = false;
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.style.display = 'none';
        }
    }

    toggle(enabled) {
        if (enabled) this.enable();
        else this.disable();
    }
}

export default ImageLayer; 