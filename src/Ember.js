/**
 * EmberParticleSystem - 간단한 불똥 입자 효과용 클래스
 */
export default class EmberParticleSystem {
    constructor(parent, options = {}) {
        this.parent = parent;
        this.origin = options.origin || new THREE.Vector3(0, 0, 0);
        this.count = options.count || 20;
        this.gravity = options.gravity || new THREE.Vector3(0, -0.3, 0);
        this.size = options.size || 0.1;
        this.particlesData = [];
        this.sprites = [];
        const texture = this._createSpriteTexture();
        for (let i = 0; i < this.count; i++) {
            // 초기 위치 및 속도 (넓은 분포로 불규칙하게)
            const pos = new THREE.Vector3(
                this.origin.x + (Math.random() - 0.5) * 0.6,
                this.origin.y + Math.random() * 0.3,
                this.origin.z + (Math.random() - 0.5) * 0.6
            );
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 1.6,  // 초기 속도 배가
                Math.random() * 2.0 + 1.6,   // 초기 속도 배가
                (Math.random() - 0.5) * 1.6   // 초기 속도 배가
            );
            // 수명 설정 (0.6~1.2초)
            const lifetime = Math.random() * 0.6 + 0.6;
            this.particlesData.push({ pos, vel, lifetime, age: 0 });
            // Sprite 생성
            const mat = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(mat);
            sprite.position.copy(pos);
            sprite.scale.set(this.size, this.size, this.size);
            this.parent.add(sprite);
            this.sprites.push(sprite);
        }
    }

    // 캔버스 기반 스프라이트 텍스처 생성
    _createSpriteTexture() {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(255,220,150,1)');
        gradient.addColorStop(0.1, 'rgba(255,140,50,1)');
        gradient.addColorStop(0.2, 'rgba(255,80,20,0.8)');
        gradient.addColorStop(0.4, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
    }

    // 프레임별 업데이트
    update(delta) {
        for (let i = 0; i < this.count; i++) {
            const data = this.particlesData[i];
            data.age += delta;
            // 재생성 조건
            if (data.age >= data.lifetime || data.pos.y <= this.origin.y - 0.2) {
                data.age = 0;
                data.pos.set(
                    this.origin.x + (Math.random() - 0.5) * 0.6,
                    this.origin.y + Math.random() * 0.3,
                    this.origin.z + (Math.random() - 0.5) * 0.6
                );
                data.vel.set(
                    (Math.random() - 0.5) * 1.6,  // 초기 속도 배가
                    Math.random() * 2.0 + 1.6,   // 초기 속도 배가
                    (Math.random() - 0.5) * 1.6   // 초기 속도 배가
                );
                data.lifetime = Math.random() * 0.5 + 0.1;
            }
            // 중력
            data.vel.add(this.gravity.clone().multiplyScalar(delta));
            // Ornstein–Uhlenbeck 난류 모델 및 크기에 따른 관성 효과 적용
            const theta = 1.0; // 복원 강도
            const sigma = 0.2; // 난류 강도
            const dt = delta;
            const noise = () => Math.random() - 0.5;
            // OU 프로세스
            data.vel.x += -theta * data.vel.x * dt + sigma * Math.sqrt(dt) * noise() * (1 / this.size);
            data.vel.y += -theta * data.vel.y * dt + sigma * Math.sqrt(dt) * noise() * (1 / this.size);
            data.vel.z += -theta * data.vel.z * dt + sigma * Math.sqrt(dt) * noise() * (1 / this.size);
            // 전체 속도 감쇠 적용 (감쇠 대폭 강화)
            data.vel.multiplyScalar(0.98);
            // 위치 업데이트
            data.pos.addScaledVector(data.vel, dt);
            // Sprite 위치, 크기, 투명도 업데이트
            const sprite = this.sprites[i];
            sprite.position.copy(data.pos);
            const t = data.age / data.lifetime;
            // 알파: 서서히 투명해지며 플리커
            let alpha = Math.max(0, 1 - t);
            // 더 밝게 표시: 높은 투명도 값 사용
            alpha *= 0.9 + Math.random() * 0.1;
            sprite.material.opacity = alpha;
            // 크기: 살짝 변화
            const s = this.size * (1 + 0.2 * Math.sin(t * Math.PI));
            sprite.scale.set(s, s, s);
        }
    }
} 