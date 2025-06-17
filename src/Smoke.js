// SmokeParticleSystem 클래스 정의
export default class SmokeParticleSystem {
    constructor(parent, options = {}) {
        this.parent = parent;
        this.origin = options.origin || new THREE.Vector3(0, 0, 0);
        this.count = options.count || 30;
        this.gravity = options.gravity || new THREE.Vector3(0, 0.1, 0);
        this.size = options.size || 1.2; // 기본 연기 크기 확대
        this.fadeInDuration = options.fadeInDuration || 1.5;   // 개별 입자 페이드인 시간 (초)
        this.fadeOutDuration = options.fadeOutDuration || 1.5;  // 개별 입자 페이드아웃 시간 (초)
        this.baseOpacity = options.baseOpacity || 0.2;           // 전체 연기 알파 조정
        // 수직 페이드 범위를 origin 바로 위 구간으로 설정
        this.verticalFadeStart = options.verticalFadeStart || this.origin.y + 1.0; // 수직 페이드 시작 Y
        this.verticalFadeEnd   = options.verticalFadeEnd   || this.origin.y + 1.5; // 수직 페이드 끝 Y
        this.particlesData = [];
        this.sprites = [];
        const texture = this._createSpriteTexture();

        for (let i = 0; i < this.count; i++) {
            const pos = new THREE.Vector3(
                this.origin.x + (Math.random() - 0.5) * 1.0,
                this.origin.y + Math.random() * 0.3,       // 초기 생성 Y 위치를 origin.y~origin.y+0.3 범위로 변경
                this.origin.z + (Math.random() - 0.5) * 1.0
            );
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.5 + 1.0, // 초기 상승 속도 증가
                (Math.random() - 0.5) * 0.2
            );
            const lifetime = Math.random() * 2 + 2; // 2~4초
            const age = Math.random() * lifetime; // 초기 연기 입자 나눠짐
            this.particlesData.push({ pos, vel, lifetime, age });

            const mat = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending
            });
            const sprite = new THREE.Sprite(mat);
            sprite.position.copy(pos);
            sprite.scale.set(this.size, this.size, this.size);
            // 초기 알파 설정: 수명 기반 + 수직 위치 페이드
            const ageAlpha = Math.max(0, 1 - age / lifetime);
            let vertAlpha = 1.0;
            if (sprite.position.y > this.verticalFadeStart) {
                vertAlpha = 1 - (sprite.position.y - this.verticalFadeStart) / (this.verticalFadeEnd - this.verticalFadeStart);
                vertAlpha = Math.max(0, vertAlpha);
            }
            sprite.material.opacity = ageAlpha * vertAlpha * this.baseOpacity;
            this.parent.add(sprite);
            this.sprites.push(sprite);
        }
    }

    // 라디얼 그라디언트 기반 연기 스프라이트 텍스처 생성
    _createSpriteTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(
            size / 2,
            size / 2,
            0,
            size / 2,
            size / 2,
            size / 2
        );
        gradient.addColorStop(0, 'rgba(200,200,200,0.6)');
        gradient.addColorStop(0.2, 'rgba(120,120,120,0.4)');
        gradient.addColorStop(0.5, 'rgba(50,50,50,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        ctx.filter = 'blur(8px)'; // 연기에 블러 효과 적용
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
                    this.origin.x + (Math.random() - 0.5) * 1.0,
                    this.origin.y + Math.random() * 0.3,       // 초기 생성 Y 위치를 origin.y~origin.y+0.3 범위로 변경
                    this.origin.z + (Math.random() - 0.5) * 1.0
                );
                data.vel.set(
                    (Math.random() - 0.5) * 0.2,
                    Math.random() * 0.5 + 1.0,
                    (Math.random() - 0.5) * 0.2
                );
                data.lifetime = Math.random() * 2 + 2;
            }
            // 중력 적용 및 위치 업데이트 (단순 상승)
            data.vel.add(this.gravity.clone().multiplyScalar(delta));
            data.pos.addScaledVector(data.vel, delta);
            // 약간의 난류로 수평 움직임 추가
            data.pos.x += (Math.random() - 0.5) * 0.02;
            data.pos.z += (Math.random() - 0.5) * 0.02;

            // Sprite 위치 업데이트
            const sprite = this.sprites[i];
            sprite.position.copy(data.pos);

            // 개별 입자 페이드인/페이드아웃 처리
            const age = data.age;
            const lifetime = data.lifetime;
            let fadeAlpha = 1.0;
            if (age < this.fadeInDuration) {
                fadeAlpha = age / this.fadeInDuration;
            } else if (age > lifetime - this.fadeOutDuration) {
                fadeAlpha = (lifetime - age) / this.fadeOutDuration;
            }
            fadeAlpha = Math.max(0, Math.min(1, fadeAlpha));
            // 수직 페이드 적용
            let totalAlpha = fadeAlpha * this.baseOpacity;
            if (sprite.position.y > this.verticalFadeStart) {
                let vertFade = 1 - (sprite.position.y - this.verticalFadeStart) / (this.verticalFadeEnd - this.verticalFadeStart);
                vertFade = Math.max(0, vertFade);
                totalAlpha *= vertFade;
            }
            sprite.material.opacity = totalAlpha;

            // 크기: 살짝 변화
            const t = data.age / data.lifetime;
            const s = this.size * (1 + 0.5 * Math.sin(t * Math.PI));
            sprite.scale.set(s, s, s);
        }
    }
} 