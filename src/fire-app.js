/**
 * Fire App - THREE.js 기반 불 효과 시뮬레이션 메인 애플리케이션
 */

// ... existing code ...
import './Fire.js';
import { quotes } from './quotes.js';
import { fortunes, fortune_colors } from './fortune.js';
import { adManager } from './advertisements.js';
import EmberParticleSystem from './Ember.js';
import SmokeParticleSystem from './Smoke.js';
import ImageLayer from './image-layer.js';

// 이미지 목록을 remote index.html에서 파싱해 가져오는 함수
async function fetchYomiList() {
  // remote index.html에서 이미지 파일 목록 파싱
  const url = 'https://todaysyomi.onrender.com/index.html';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`목록 로드 실패: ${res.status}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items = Array.from(doc.querySelectorAll('ul li'))
      .map(li => li.textContent.trim())
      .filter(Boolean);
    return items.map(name => ({ name }));
  } catch (e) {
    console.error('이미지 목록 로드 및 파싱 실패:', e);
    return [];
  }
}

class FireApp {
    constructor() {
        // 중복 생성 방지 로그 추가
        if (window.fireApp) {
            console.warn('FireApp이 이미 존재합니다! 중복 생성을 방지합니다.');
            return window.fireApp;
        }
        
        console.log('FireApp 인스턴스 생성 시작');
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.fire = null;
        this.logs = null;
        this.fireGroup = null; // 불과 장작을 묶는 그룹
        this.clock = new THREE.Clock();
        
        // 밤하늘 관련 변수 추가
        this.bgCanvas = null;
        this.bgCtx = null;
        this.stars = [];
        this.isSkyEnabled = false;
        
        // 배경 이미지 관련 변수 추가
        this.bgImageCanvas = null;
        this.bgImageCtx = null;
        this.backgroundImage = null;
        this.isBgImageEnabled = false;
        this.bgImageFireOffset = { x: 0, y: 0 }; // 배경 이미지 기준 불의 기본 오프셋
        this.overlayImages = {}; // 오버레이 이미지 저장
        
        // 빛무리(glow) 관련 변수 추가
        this.glowCanvas = null;
        this.glowCtx = null;
        this.isGlowEnabled = false;
        this.glowScale = 1.0; // glow 크기 비율
        this.glowAlpha = 1.0; // glow 밝기 (0~1)
        this.glowRange = 1.0; // glow 범위 배수
        
        // 점화 시스템 (최소한만)
        this.isFireLit = false;
        this.ignitionAudio = null;
        
        // 배경 사운드 시스템 (크로스페이드)
        this.fireNormalSound1 = null;
        this.fireNormalSound2 = null;
        this.currentBgAudio = null;
        this.nextBgAudio = null;
        this.crossFadeTime = 0.5; // 0.5초 크로스페이드
        this.nextStarted = false;
        this.soundVolume = 0.5;
        this.isMuted = false;
        this.smoke = null;  // 연기 입자 시스템 참조
        this.smokeOpacity = 0;            // 연기 페이드인 투명도
        this.smokeStartTime = 0;          // 연기 페이드인 시작 시간
        this.smokeFadeDuration = 2000;    // 연기 페이드인 지속 시간 (ms)
        this.canvasSizeFactor = 2.0; // 모닥불 캔버스 크기 비율 (예: 1.2)
        
        this.hoverableItems = [
            { name: 'book_1', x: 450, y: 730, tolerance: 20 },
            { name: 'book_2', x: 487, y: 737, tolerance: 20 },
            { name: 'book_3', x: 1097, y: 703, tolerance: 20 },
            { name: 'adv_1',  x: 954, y: 846, tolerance: 30 }
        ];
        this.currentHoveredItem = null;
        
        // 클릭 제한 기능
        this.clickLimits = {
            book_1: { count: 0, lastReset: Date.now(), threshold: 8, timeWindow: 60000 },
            book_2: { count: 0, lastReset: Date.now(), threshold: 8, timeWindow: 60000 },
            book_3: { count: 0, lastReset: Date.now(), threshold: 5, timeWindow: 60000 },
            adv_1: { count: 0, lastReset: Date.now(), threshold: 5, timeWindow: 60000 }
        };
        
        // Panning state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.panOffset = { x: 0, y: 0 };
        this.touchStartTime = 0;  // 터치 시작 시간 (탭/드래그 구분용)
        
        // 현재 설정값
        this.currentValues = { ...this.defaultValues };
        
        this.isBookHovered = false; // 책 호버 상태

        this.init();
    }

    init() {
        this.createBackgroundCanvas(); // 배경 캔버스 먼저 생성
        this.createBackgroundImageCanvas(); // 배경 이미지 캔버스 생성
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createGlowCanvas(); // glow 캔버스 생성
        this.createLighting();
        this.loadFireTexture();
        this.loadBackgroundImage(); // 배경 이미지 로드
        this.imageLayer = new ImageLayer(['adv_1', 'chairs', 'book_1', 'book_2', 'book_3'], 4);
        this.setupEventListeners();
        this.animate();
    }

    // 배경 캔버스 생성 (밤하늘용)
    createBackgroundCanvas() {
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.id = 'bgCanvas';
        this.bgCanvas.style.position = 'fixed';
        this.bgCanvas.style.top = '0';
        this.bgCanvas.style.left = '0';
        this.bgCanvas.style.width = '100%';
        this.bgCanvas.style.height = '100%';
        this.bgCanvas.style.zIndex = '0';
        this.bgCanvas.style.pointerEvents = 'none';
        
        this.bgCtx = this.bgCanvas.getContext('2d');
        document.body.appendChild(this.bgCanvas);
        
        this.generateStars();
        this.updateBackgroundCanvas();
        
        console.log('Background canvas created');
    }

    // 배경 이미지 캔버스 생성
    createBackgroundImageCanvas() {
        this.bgImageCanvas = document.createElement('canvas');
        this.bgImageCanvas.id = 'bgImageCanvas';
        this.bgImageCanvas.style.position = 'fixed';
        this.bgImageCanvas.style.top = '0';
        this.bgImageCanvas.style.left = '0';
        this.bgImageCanvas.style.width = '100%';
        this.bgImageCanvas.style.height = '100%';
        this.bgImageCanvas.style.zIndex = '1';
        this.bgImageCanvas.style.pointerEvents = 'none';
        
        this.bgImageCtx = this.bgImageCanvas.getContext('2d');
        document.body.appendChild(this.bgImageCanvas);
        
        console.log('Background image canvas created');
    }

    // 배경 이미지 로드
    loadBackgroundImage() {
        this.backgroundImage = new Image();
        this.backgroundImage.onload = () => {
            console.log('Background image loaded');
            this.updateBackgroundImageCanvas();
        };
        this.backgroundImage.onerror = () => {
            console.warn('Background image failed to load');
        };
        this.backgroundImage.src = 'images/background.png';
    }

    // 별 생성
    generateStars() {
        this.stars = [];
        const numStars = 200;
        
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 1.5 + 0.5,
                baseAlpha: Math.random() * 0.8 + 0.2,
                twinkleFreq: Math.random() * 2 + 1,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }

    // 배경 캔버스 업데이트 (별과 그라디언트 그리기)
    updateBackgroundCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.bgCanvas.width = width;
        this.bgCanvas.height = height;
        
        // 캔버스 초기화
        this.bgCtx.clearRect(0, 0, width, height);
        
        if (this.isSkyEnabled) {
            // 밤하늘 그라디언트
            const skyGradient = this.bgCtx.createLinearGradient(0, 0, 0, height);
            skyGradient.addColorStop(0, '#0b1a34');
            skyGradient.addColorStop(1, '#000007');
            this.bgCtx.fillStyle = skyGradient;
            this.bgCtx.fillRect(0, 0, width, height);
            
            // 별 그리기
            const time = performance.now() / 1000;
            this.stars.forEach(star => {
                const flicker = 0.5 + 0.5 * Math.sin(star.twinkleFreq * time + star.twinklePhase);
                const alpha = star.baseAlpha * flicker;
                
                this.bgCtx.beginPath();
                this.bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                this.bgCtx.fillStyle = `rgba(255,255,255,${alpha})`;
                this.bgCtx.fill();
            });
        }
    }

    createScene() {
        this.scene = new THREE.Scene();
        console.log('Scene created');
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 5);
        console.log('Camera created');
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        // 캔버스 크기를 factor만큼 확장 (자동 스타일 업데이트 방지)
        const canvasWidth = window.innerWidth * this.canvasSizeFactor;
        const canvasHeight = window.innerHeight * this.canvasSizeFactor;
        this.renderer.setSize(canvasWidth, canvasHeight, false);
        this.renderer.setClearColor(0x000000, 0); // 투명하게 설정
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // CSS 크기 및 위치 조정 (중앙 정렬)
        const offsetX = (canvasWidth - window.innerWidth) / 2;
        const offsetY = (canvasHeight - window.innerHeight) / 2;
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = `-${offsetY}px`;
        this.renderer.domElement.style.left = `-${offsetX}px`;
        this.renderer.domElement.style.width = `${canvasWidth}px`;
        this.renderer.domElement.style.height = `${canvasHeight}px`;
        this.renderer.domElement.style.zIndex = '2'; // 배경 이미지 위에 배치
        this.renderer.domElement.style.pointerEvents = 'auto';
        this.renderer.domElement.style.cursor = 'pointer'; // 클릭 가능 표시
        
        // Canvas를 body에 추가
        document.body.appendChild(this.renderer.domElement);
        console.log('Renderer created and canvas added to DOM');
    }

    createGlowCanvas() {
        const canvasWidth = window.innerWidth * this.canvasSizeFactor;
        const canvasHeight = window.innerHeight * this.canvasSizeFactor;
        const offsetX = (canvasWidth - window.innerWidth) / 2;
        const offsetY = (canvasHeight - window.innerHeight) / 2;
        this.glowCanvas = document.createElement('canvas');
        this.glowCanvas.id = 'glowCanvas';
        this.glowCanvas.width = canvasWidth;
        this.glowCanvas.height = canvasHeight;
        this.glowCanvas.style.position = 'fixed';
        this.glowCanvas.style.top = `-${offsetY}px`;
        this.glowCanvas.style.left = `-${offsetX}px`;
        this.glowCanvas.style.width = `${canvasWidth}px`;
        this.glowCanvas.style.height = `${canvasHeight}px`;
        this.glowCanvas.style.pointerEvents = 'none';
        this.glowCanvas.style.zIndex = '3'; // 불 위에 배치
        document.body.appendChild(this.glowCanvas);
        this.glowCtx = this.glowCanvas.getContext('2d');
        console.log('Glow canvas created');
    }

    createLighting() {
        // 환경광 추가
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // 포인트 라이트 추가 (불꽃 효과 강화)
        const pointLight = new THREE.PointLight(0xff4400, 1, 100);
        pointLight.position.set(0, 0, 2);
        this.scene.add(pointLight);
        
        console.log('Lighting created');
    }

    loadFireTexture() {
        const textureLoader = new THREE.TextureLoader();
        
        // 불과 장작을 담을 그룹 생성
        this.fireGroup = new THREE.Group();
        this.scene.add(this.fireGroup);
        
        // 불 텍스처와 장작 텍스처를 모두 로드
        Promise.all([
            new Promise((resolve, reject) => {
                textureLoader.load(
                    'images/fire.png',
                    resolve,
                    undefined,
                    reject
                );
            }),
            new Promise((resolve, reject) => {
                textureLoader.load(
                    'images/logs.png',
                    resolve,
                    undefined,
                    reject
                );
            })
        ]).then(([fireTexture, logsTexture]) => {
            console.log('Both textures loaded successfully');
            this.createLogs(logsTexture);
            this.createFire(fireTexture);
        }).catch((error) => {
            console.error('Error loading textures:', error);
            // 텍스처 로딩 실패 시 기본 텍스처로 대체
            this.createFire(null);
        });
    }

    createLogs(logsTexture) {
        try {
            // 장작 geometry와 material 생성 (최적화된 크기)
            const logsGeometry = new THREE.PlaneGeometry(2.5, 2.5);
            const logsMaterial = new THREE.MeshBasicMaterial({
                map: logsTexture,
                transparent: true,
                alphaTest: 0.1
            });

            // 장작 메쉬 생성
            this.logs = new THREE.Mesh(logsGeometry, logsMaterial);
            
            // 최적화된 장작 위치와 크기 설정
            this.logs.scale.set(0.44, 0.44, 0.44);
            this.logs.position.set(0, -0.4, -0.15);
            this.logs.rotation.x = -0.05;
            
            // 그룹에 추가
            this.fireGroup.add(this.logs);
            console.log('Logs created and added to fire group');
        } catch (error) {
            console.error('Error creating logs:', error);
        }
    }

    createFire(texture) {
        try {
            // Fire 객체 생성
            this.fire = new THREE.Fire(texture, new THREE.Color().setRGB(255/255, 142/255, 211/255));
            
            // 디버깅: Fire 객체의 uniform들 확인
            console.log('Fire object created, available uniforms:', Object.keys(this.fire.material.uniforms));
            console.log('All uniforms:', this.fire.material.uniforms);
            
            // 초기 상태: 불꽃 꺼진 상태 (투명도만 0으로 설정)
            if (this.fire.material.uniforms.opacity) {
                this.fire.material.uniforms.opacity.value = 0.0; // 투명하게
            }
            
            // 점화 오디오 설정
            try {
                this.ignitionAudio = new Audio('sounds/fire_ignition.wav');
                this.ignitionAudio.volume = 0.6;
            } catch (e) {
                console.warn('Could not load ignition audio:', e);
            }
            
            // 배경 사운드 시스템 초기화
            try {
                this.fireNormalSound1 = new Audio('sounds/fire_normal.wav');
                this.fireNormalSound2 = new Audio('sounds/fire_normal.wav');
                this.currentBgAudio = this.fireNormalSound1;
                this.nextBgAudio = this.fireNormalSound2;
                
                // 초기 볼륨 설정
                this.fireNormalSound1.volume = this.soundVolume;
                this.fireNormalSound2.volume = 0;
                
                console.log('Background sound system initialized');
            } catch (e) {
                console.warn('Could not load background audio:', e);
            }
            
            // 그룹에 추가
            this.fireGroup.add(this.fire);
            
            // FireControls에 Fire 객체 전달
            if (window.fireControls) {
                window.fireControls.setFire(this.fire);
            }
            
            console.log('Fire object created in extinguished state');
        } catch (error) {
            console.error('Error creating fire object:', error);
        }
    }

    setupEventListeners() {
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', () => {
            this.onWindowResize();
        }, false);

        // 마우스 이동 이벤트 (호버 효과용)
        window.addEventListener('mousemove', (event) => {
            if (!this.isDragging) { // 드래그 중에는 호버 비활성화
                this.handleMouseMove(event);
            }
        });

        // 드래그-패닝 이벤트 리스너
        const grabTarget = document.body; // 전체 화면을 드래그 대상으로
        grabTarget.addEventListener('mousedown', this.onDragStart.bind(this));
        grabTarget.addEventListener('mousemove', this.onDragMove.bind(this));
        grabTarget.addEventListener('mouseup', this.onDragEnd.bind(this));
        grabTarget.addEventListener('mouseleave', this.onDragEnd.bind(this));
        
        // 모바일 터치 이벤트
        grabTarget.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
        grabTarget.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        grabTarget.addEventListener('touchend', this.onDragEnd.bind(this));
        grabTarget.addEventListener('touchcancel', this.onDragEnd.bind(this));

        // 클릭 이벤트 (불꽃 점화) - 데스크톱용
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('click', (event) => {
                this.handleClick(event);
            }, false);
        }

        // 터치 이벤트 (모바일용) - 전체 화면에서 터치 감지
        document.addEventListener('touchend', (event) => {
            // 터치 시간이 너무 짧거나 드래그 중이었다면 클릭으로 처리하지 않음
            const touchDuration = Date.now() - this.touchStartTime;
            if (this.isDragging || touchDuration < 50) {
                console.log('터치 이벤트 무시:', { isDragging: this.isDragging, duration: touchDuration });
                return;
            }
            
            // UI 요소가 아닌 곳에서 터치했을 때만 처리
            if (!event.target.closest('input, button, a, #settingsSidebar, #alarmSidebar, #timerSidebar, #weatherSidebar')) {
                // 터치 좌표를 클릭 이벤트 형식으로 변환
                const touch = event.changedTouches[0];
                const fakeEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: event.target,
                    isTouchEvent: true  // 터치 이벤트임을 표시
                };
                
                console.log('터치 클릭 처리:', { x: touch.clientX, y: touch.clientY });
                this.handleClick(fakeEvent);
            }
        }, { passive: true });

        // 터치 호버 이벤트 (모바일용)
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                const fakeEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    isTouchEvent: true
                };
                
                this.handleMouseMove(fakeEvent);
            }
        }, { passive: true });
    }

    onWindowResize() {
        // 카메라 종횡비 업데이트
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // 렌더러 크기 업데이트 (factor 적용)
        const canvasWidth = window.innerWidth * this.canvasSizeFactor;
        const canvasHeight = window.innerHeight * this.canvasSizeFactor;
        this.renderer.setSize(canvasWidth, canvasHeight, false);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // CSS 크기 및 위치 조정
        const offsetX = (canvasWidth - window.innerWidth) / 2;
        const offsetY = (canvasHeight - window.innerHeight) / 2;
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = `-${offsetY}px`;
        this.renderer.domElement.style.left = `-${offsetX}px`;
        this.renderer.domElement.style.width = `${canvasWidth}px`;
        this.renderer.domElement.style.height = `${canvasHeight}px`;
        
        // Glow 캔버스 크기 및 위치 동기화
        if (this.glowCanvas) {
            this.glowCanvas.width = canvasWidth;
            this.glowCanvas.height = canvasHeight;
            this.glowCanvas.style.top = `-${offsetY}px`;
            this.glowCanvas.style.left = `-${offsetX}px`;
            this.glowCanvas.style.width = `${canvasWidth}px`;
            this.glowCanvas.style.height = `${canvasHeight}px`;
        }
        
        // 배경 캔버스 크기 업데이트
        this.generateStars(); // 별 위치 재생성
        this.updateBackgroundCanvas();
        
        // 배경 이미지 캔버스 크기 업데이트
        this.updateBackgroundImageCanvas();
        
        // 컨트롤러에 리사이즈 이벤트 전달
        if (window.fireControls) {
            window.fireControls.updateCanvasPosition();
        }

        // 패닝 상태 초기화 및 전체 위치 업데이트
        this.panOffset = { x: 0, y: 0 };
        this.updateAllPositions();
        
        console.log('Window resized');
    }

    updateCamera() {
        if (!window.fireControls) return;
        
        const rotationSpeed = window.fireControls.getRotationSpeed();
        
        if (rotationSpeed > 0) {
            const time = this.clock.getElapsedTime();
            this.camera.position.x = Math.cos(time * rotationSpeed) * 5;
            this.camera.position.z = Math.sin(time * rotationSpeed) * 5;
            this.camera.lookAt(this.scene.position);
        }
    }

    animate() {
        requestAnimationFrame(() => {
            this.animate();
        });

        const delta = this.clock.getDelta();

        // 배경 업데이트 (별 깜빡임 애니메이션)
        if (this.isSkyEnabled) {
            this.updateBackgroundCanvas();
        }

        // 카메라 업데이트
        this.updateCamera();

        // Fire 애니메이션 업데이트
        if (this.fire) {
            const time = this.clock.getElapsedTime();
            this.fire.update(time);
        }

        // Ember 입자 효과 업데이트
        if (this.embers) {
            this.embers.update(delta);
        }

        // Smoke 입자 효과 업데이트 및 페이드인
        if (this.smoke) {
            this.smoke.update(delta);
            // smoke fade-in
            if (this.smokeOpacity < 1) {
                const elapsed = performance.now() - this.smokeStartTime;
                this.smokeOpacity = Math.min(1, elapsed / this.smokeFadeDuration);
            }
            // apply global fade
            this.smoke.sprites.forEach(sprite => {
                sprite.material.opacity *= this.smokeOpacity;
            });
        }

        // 렌더링
        this.renderer.render(this.scene, this.camera);
        
        // Glow 그리기
        this.drawGlow();
    }

    // 공개 메서드들
    getFire() {
        return this.fire;
    }

    getLogs() {
        return this.logs;
    }

    getFireGroup() {
        return this.fireGroup;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    // 밤하늘 토글 메서드
    toggleNightSky(enabled) {
        this.isSkyEnabled = enabled;
        this.updateBackgroundCanvas();
        console.log('Night sky:', enabled ? 'enabled' : 'disabled');
    }

    // 배경 이미지 토글 메서드
    toggleBackgroundImage(enabled) {
        this.isBgImageEnabled = enabled;
        this.updateBackgroundImageCanvas();
        console.log('Background image:', enabled ? 'enabled' : 'disabled');
    }

    // 이미지 레이어 토글 메서드
    toggleImageLayer(enabled) {
        if (this.imageLayer) {
            this.imageLayer.toggle(enabled);
            console.log('Image layer:', enabled ? 'enabled' : 'disabled');
        }
    }

    // 이미지 레이어 상태 반환
    getImageLayerEnabled() {
        return this.imageLayer ? this.imageLayer.enabled : false;
    }

    // 밤하늘 상태 반환
    getNightSkyEnabled() {
        return this.isSkyEnabled;
    }

    // 배경 이미지 상태 반환
    getBackgroundImageEnabled() {
        return this.isBgImageEnabled;
    }

    // 볼륨 페이드 헬퍼 함수
    fadeVolume(audio, from, to, duration) {
        const stepTime = 50;
        const steps = duration * 1000 / stepTime;
        let step = 0;
        const diff = to - from;
        const interval = setInterval(() => {
            step++;
            const newVolume = Math.min(Math.max(from + diff * step / steps, 0), 1);
            audio.volume = newVolume;
            if (step >= steps) clearInterval(interval);
        }, stepTime);
    }

    // 크로스페이드 루프 모니터링
    crossFadeLoop() {
        if (!this.isFireLit || !this.currentBgAudio) return;

        // 다음 오디오 시작을 아직 못했으면 타이밍 체크
        if (!this.nextStarted && 
            this.currentBgAudio.currentTime >= this.currentBgAudio.duration - this.crossFadeTime) {
            
            this.nextStarted = true;
            this.nextBgAudio.currentTime = 0;
            this.nextBgAudio.volume = 0;
            
            // 음소거 상태가 아닐 때만 소리 재생
            if (!this.isMuted) {
                this.nextBgAudio.play().catch(e => console.log('배경 오디오 재생 실패:', e));
                // 크로스페이드
                this.fadeVolume(this.currentBgAudio, this.soundVolume, 0, this.crossFadeTime);
                this.fadeVolume(this.nextBgAudio, 0, this.soundVolume, this.crossFadeTime);
            } else {
                // 음소거 상태라면 소리 없이 재생
                this.nextBgAudio.volume = 0;
                this.nextBgAudio.play().catch(e => console.log('배경 오디오 재생 실패:', e));
            }
            
            // 페이드 끝나면 swap
            setTimeout(() => {
                this.currentBgAudio.pause();
                [this.currentBgAudio, this.nextBgAudio] = [this.nextBgAudio, this.currentBgAudio];
                this.nextStarted = false;
            }, this.crossFadeTime * 1000);
        }
        
        // 불이 켜져있는 동안 계속 모니터링
        if (this.isFireLit) {
            requestAnimationFrame(() => this.crossFadeLoop());
        }
    }

    // 배경 사운드 재생 시작
    startBackgroundSound() {
        if (!this.currentBgAudio || !this.isFireLit) return;
        
        this.currentBgAudio.currentTime = 0;
        this.currentBgAudio.volume = this.isMuted ? 0 : this.soundVolume;
        
        this.currentBgAudio.play().catch(e => console.log('배경 오디오 재생 실패:', e));
        this.nextStarted = false;
        
        // 크로스페이드 루프 시작
        this.crossFadeLoop();
    }

    // 배경 사운드 정지
    stopBackgroundSound() {
        if (this.currentBgAudio) {
            this.currentBgAudio.pause();
        }
        if (this.nextBgAudio) {
            this.nextBgAudio.pause();
        }
        this.nextStarted = false;
    }

    // 볼륨 설정
    setVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        
        if (this.ignitionAudio) {
            this.ignitionAudio.volume = this.soundVolume;
        }
        
        if (!this.isMuted) {
            if (this.currentBgAudio) {
                this.currentBgAudio.volume = this.soundVolume;
            }
            if (this.nextBgAudio && this.nextStarted) {
                this.nextBgAudio.volume = this.soundVolume;
            }
        }
    }

    // 음소거 토글
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // 음소거 시 모든 오디오 볼륨을 0으로
            if (this.ignitionAudio) this.ignitionAudio.volume = 0;
            if (this.currentBgAudio) this.currentBgAudio.volume = 0;
            if (this.nextBgAudio) this.nextBgAudio.volume = 0;
        } else {
            // 음소거 해제 시 원래 볼륨으로
            if (this.ignitionAudio) this.ignitionAudio.volume = this.soundVolume;
            if (this.currentBgAudio) this.currentBgAudio.volume = this.soundVolume;
            // nextBgAudio는 페이드인될 때까지 0 유지
        }
    }

    // 불 끄기 기능 (추가 기능)
    extinguishFire() {
        this.isFireLit = false;
        // 불이 꺼질 때 기존 불똥 제거
        if (this.embers && this.fireGroup) {
            this.embers.sprites.forEach(sprite => this.fireGroup.remove(sprite));
            this.embers = null;
        }
        // 연기 삭제
        if (this.smoke && this.fireGroup) {
            this.smoke.sprites.forEach(sprite => this.fireGroup.remove(sprite));
            this.smoke = null;
        }
        
        // 배경 사운드 정지
        this.stopBackgroundSound();
        
        // 불꽃을 투명하게 만들기
        if (this.fire && this.fire.material.uniforms.opacity) {
            this.fire.material.uniforms.opacity.value = 0.0;
        }
        
        console.log('Fire extinguished');
    }

    // 클릭 이벤트 처리
    handleClick(event) {
        console.log('handleClick 호출:', { 
            x: event.clientX, 
            y: event.clientY, 
            isTouchEvent: event.isTouchEvent,
            imageLayerEnabled: this.getImageLayerEnabled()
        });
        
        // UI 요소 위에서의 클릭은 무시
        if (event.target.closest('input, button, a, #settingsSidebar, #alarmSidebar, #timerSidebar, #weatherSidebar')) {
            console.log('UI 요소 클릭으로 무시');
            return;
        }

        // book_1 클릭 확인 (소품 이미지 레이어가 활성화되어 있을 때만)
        if (this.getImageLayerEnabled()) {
            const { drawX, drawY, drawWidth, drawHeight } = this.getBgImageDrawInfo();
            const { naturalWidth, naturalHeight } = this.backgroundImage;
            if (drawWidth) {
                const scaleX = drawWidth / naturalWidth;
                const scaleY = drawHeight / naturalHeight;
                const book1 = this.hoverableItems.find(item => item.name === 'book_1');
                const book2 = this.hoverableItems.find(item => item.name === 'book_2');
                const book3 = this.hoverableItems.find(item => item.name === 'book_3');

                // 터치 이벤트인 경우 tolerance를 1.01배 확장
                const touchMultiplier = event.isTouchEvent ? 1.01 : 1.0;

                if (book1) {
                    const targetX = drawX + this.panOffset.x + book1.x * scaleX;
                    const targetY = drawY + this.panOffset.y + book1.y * scaleY;
                    const tolerance = book1.tolerance * touchMultiplier;

                    console.log('book1 터치 체크:', { 
                        targetX, targetY, tolerance, 
                        clickX: event.clientX, clickY: event.clientY,
                        distanceX: Math.abs(event.clientX - targetX),
                        distanceY: Math.abs(event.clientY - targetY)
                    });

                    if (Math.abs(event.clientX - targetX) < tolerance &&
                        Math.abs(event.clientY - targetY) < tolerance) {
                        if (this.checkClickLimit('book_1')) {
                            this.showRandomQuote(event.clientX, event.clientY);
                        } else {
                            this.showClickLimitWarning(event.clientX, event.clientY);
                        }
                        return;
                    }
                }

                if (book2) {
                    const targetX = drawX + this.panOffset.x + book2.x * scaleX;
                    const targetY = drawY + this.panOffset.y + book2.y * scaleY;
                    const tolerance = book2.tolerance * touchMultiplier;

                    console.log('book2 터치 체크:', { 
                        targetX, targetY, tolerance, 
                        clickX: event.clientX, clickY: event.clientY,
                        distanceX: Math.abs(event.clientX - targetX),
                        distanceY: Math.abs(event.clientY - targetY)
                    });

                    if (Math.abs(event.clientX - targetX) < tolerance &&
                        Math.abs(event.clientY - targetY) < tolerance) {
                        if (this.checkClickLimit('book_2')) {
                            this.showRandomFortune(event.clientX, event.clientY);
                        } else {
                            this.showClickLimitWarning(event.clientX, event.clientY);
                        }
                        return;
                    }
                }

                if (book3) {
                    const targetX = drawX + this.panOffset.x + book3.x * scaleX;
                    const targetY = drawY + this.panOffset.y + book3.y * scaleY;
                    const tolerance = book3.tolerance * touchMultiplier;

                    console.log('book3 터치 체크:', { 
                        targetX, targetY, tolerance, 
                        clickX: event.clientX, clickY: event.clientY,
                        distanceX: Math.abs(event.clientX - targetX),
                        distanceY: Math.abs(event.clientY - targetY)
                    });

                    if (Math.abs(event.clientX - targetX) < tolerance &&
                        Math.abs(event.clientY - targetY) < tolerance) {
                        if (this.checkClickLimit('book_3')) {
                            this.showYomiConfirmation(event.clientX, event.clientY);
                        } else {
                            this.showClickLimitWarning(event.clientX, event.clientY);
                        }
                        return;
                    }
                }

                // adv_1 클릭 처리 (클릭 제한 추가)
                const adv1 = this.hoverableItems.find(item => item.name === 'adv_1');
                if (adv1) {
                    const targetX = drawX + this.panOffset.x + adv1.x * scaleX;
                    const targetY = drawY + this.panOffset.y + adv1.y * scaleY;
                    const tolerance = adv1.tolerance * touchMultiplier;

                    console.log('adv1 터치 체크:', { 
                        targetX, targetY, tolerance, 
                        clickX: event.clientX, clickY: event.clientY,
                        distanceX: Math.abs(event.clientX - targetX),
                        distanceY: Math.abs(event.clientY - targetY)
                    });

                    if (Math.abs(event.clientX - targetX) < tolerance &&
                        Math.abs(event.clientY - targetY) < tolerance) {
                        if (this.checkClickLimit('adv_1')) {
                            this.showAdConfirmation(event.clientX, event.clientY);
                        } else {
                            this.showClickLimitWarning(event.clientX, event.clientY);
                        }
                        return;
                    }
                }
            }
        }

        // 터치나 클릭으로 불 점화/플레어
        console.log('불 클릭/터치 감지:', { 
            isFireLit: this.isFireLit, 
            isTouchEvent: event.isTouchEvent 
        });

        // 점화 사운드 재생
        if (this.ignitionAudio) {
            this.ignitionAudio.currentTime = 0;
            this.ignitionAudio.play().catch(e => {
                console.log('Audio playback failed:', e);
            });
        }

        if (!this.isFireLit) {
            // 불이 꺼져있을 때 클릭/터치
            console.log('불 점화 시작');
            this.igniteFireAnimation();
        } else {
            // 불이 켜져있을 때 클릭/터치
            console.log('불 플레어 시작');
            this.flareFireAnimation();
        }
    }

    showRandomQuote(x, y) {
        // 기존 팝업이 있으면 제거
        const existingPopup = document.querySelector('.quote-popup');
        if (existingPopup) existingPopup.remove();

        // 랜덤 명언 선택
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        // 팝업 요소 생성
        const popup = document.createElement('div');
        popup.className = 'quote-popup';
        popup.innerHTML = `
            <div class="quote-text">"${randomQuote.quote}"</div>
            <div class="quote-author">- ${randomQuote.author}</div>
        `;
        document.body.appendChild(popup);

        // 팝업 위치 설정 (화면 경계 고려)
        const popupWidth = popup.offsetWidth || 350; // 기본값 설정
        const popupHeight = popup.offsetHeight || 150;
        
        let leftPos = x - popupWidth / 2;
        let topPos = y - popupHeight - 20;
        
        // 화면 경계 체크 및 조정
        if (leftPos < 10) leftPos = 10;
        if (leftPos + popupWidth > window.innerWidth - 10) leftPos = window.innerWidth - popupWidth - 10;
        if (topPos < 10) topPos = y + 20;
        
        popup.style.left = `${leftPos}px`;
        popup.style.top = `${topPos}px`; // 클릭 위치보다 위쪽으로

        // 페이드인
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        // 5초 후 페이드아웃 및 제거
        setTimeout(() => {
            popup.classList.remove('show');
            popup.addEventListener('transitionend', () => popup.remove());
        }, 5000);
    }

    checkClickLimit(bookName) {
        const now = Date.now();
        const limit = this.clickLimits[bookName];
        
        // 시간 윈도우가 지났으면 카운터 리셋
        if (now - limit.lastReset > limit.timeWindow) {
            limit.count = 0;
            limit.lastReset = now;
        }
        
        // 카운터 증가
        limit.count++;
        
        // 임계값 초과 확인
        return limit.count <= limit.threshold;
    }

    showClickLimitWarning(x, y) {
        // 기존 경고 팝업이 있으면 제거
        const existingPopup = document.querySelector('.warning-popup');
        if (existingPopup) existingPopup.remove();

        const popup = document.createElement('div');
        popup.className = 'quote-popup warning-popup';
        popup.innerHTML = '<div class="warning-title">그만 좀 누르세요...</div>';
        document.body.appendChild(popup);

        // 팝업 위치 설정 (화면 경계 고려)
        const popupWidth = popup.offsetWidth || 300;
        const popupHeight = popup.offsetHeight || 100;
        
        let leftPos = x - popupWidth / 2;
        let topPos = y - popupHeight - 20;
        
        // 화면 경계 체크 및 조정
        if (leftPos < 10) leftPos = 10;
        if (leftPos + popupWidth > window.innerWidth - 10) leftPos = window.innerWidth - popupWidth - 10;
        if (topPos < 10) topPos = y + 20;
        
        popup.style.left = `${leftPos}px`;
        popup.style.top = `${topPos}px`;

        // 페이드인
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        // 3초 후 페이드아웃 및 제거
        setTimeout(() => {
            popup.classList.remove('show');
            popup.addEventListener('transitionend', () => popup.remove());
        }, 3000);
    }

    showRandomFortune(x, y) {
        // 기존 팝업이 있으면 제거
        const existingPopup = document.querySelector('.fortune-popup');
        if (existingPopup) existingPopup.remove();

        // 각 타입별로 행운 콘텐츠 생성
        const messagePool = fortunes.filter(f => f.type === '메시지');
        const itemPool = fortunes.filter(f => f.type === '아이템');
        
        const selectedMessage = messagePool[Math.floor(Math.random() * messagePool.length)];
        const selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];
        const finalNumber = Math.floor(Math.random() * 100) + 1;
        const finalColor = fortune_colors[Math.floor(Math.random() * fortune_colors.length)];

        // 팝업 요소 생성
        const popup = document.createElement('div');
        popup.className = 'quote-popup fortune-popup';
        popup.innerHTML = `
            <div class="fortune-title">- 행운의 책 -</div>
            <ul class="fortune-list">
                <li class="message-item">
                    <span class="fortune-content message">"${selectedMessage.content}"</span>
                </li>
                <li>
                    <span class="fortune-type">행운의 숫자</span>
                    <span class="fortune-content number">${finalNumber}</span>
                </li>
                <li>
                    <span class="fortune-type">행운의 색상</span>
                    <span class="fortune-content color">
                        <span class="color-swatch" style="background-color: ${finalColor.hex};"></span>
                        ${finalColor.name}
                    </span>
                </li>
                <li>
                    <span class="fortune-type">행운의 아이템</span>
                    <span class="fortune-content item">${selectedItem.content}</span>
                </li>
            </ul>
        `;
        document.body.appendChild(popup);

        // 팝업 위치 설정 (화면 경계 고려)
        const popupWidth = popup.offsetWidth || 380;
        const popupHeight = popup.offsetHeight || 200;
        
        let leftPos = x - popupWidth / 2;
        let topPos = y - popupHeight - 20;
        
        // 화면 경계 체크 및 조정
        if (leftPos < 10) leftPos = 10;
        if (leftPos + popupWidth > window.innerWidth - 10) leftPos = window.innerWidth - popupWidth - 10;
        if (topPos < 10) topPos = y + 20;
        
        popup.style.left = `${leftPos}px`;
        popup.style.top = `${topPos}px`;

        // 페이드인
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        // 8초 후 페이드아웃 및 제거 (시간을 늘림)
        setTimeout(() => {
            popup.classList.remove('show');
            popup.addEventListener('transitionend', () => popup.remove());
        }, 8000);
    }

    // 광고 확인 팝업 표시 - 보기/그만두기 버튼 포함
    showAdConfirmation(x, y) {
        // 기존 팝업이 있으면 제거
        const existingPopup = document.querySelector('.ad-confirm-popup');
        if (existingPopup) existingPopup.remove();

        // 팝업 요소 생성
        const popup = document.createElement('div');
        popup.className = 'ad-confirm-popup';
        popup.innerHTML = `
            <div class="ad-confirm-title">광고지인 것 같다...</div>
            <div class="ad-confirm-buttons">
                <button class="ad-confirm-btn view-btn">보기</button>
                <button class="ad-confirm-btn cancel-btn">그만두기</button>
            </div>
        `;
        document.body.appendChild(popup);

        // 팝업 위치 설정 (화면 경계 고려)
        const popupWidth = popup.offsetWidth || 280;
        const popupHeight = popup.offsetHeight || 100;
        
        let leftPos = x - popupWidth / 2;
        let topPos = y - popupHeight - 20;
        
        // 화면 경계 체크 및 조정
        if (leftPos < 10) leftPos = 10;
        if (leftPos + popupWidth > window.innerWidth - 10) leftPos = window.innerWidth - popupWidth - 10;
        if (topPos < 10) topPos = y + 20;
        
        popup.style.left = `${leftPos}px`;
        popup.style.top = `${topPos}px`;

        // 이벤트 리스너 추가
        const viewBtn = popup.querySelector('.view-btn');
        const cancelBtn = popup.querySelector('.cancel-btn');

        viewBtn.addEventListener('click', () => {
            popup.remove();
            this.showAdModal();
        });

        cancelBtn.addEventListener('click', () => {
            popup.classList.remove('show');
            popup.addEventListener('transitionend', () => popup.remove());
        });

        // 페이드인
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        // 5초 후 자동 페이드아웃 및 제거
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.classList.remove('show');
                popup.addEventListener('transitionend', () => popup.remove());
            }
        }, 5000);
    }

    // 광고 모달 표시 - 사이드바 스타일 참고한 모달, 여러 광고 배열 가능
    showAdModal() {
        // 기존 모달이 있으면 제거
        const existingModal = document.querySelector('.ad-modal-overlay');
        if (existingModal) existingModal.remove();

        // 모든 광고 데이터 가져오기 (나중에 여러 광고 추가 시 확장 가능)
        const ads = adManager.ads;

        // 모달 오버레이 생성
        const overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        
        // 광고 아이템들 생성
        const adItemsHTML = ads.map(ad => `
            <div class="ad-item">
                <img class="ad-item-image" src="${ad.imageUrl}" alt="${ad.title}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="ad-item-fallback" style="display:none; text-align:center; padding:40px; color:#999; background:rgba(255,255,255,0.05); border-radius:4px;">${ad.fallbackText || '더이상 알아볼 수 없는 광고입니다'}</div>
                <div class="ad-item-description">${ad.description}</div>
                <a href="${ad.linkUrl || ad.imageUrl}" target="_blank" class="ad-item-link">
                    자세히 보기
                </a>
            </div>
        `).join('');

        overlay.innerHTML = `
            <div class="ad-modal">
                <div class="ad-modal-header">
                    <h3 class="ad-modal-title">광고</h3>
                    <button class="ad-modal-close">×</button>
                </div>
                <div class="ad-modal-content">
                    ${adItemsHTML}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // 이벤트 리스너 추가
        const closeBtn = overlay.querySelector('.ad-modal-close');
        
        const closeModal = () => {
            overlay.classList.remove('show');
            overlay.addEventListener('transitionend', () => overlay.remove());
        };

        closeBtn.addEventListener('click', closeModal);
        
        // 오버레이 클릭 시 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // ESC 키로 닫기
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // 모달 페이드인
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // 에러 메시지 표시를 위한 요소 생성
        const errorEl = document.createElement('div');
        errorEl.className = 'yomi-error';
        errorEl.textContent = '이미지를 불러올 수 없어요...';
        errorEl.style.textAlign = 'center';
        errorEl.style.color = '#888';
        errorEl.style.margin = '20px 0';
        errorEl.style.display = 'none';
        overlay.querySelector('.ad-modal').appendChild(errorEl);
    }

    // 책 3 '오늘의 요미' 확인 팝업 표시 - 보기/그만두기 버튼 포함
    showYomiConfirmation(x, y) {
        const existingPopup = document.querySelector('.ad-confirm-popup');
        if (existingPopup) existingPopup.remove();

        const popup = document.createElement('div');
        popup.className = 'ad-confirm-popup';
        popup.innerHTML = `
            <div class="ad-confirm-title" style="text-align:center;">
                <img src="images/yominote.png" style="width:128px;height:128px;display:block;margin:0 auto;" alt="요미 아이콘" />
                <div style="margin-top:8px;">오늘의 요미...</div>
            </div>
            <div class="ad-confirm-buttons">
                <button class="ad-confirm-btn view-btn">보기</button>
                <button class="ad-confirm-btn cancel-btn">그만두기</button>
            </div>
        `;
        document.body.appendChild(popup);

        const popupWidth = popup.offsetWidth || 280;
        const popupHeight = popup.offsetHeight || 100;
        let leftPos = x - popupWidth / 2;
        let topPos = y - popupHeight - 20;
        if (leftPos < 10) leftPos = 10;
        if (leftPos + popupWidth > window.innerWidth - 10) leftPos = window.innerWidth - popupWidth - 10;
        if (topPos < 10) topPos = y + 20;
        popup.style.left = `${leftPos}px`;
        popup.style.top = `${topPos}px`;

        const viewBtn = popup.querySelector('.view-btn');
        const cancelBtn = popup.querySelector('.cancel-btn');

        viewBtn.addEventListener('click', () => {
            popup.remove();
            this.showYomiModal();
        });
        cancelBtn.addEventListener('click', () => {
            popup.classList.remove('show');
            popup.addEventListener('transitionend', () => popup.remove());
        });

        setTimeout(() => popup.classList.add('show'), 10);
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.classList.remove('show');
                popup.addEventListener('transitionend', () => popup.remove());
            }
        }, 5000);
    }

    // '오늘의 요미' 모달 표시
    async showYomiModal() {
        // 기존 모달 제거
        const existingModal = document.querySelector('.ad-modal-overlay');
        if (existingModal) existingModal.remove();

        // 모달 골격 생성
        const overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML = `
            <div class="ad-modal">
                <div class="ad-modal-header">
                    <h3 class="ad-modal-title">오늘의 요미</h3>
                    <button class="ad-modal-close">×</button>
                </div>
                <div class="ad-modal-content" style="text-align:center; display:flex; align-items:center; justify-content:space-between;">
                    <button class="yomi-prev">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <img class="yomi-img" src="" style="max-width:65%; height:auto; margin:0 6px; flex-shrink: 1;" />
                    <button class="yomi-next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="yomi-info" style="text-align:center; margin-top:8px; margin-bottom:20px;">
                    <div class="yomi-title" style="font-weight:bold; font-size:1.2em;"></div>
                    <div class="yomi-date" style="color:#888; margin-top:4px;"></div>
                    <div class="yomi-desc" style="margin-top:4px;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // 닫기 이벤트
        const closeBtn = overlay.querySelector('.ad-modal-close');
        const closeModal = () => overlay.remove();
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

        // Drive API로 목록 가져오기
        let list;
        try {
            list = await fetchYomiList();
        } catch (e) {
            console.error('요미 목록 로드 실패', e);
            // 에러 메시지 전용 내용 표시
            overlay.innerHTML = '<div style="padding:20px; text-align:center;">이미지를 불러올 수 없어요...</div>';
            return;
        }
        if (!list.length) {
            console.warn('이미지 없음');
            // 에러 메시지 전용 내용 표시
            overlay.innerHTML = '<div style="padding:20px; text-align:center;">이미지를 불러올 수 없어요...</div>';
            return;
        }

        // 파일명의 날짜 순으로 정렬 (최신 파일이 먼저 오도록)
        list.sort((a, b) => {
            const extractDate = file => {
                const base = file.name.replace(/\.[^/.]+$/, '');
                const parts = base.split('_');
                const token = parts.find(part => /^\d{8}/.test(part));
                return token ? parseInt(token.slice(0,8), 10) : 0;
            };
            return extractDate(b) - extractDate(a);
        });

        // 이미지 사전 로드
        list.forEach(file => {
            // 서버에서 이미지 로드 (프리로드 시도)
            const imgUrl = `https://todaysyomi.onrender.com/images/${file.name}`;
            console.log('Yomi 이미지 프리로드 시도:', imgUrl);
            const imgPre = new Image();
            imgPre.src = imgUrl;
        });

        // 인덱스 및 요소 초기화
        let idx = 0;
        const imgEl  = overlay.querySelector('.yomi-img');
        const prevEl = overlay.querySelector('.yomi-prev');
        const nextEl = overlay.querySelector('.yomi-next');
        const infoTitleEl = overlay.querySelector('.yomi-title');
        const infoDateEl  = overlay.querySelector('.yomi-date');
        const infoDescEl  = overlay.querySelector('.yomi-desc');

        // 이미지 업데이트 함수
        const update = () => {
            const file = list[idx];
            // 서버에서 이미지 로드 시도
            const imgUrl = `https://todaysyomi.onrender.com/images/${file.name}`;
            console.log('Yomi 이미지 로드 시도:', imgUrl);
            imgEl.onerror = () => {
                console.error('Yomi 이미지 로드 실패:', imgUrl);
                // 이미지 로드 실패 시 플레이스홀더 이미지로 교체 및 설명 메시지 표시
                imgEl.src = 'images/yominote.png';
                infoTitleEl.style.display = 'none';
                infoDateEl.style.display  = 'none';
                infoDescEl.textContent     = '이미지를 불러올 수 없어요...';
                infoDescEl.style.display   = '';
            };
            imgEl.src = imgUrl;
            // 파일명으로 제목/날짜/설명 파싱
            const name = file.name;
            const base = name.replace(/\.[^/.]+$/, '');
            const parts = base.split('_');
            let title = '', dateRaw = '', desc = '';
            // 날짜 토큰(YYYYMMDD 및 선택적 접미사)을 parts에서 찾음
            const dateTokenIndex = parts.findIndex(part => /^\d{8}(?:-.+)?$/.test(part));
            if (dateTokenIndex !== -1) {
                dateRaw = parts[dateTokenIndex];
                // 날짜 토큰 이전은 제목으로
                title = parts.slice(0, dateTokenIndex).join('_');
                // 날짜 토큰 이후는 설명으로
                desc = parts.slice(dateTokenIndex + 1).join('_');
            } else {
                // 날짜 토큰이 없으면 전체 base를 제목으로 사용
                title = base;
            }
            // 날짜 표시 형식 YYYY-MM-DD 및 선택적 접미사
            let dateDisplay = '';
            if (dateRaw && dateRaw.length >= 8) {
                const y = dateRaw.slice(0,4), m = dateRaw.slice(4,6), d = dateRaw.slice(6,8);
                dateDisplay = `${y}-${m}-${d}`;
                const rawSuffix = dateRaw.slice(8);
                if (rawSuffix) {
                    const suf = rawSuffix.startsWith('-') ? rawSuffix.slice(1) : rawSuffix;
                    dateDisplay += `···${suf}`;
                }
            }
            // 엘리먼트에 반영
            infoTitleEl.textContent = title;
            infoTitleEl.style.display = title ? '' : 'none';
            infoDateEl.textContent  = dateDisplay;
            infoDateEl.style.display  = dateDisplay ? '' : 'none';
            infoDescEl.textContent   = desc;
            infoDescEl.style.display   = desc ? '' : 'none';
            prevEl.disabled = (idx === 0);
            nextEl.disabled = (idx === list.length - 1);
        };

        // 페이드 이펙트용 요소 및 트랜지션 설정
        const contentEl = overlay.querySelector('.ad-modal-content');
        const infoEl    = overlay.querySelector('.yomi-info');
        contentEl.style.transition = 'opacity 0.3s ease';
        infoEl.style.transition    = 'opacity 0.3s ease';
        contentEl.style.opacity    = '1';
        infoEl.style.opacity       = '1';

        prevEl.addEventListener('click', () => {
            if (idx > 0) {
                contentEl.style.opacity = '0';
                infoEl.style.opacity    = '0';
                const onFadeOut = () => {
                    contentEl.removeEventListener('transitionend', onFadeOut);
                    idx--;
                    // 이미지 로드 완료 후 페이드 인
                    const onImgLoad = () => {
                        imgEl.removeEventListener('load', onImgLoad);
                        contentEl.style.opacity = '1';
                        infoEl.style.opacity    = '1';
                    };
                    imgEl.addEventListener('load', onImgLoad);
                    update();
                };
                contentEl.addEventListener('transitionend', onFadeOut);
            }
        });
        nextEl.addEventListener('click', () => {
            if (idx < list.length - 1) {
                contentEl.style.opacity = '0';
                infoEl.style.opacity    = '0';
                const onFadeOutNext = () => {
                    contentEl.removeEventListener('transitionend', onFadeOutNext);
                    idx++;
                    // 이미지 로드 완료 후 페이드 인
                    const onImgLoadNext = () => {
                        imgEl.removeEventListener('load', onImgLoadNext);
                        contentEl.style.opacity = '1';
                        infoEl.style.opacity    = '1';
                    };
                    imgEl.addEventListener('load', onImgLoadNext);
                    update();
                };
                contentEl.addEventListener('transitionend', onFadeOutNext);
            }
        });
        update();

        // 모달 표시
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    // 불 점화 애니메이션
    igniteFireAnimation() {
        this.isFireLit = true;
        // 불 점화 시 불똥 및 연기 효과 생성 (토글된 경우에만)
        if (window.fireControls && window.fireControls.currentValues.embersEnabled) {
            this.createEmbers();
        }
        if (window.fireControls && window.fireControls.currentValues.smokeEnabled) {
            this.createSmoke();
        }
        
        if (!this.fire || !window.fireControls) return;
        
        const targetValues = window.fireControls.currentValues;
        
        // opacity는 바로 설정치로 변경
        if (this.fire.material.uniforms.opacity) {
            this.fire.material.uniforms.opacity.value = targetValues.opacity;
        }
        
        // 배경 사운드 시작
        this.startBackgroundSound();
        
        // magnitude만 애니메이션: (설정치-0.7) → 설정치 (0.6초)
        const animationDuration = 600; // 0.6초
        
        const startTime = performance.now();
        const targetMagnitude = targetValues.magnitude;
        const tempMagnitude = Math.max(0.1, targetMagnitude - 0.7);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / animationDuration, 1.0);
            
            // 부드러운 이징 적용
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // magnitude: (설정치-0.7) → 설정치
            const currentMagnitude = tempMagnitude + (targetMagnitude - tempMagnitude) * easeProgress;
            if (this.fire.material.uniforms.magnitude) {
                this.fire.material.uniforms.magnitude.value = currentMagnitude;
            }
            
            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                // 완료: 설정치 적용
                if (window.fireControls) {
                    window.fireControls.applyCurrentValues();
                }
            }
        };
        
        // 애니메이션 속도: 0.05초만에 설정치+1로 갔다가 0.05초만에 복귀
        this.animateSpeed(targetValues.animationSpeed);
        
        // 밝기 강화: 0.1초만에 설정치+1로 갔다가 0.2초동안 복귀
        this.animateBrightness(targetValues.toonBrightness);
        
        requestAnimationFrame(animate);
    }

    // 불꽃 플레어 애니메이션
    flareFireAnimation() {
        if (!this.fire || !window.fireControls) return;
        
        const targetValues = window.fireControls.currentValues;
        
        // magnitude만 살짝 변화 (설정치 → 설정치-0.7 → 설정치) (0.5초)
        const animationDuration = 500; // 0.5초
        
        const startTime = performance.now();
        const currentMagnitude = targetValues.magnitude;
        const tempMagnitude = Math.max(0.1, currentMagnitude - 0.7);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / animationDuration, 1.0);
            
            // 사인파 형태의 플레어 (내려갔다 올라옴)
            const flareProgress = Math.sin(progress * Math.PI);
            const magnitude = currentMagnitude + (tempMagnitude - currentMagnitude) * flareProgress;
            
            if (this.fire.material.uniforms.magnitude) {
                this.fire.material.uniforms.magnitude.value = magnitude;
            }
            
            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                // 완료: 설정치로 복원
                if (this.fire.material.uniforms.magnitude) {
                    this.fire.material.uniforms.magnitude.value = currentMagnitude;
                }
            }
        };
        
        // 애니메이션 속도: 0.05초만에 설정치+1로 갔다가 0.05초만에 복귀
        this.animateSpeed(targetValues.animationSpeed);
        
        // 밝기 강화: 0.1초만에 설정치+1로 갔다가 0.4초동안 복귀
        this.animateBrightness(targetValues.toonBrightness);
        
        requestAnimationFrame(animate);
    }

    // 애니메이션 속도 효과
    animateSpeed(targetSpeed) {
        if (!this.fire) return;
        
        const tempSpeed = targetSpeed + 1;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            
            if (elapsed < 50) {
                // 0.05초동안 +1로 증가
                const progress = elapsed / 50;
                const speed = targetSpeed + (tempSpeed - targetSpeed) * progress;
                
                if (this.fire.material.uniforms.noiseScale) {
                    this.fire.material.uniforms.noiseScale.value.w = speed;
                }
                
                requestAnimationFrame(animate);
            } else if (elapsed < 100) {
                // 0.05초동안 원래대로 복귀
                const progress = (elapsed - 50) / 50;
                const speed = tempSpeed + (targetSpeed - tempSpeed) * progress;
                
                if (this.fire.material.uniforms.noiseScale) {
                    this.fire.material.uniforms.noiseScale.value.w = speed;
                }
                
                requestAnimationFrame(animate);
            } else {
                // 완료
                if (this.fire.material.uniforms.noiseScale) {
                    this.fire.material.uniforms.noiseScale.value.w = targetSpeed;
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    // 밝기 강화 효과
    animateBrightness(targetBrightness) {
        if (!this.fire) return;
        
        const tempBrightness = targetBrightness + 1;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            
            if (elapsed < 100) {
                // 0.1초동안 +1로 증가
                const progress = elapsed / 100;
                const brightness = targetBrightness + (tempBrightness - targetBrightness) * progress;
                
                if (this.fire.material.uniforms.toonBrightness) {
                    this.fire.material.uniforms.toonBrightness.value = brightness;
                }
                
                requestAnimationFrame(animate);
            } else if (elapsed < 500) {
                // 0.4초동안 원래대로 복귀
                const progress = (elapsed - 100) / 400;
                const brightness = tempBrightness + (targetBrightness - tempBrightness) * progress;
                
                if (this.fire.material.uniforms.toonBrightness) {
                    this.fire.material.uniforms.toonBrightness.value = brightness;
                }
                
                requestAnimationFrame(animate);
            } else {
                // 완료
                if (this.fire.material.uniforms.toonBrightness) {
                    this.fire.material.uniforms.toonBrightness.value = targetBrightness;
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    // 불똥 입자 효과 생성 메서드
    createEmbers() {
        // origin을 logs 위쪽으로 계산
        let originY = 0;
        if (this.logs && this.logs.geometry && this.logs.scale) {
            const logHeight = (this.logs.geometry.parameters.height || 1) * this.logs.scale.y;
            originY = this.logs.position.y + logHeight * 0.5 - 0.7; // 시작 위치를 더 아래로 조정
        }
        const origin = new THREE.Vector3(0, originY, 0);
        // 이전 불똥 삭제
        if (this.embers && this.fireGroup) {
            this.embers.sprites.forEach(sprite => this.fireGroup.remove(sprite));
        }
        // fireGroup에 추가: origin, 개수, 크기, 중력 조정
        this.embers = new EmberParticleSystem(this.fireGroup, {
            origin,
            count: 15,
            size: 0.06,
            gravity: new THREE.Vector3(0, -0.2, 0)
        });
    }

    // 연기 입자 효과 생성 메서드
    createSmoke() {
        // 연기 시작 위치 계산 (장작 위)
        // smoke fade-in 초기화
        this.smokeOpacity = 0;
        this.smokeStartTime = performance.now();
        let originY = 0;
        if (this.logs && this.logs.geometry && this.logs.scale) {
            const logHeight = (this.logs.geometry.parameters.height || 1) * this.logs.scale.y;
            originY = this.logs.position.y + logHeight * 0.5 - 0.4; // 시작 위치를 더 아래로 조정
        }
        const origin = new THREE.Vector3(0, originY, 0);
        // 기존 연기 삭제
        if (this.smoke && this.fireGroup) {
            this.smoke.sprites.forEach(sprite => this.fireGroup.remove(sprite));
        }
        // 연기 시스템 생성
        this.smoke = new SmokeParticleSystem(this.fireGroup, {
            origin,
            count: 60, // 더 많은 연기를 위해 개수 증가
            size: 1.5,
            gravity: new THREE.Vector3(0, 0.1, 0),
            baseOpacity: (window.fireControls ? window.fireControls.currentValues.smokeIntensity : 0.2)
        });
    }

    // 연기 강도 설정 메서드
    setSmokeIntensity(intensity) {
        if (this.smoke) {
            this.smoke.baseOpacity = intensity;
        }
    }

    // Glow 효과 토글
    toggleGlow(enabled) {
        this.isGlowEnabled = enabled;
        console.log('Glow effect:', enabled ? 'enabled' : 'disabled');
        // 비활성화 시 이전 Glow 캔버스 초기화
        if (!enabled && this.glowCtx) {
            this.glowCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);
        }
    }
    
    // Glow 크기 설정
    setGlowScale(scale) {
        this.glowScale = scale;
        console.log('Glow scale set to', scale);
    }
    
    // Glow 밝기 설정
    setGlowAlpha(alpha) {
        this.glowAlpha = alpha;
        console.log('Glow alpha set to', alpha);
    }
    
    // Glow 범위 설정
    setGlowRange(range) {
        this.glowRange = range;
        console.log('Glow range set to', range);
    }
    
    // Glow 캔버스 그리기
    drawGlow() {
        if (!this.glowCanvas || !this.isGlowEnabled || !this.isFireLit) return;
        const ctx = this.glowCtx;
        const w = this.glowCanvas.width;
        const h = this.glowCanvas.height;
        // 이전 프레임 지우기
        ctx.clearRect(0, 0, w, h);
        // Fire world position 투영하여 glow 중심 계산
        const vec = new THREE.Vector3(0, 0, 0).project(this.camera);
        const cx = (vec.x + 1) / 2 * w;
        let cy = (-vec.y + 1) / 2 * h;
        // Glow 중심을 아래로 약간 이동 (baseRadius의 일부로 고정)
        const baseRadius = Math.min(w, h) * 0.25;
        // range 및 scale 반영
        const radius = baseRadius * this.glowScale * this.glowRange;
        // 중심 이동: baseRadius의 10%만큼 아래 이동
        const shiftY = baseRadius * 0.05;
        cy += shiftY;
        // 반경 설정 (화면 비율 및 scale에 따라)
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        // brightness 반영
        grad.addColorStop(0, `rgba(255,230,120,${0.3 * this.glowAlpha})`);
        grad.addColorStop(0.5, `rgba(255,180,60,${0.15 * this.glowAlpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // 배경 이미지 캔버스 업데이트
    updateBackgroundImageCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.bgImageCanvas.width = width;
        this.bgImageCanvas.height = height;
        
        // 캔버스 초기화
        this.bgImageCtx.clearRect(0, 0, width, height);
        
        if (this.isBgImageEnabled && this.backgroundImage && this.backgroundImage.complete) {
            // 이미지를 화면에 맞게 조정하여 그리기
            const imgAspect = this.backgroundImage.width / this.backgroundImage.height;
            const screenAspect = width / height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (imgAspect > screenAspect) {
                // 이미지가 더 넓음 - 높이에 맞춤
                drawHeight = height;
                drawWidth = height * imgAspect;
                drawX = (width - drawWidth) / 2;
                drawY = 0;
            } else {
                // 이미지가 더 높음 - 너비에 맞춤
                drawWidth = width;
                drawHeight = width / imgAspect;
                drawX = 0;
                drawY = (height - drawHeight) / 2;
            }
            
            // 패닝 오프셋을 적용하여 캔버스에 그리기
            this.bgImageCtx.drawImage(this.backgroundImage, drawX + this.panOffset.x, drawY, drawWidth, drawHeight);

            // 배경 이미지 기준 불의 기본 오프셋 계산 (패닝 전 위치 기준)
            const fireRelativeX = 0.495; // 가로 49.5%
            const fireRelativeY = 0.79;  // 세로 79%

            const fireScreenX = drawX + drawWidth * fireRelativeX;
            const fireScreenY = drawY + drawHeight * fireRelativeY;

            this.bgImageFireOffset = {
                x: fireScreenX - window.innerWidth / 2,
                y: fireScreenY - window.innerHeight / 2
            };
        } else {
            // 배경 이미지 비활성화 시, 이전 오프셋 유지 (재계산하지 않음)
        }
        
        // 배경 변경 시 위치 업데이트 트리거
        if (window.fireControls) {
            window.fireControls.updateCanvasPosition();
        }
    }

    handleMouseMove(event) {
        if (!this.backgroundImage || !this.backgroundImage.complete || !this.bgImageFireOffset) {
            return;
        }

        // 소품 이미지 레이어가 비활성화되어 있으면 호버 효과 무시
        if (!this.getImageLayerEnabled()) {
            // 호버 상태 초기화
            if (this.currentHoveredItem !== null) {
                this.currentHoveredItem = null;
                if (this.imageLayer) {
                    this.imageLayer.hoveredImage = null;
                    this.imageLayer.update();
                }
            }
            return;
        }

        // 배경 이미지의 렌더링 정보 가져오기
        const { drawX, drawY, drawWidth, drawHeight } = this.getBgImageDrawInfo();
        const { naturalWidth, naturalHeight } = this.backgroundImage;

        if (!drawWidth) return;

        // 마우스 위치
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        let hoveredItemName = null;

        // 호버 가능한 아이템 목록을 순회하며 확인
        for (const item of this.hoverableItems) {
            const targetScreenX = drawX + this.panOffset.x + item.x * drawWidth / naturalWidth;
            const targetScreenY = drawY + item.y * drawHeight / naturalHeight;

            // 마우스가 타겟 영역 안에 있는지 확인
            const isHovering = 
                Math.abs(mouseX - targetScreenX) < item.tolerance &&
                Math.abs(mouseY - targetScreenY) < item.tolerance;

            if (isHovering) {
                hoveredItemName = item.name;
                break; // 첫 번째로 발견된 아이템에만 효과 적용
            }
        }

        // 호버 상태가 변경되었을 때만 업데이트
        if (hoveredItemName !== this.currentHoveredItem) {
            this.currentHoveredItem = hoveredItemName;
            if (this.imageLayer) {
                this.imageLayer.hoveredImage = hoveredItemName;
                this.imageLayer.update(); // 소품 레이어만 다시 그리기
            }
        }
    }

    getBgImageDrawInfo() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const img = this.backgroundImage;

        if (!img || !img.complete) {
            return {};
        }

        const imgAspect = img.naturalWidth / img.naturalHeight;
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

        return { drawX, drawY, drawWidth, drawHeight };
    }

    updateAllPositions() {
        this.updateBackgroundImageCanvas();
        if (this.imageLayer) {
            this.imageLayer.update();
        }
        if (window.fireControls) {
            window.fireControls.updateCanvasPosition();
        }
    }

    onDragStart(event) {
        const target = event.target;
        if (target.closest('input, button, a, #settingsSidebar, #alarmSidebar, #timerSidebar, #weatherSidebar')) {
            return; // UI 요소 위에서는 드래그 시작 안 함
        }
        
        // 터치 이벤트인 경우 시작 시간 기록
        if (event.touches) {
            this.touchStartTime = Date.now();
        }
        
        event.preventDefault();

        const { drawWidth } = this.getBgImageDrawInfo();
        if (drawWidth <= window.innerWidth) {
            return; // 패닝할 영역이 없으면 시작 안 함
        }
        
        const T = event.touches ? event.touches[0] : event;
        this.dragStart.x = T.clientX - this.panOffset.x;
        
        // 마우스 이벤트는 즉시 드래그 모드
        if (!event.touches) {
            this.isDragging = true;
            document.body.style.cursor = 'grabbing';
        }
    }

    onDragMove(event) {
        const T = event.touches ? event.touches[0] : event;
        const currentX = T.clientX;
        
        // 터치 이벤트이고 아직 드래그가 시작되지 않은 경우
        if (event.touches && !this.isDragging) {
            const moveDistance = Math.abs(currentX - (this.dragStart.x + this.panOffset.x));
            // 10px 이상 움직였을 때만 드래그 모드 시작 (탭과 구분)
            if (moveDistance > 10) {
                this.isDragging = true;
                console.log('터치 드래그 시작');
            }
            return;
        }
        
        if (!this.isDragging) return;
        event.preventDefault();

        let newPanX = currentX - this.dragStart.x;

        // 패닝 범위 제한
        const { drawWidth } = this.getBgImageDrawInfo();
        const maxPan = Math.max(0, (drawWidth - window.innerWidth) / 2);
        newPanX = Math.max(-maxPan, Math.min(maxPan, newPanX));
        
        if (newPanX !== this.panOffset.x) {
            this.panOffset.x = newPanX;
            this.updateAllPositions();
        }
    }

    onDragEnd(event) {
        // 터치 종료 시 드래그 상태 초기화
        if (event && event.touches !== undefined) {
            // 터치 이벤트인 경우 짧은 지연 후 초기화 (클릭 처리 시간 확보)
            setTimeout(() => {
                this.isDragging = false;
                console.log('터치 드래그 종료');
            }, 50);
        } else {
            // 마우스 이벤트인 경우 즉시 초기화
            this.isDragging = false;
        }
        
        document.body.style.cursor = 'default';
    }
}

export default FireApp; 