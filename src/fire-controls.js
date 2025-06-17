/**
 * Fire Controls - 불 효과 파라미터 조정을 위한 모던 사이드바 컨트롤 패널
 */

class FireControls {
    constructor() {
        this.fire = null;
        this.rotationSpeed = 0;
        
        // 기본값
        this.defaultValues = {
            scale: 0.9,
            positionX: 0,
            positionY: -160,
            nightSky: true,
            backgroundImage: true,
            magnitude: 1.6,
            lacunarity: 2.0,
            gain: 0.5,
            baseWidth: 0.1,
            noiseScaleX: 1,
            noiseScaleY: 2,
            noiseScaleZ: 1,
            colorR: 255,
            colorG: 142,
            colorB: 211,
            fireIntensity: 1.0,
            fireScale: 1.1,
            animationSpeed: 1.0,
            toonSteps: 2.0,
            toonBrightness: 0.9,
            opacity: 0.7,
            soundVolume: 0.5,
            soundEnabled: true,
            embersEnabled: true,
            smokeEnabled: true,
            smokeIntensity: 0.2,
            glowEnabled: true,
            glowRange: 1.3,
            glowAlpha: 0.2,
            imageLayer: true
        };
        
        // 현재 설정값
        this.currentValues = { ...this.defaultValues };
        
        this.init();
    }

    init() {
        // 로컬스토리지 지원 여부 확인
        if (typeof(Storage) === "undefined") {
            console.warn('⚠️ 이 브라우저는 로컬스토리지를 지원하지 않습니다.');
        } else {
            console.log('✅ 로컬스토리지 지원됨');
            // 로컬스토리지 접근 테스트
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                console.log('✅ 로컬스토리지 접근 가능');
            } catch (e) {
                console.warn('⚠️ 로컬스토리지 접근 불가:', e);
            }
        }
        
        this.loadSettings();
        this.createModernUI();
        this.setupEventListeners();
    }

    // 로컬스토리지에서 설정 불러오기
    loadSettings() {
        console.log('🔄 설정 불러오기...');
        try {
            const saved = localStorage.getItem('fireSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.currentValues = { ...this.defaultValues, ...settings };
                console.log('✅ 저장된 설정 복원 완료');
            } else {
                console.log('ℹ️ 저장된 설정이 없음, 기본값 사용');
            }
        } catch (e) {
            console.log('❌ 설정 불러오기 실패:', e);
        }
    }

    // 로컬스토리지에 설정 저장
    saveSettings() {
        try {
            const settingsJson = JSON.stringify(this.currentValues);
            localStorage.setItem('fireSettings', settingsJson);
            console.log('💾 설정 저장 완료');
        } catch (e) {
            console.log('❌ 설정 저장 실패:', e);
        }
    }

    createModernUI() {
        // 기존 UI 제거
        const oldControls = document.getElementById('controls');
        const oldToggle = document.getElementById('toggle-controls');
        if (oldControls) oldControls.remove();
        if (oldToggle) oldToggle.remove();

        // 모던 설정 버튼 생성
        this.createSettingsButton();
        
        // 모던 사이드바 생성
        this.createSidebar();
        
        // 모든 슬라이더를 container로 감싸기
        setTimeout(() => this.wrapSlidersWithContainers(), 100);
        
        // UI 값 동기화 (사이드바 생성 후)
        setTimeout(() => {
            this.updateAllDisplayValues();
            console.log('🔄 UI 값 동기화 완료');
        }, 150);
    }

    createSettingsButton() {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'settingsBtn';
        settingsBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
        
        Object.assign(settingsBtn.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '44px',
            height: '44px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            zIndex: '100',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.3s ease, background-color 0.3s'
        });
        
        // 호버 효과
        settingsBtn.addEventListener('mouseover', () => {
            settingsBtn.style.backgroundColor = 'rgba(50, 50, 50, 0.8)';
            settingsBtn.style.transform = 'scale(1.1)';
        });
        settingsBtn.addEventListener('mouseout', () => {
            settingsBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            settingsBtn.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(settingsBtn);
    }

    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'settingsSidebar';
        
        Object.assign(sidebar.style, {
            position: 'fixed',
            top: '0',
            right: '-350px',
            width: '300px',
            height: '100%',
            background: 'rgba(20, 20, 20, 0.9)',
            padding: '20px',
            boxShadow: '-2px 0 15px rgba(0, 0, 0, 0.5)',
            transition: 'right 0.3s ease',
            zIndex: '101',
            backdropFilter: 'blur(15px)',
            fontFamily: "'Arial', sans-serif",
            overflowY: 'auto',
            visibility: 'visible',
            display: 'block'
        });

        // 사이드바 내용
        sidebar.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
                <h3 style="color:#fff;margin:0;font-size:18px;font-weight:600;">불멍 설정</h3>
                <button id="closeSettings" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
            </div>
            
            <div style="max-height:calc(100vh - 160px);overflow-y:auto;padding-right:5px;">
                <div style="display:flex;flex-direction:column;gap:20px;">
                    
                    <!-- 기본 설정 -->
                    <div class="setting-section">
                        <h4 style="color:#fff;margin:0 0 16px 0;font-size:16px;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:6px;">기본 설정</h4>
                        
                        <!-- 크기 -->
                        <div class="setting-item">
                            <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">크기 (Scale)</label>
                            <div class="slider-container">
                                <input id="scale" type="range" min="0.5" max="5" step="0.05" value="${this.currentValues.scale}" class="modern-slider">
                                <span id="scale-value" class="value-display">${this.currentValues.scale}</span>
                            </div>
                        </div>
                        
                        <!-- 애니메이션 속도 -->
                        <div class="setting-item">
                            <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">애니메이션 속도</label>
                            <div class="slider-container">
                                <input id="animationSpeed" type="range" min="0.1" max="3" step="0.1" value="${this.currentValues.animationSpeed}" class="modern-slider">
                                <span id="animationSpeed-value" class="value-display">${this.currentValues.animationSpeed}</span>
                            </div>
                        </div>
                        
                        <!-- X 위치 -->
                        <div class="setting-item">
                            <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">X 위치</label>
                            <div class="slider-container">
                                <input id="positionX" type="range" min="-800" max="800" step="5" value="${this.currentValues.positionX}" class="modern-slider">
                                <span id="positionX-value" class="value-display">${this.currentValues.positionX}</span>
                            </div>
                        </div>
                        
                        <!-- Y 위치 -->
                        <div class="setting-item">
                            <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">Y 위치</label>
                            <div class="slider-container">
                                <input id="positionY" type="range" min="-300" max="300" step="5" value="${this.currentValues.positionY + 300}" class="modern-slider">
                                <span id="positionY-value" class="value-display">${this.currentValues.positionY + 300}</span>
                            </div>
                        </div>
                        
                        <!-- 소리 볼륨 (특별한 처리) -->
                        <div class="setting-item">
                            <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">소리 볼륨</label>
                            <div class="slider-container">
                                <input id="soundVolume" type="range" min="0" max="1" step="0.05" value="${this.currentValues.soundVolume}" class="modern-slider">
                                <span id="soundVolume-value" class="value-display mute-toggle" style="cursor:pointer;user-select:none;" title="클릭하여 음소거 토글">${this.currentValues.soundVolume.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <!-- 환경 설정 -->
                        <div style="margin:16px 0;padding:12px 0;border-top:1px solid rgba(255,255,255,0.1);">
                            <div class="setting-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                <label style="color:#fff;font-size:13px;">밤하늘</label>
                                <label class="toggle-switch">
                                    <input id="nightSky" type="checkbox" ${this.currentValues.nightSky ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="setting-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                <label style="color:#fff;font-size:13px;">배경 이미지</label>
                                <label class="toggle-switch">
                                    <input id="backgroundImage" type="checkbox" ${this.currentValues.backgroundImage ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                <label style="color:#fff;font-size:13px;">소품 이미지</label>
                                <label class="toggle-switch">
                                    <input id="imageLayer" type="checkbox" ${this.currentValues.imageLayer ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- 효과 설정 -->
                        <div style="margin:16px 0;padding:12px 0;border-top:1px solid rgba(255,255,255,0.1);">
                            <div class="setting-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                <label style="color:#fff;font-size:13px;">불똥</label>
                                <label class="toggle-switch">
                                    <input id="embersEnabled" type="checkbox" ${this.currentValues.embersEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="setting-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                <label style="color:#fff;font-size:13px;">연기</label>
                                <label class="toggle-switch">
                                    <input id="smokeEnabled" type="checkbox" ${this.currentValues.smokeEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="setting-item" style="display:flex;justify-content:space-between;align-items:center;">
                                <label style="color:#fff;font-size:13px;">빛무리</label>
                                <label class="toggle-switch">
                                    <input id="glowEnabled" type="checkbox" ${this.currentValues.glowEnabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- 고급 설정 -->
                    <div class="advanced-settings">
                        <div class="accordion-header" id="advancedToggle" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2);margin-bottom:12px;">
                            <h4 style="color:#fff;margin:0;font-size:16px;font-weight:500;">고급 설정</h4>
                            <span id="advancedArrow" style="color:#fff;font-size:16px;display:inline-block;width:1em;text-align:center;font-family:monospace;line-height:1;">+</span>
                        </div>
                        
                        <div id="advancedContent" style="display:none;gap:20px;flex-direction:column;">
                            
                            <!-- 불꽃 세부 조정 -->
                            <div class="setting-subsection">
                                <h5 style="color:#ff6600;margin:0 0 12px 0;font-size:14px;font-weight:500;">불꽃 세부 조정</h5>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">불꽃 크기</label>
                                    <div class="slider-container">
                                        <input id="fireScale" type="range" min="0.8" max="1.1" step="0.005" value="${this.currentValues.fireScale}" class="modern-slider">
                                        <span id="fireScale-value" class="value-display">${this.currentValues.fireScale}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">불꽃 강도</label>
                                    <div class="slider-container">
                                        <input id="magnitude" type="range" min="0.1" max="3" step="0.1" value="${this.currentValues.magnitude}" class="modern-slider">
                                        <span id="magnitude-value" class="value-display">${this.currentValues.magnitude}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">Lacunarity</label>
                                    <div class="slider-container">
                                        <input id="lacunarity" type="range" min="1" max="4" step="0.1" value="${this.currentValues.lacunarity}" class="modern-slider">
                                        <span id="lacunarity-value" class="value-display">${this.currentValues.lacunarity}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">Gain</label>
                                    <div class="slider-container">
                                        <input id="gain" type="range" min="0.1" max="1" step="0.05" value="${this.currentValues.gain}" class="modern-slider">
                                        <span id="gain-value" class="value-display">${this.currentValues.gain}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">아래쪽 너비</label>
                                    <div class="slider-container">
                                        <input id="baseWidth" type="range" min="0.1" max="1" step="0.05" value="${this.currentValues.baseWidth}" class="modern-slider">
                                        <span id="baseWidth-value" class="value-display">${this.currentValues.baseWidth}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 노이즈 스케일 -->
                            <div class="setting-subsection">
                                <h5 style="color:#ff6600;margin:0 0 12px 0;font-size:14px;font-weight:500;">노이즈 스케일</h5>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">X 스케일</label>
                                    <div class="slider-container">
                                        <input id="noiseScaleX" type="range" min="0.1" max="3" step="0.1" value="${this.currentValues.noiseScaleX}" class="modern-slider">
                                        <span id="noiseScaleX-value" class="value-display">${this.currentValues.noiseScaleX}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">Y 스케일</label>
                                    <div class="slider-container">
                                        <input id="noiseScaleY" type="range" min="0.1" max="5" step="0.1" value="${this.currentValues.noiseScaleY}" class="modern-slider">
                                        <span id="noiseScaleY-value" class="value-display">${this.currentValues.noiseScaleY}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">Z 스케일</label>
                                    <div class="slider-container">
                                        <input id="noiseScaleZ" type="range" min="0.1" max="3" step="0.1" value="${this.currentValues.noiseScaleZ}" class="modern-slider">
                                        <span id="noiseScaleZ-value" class="value-display">${this.currentValues.noiseScaleZ}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 색상 조정 -->
                            <div class="setting-subsection">
                                <h5 style="color:#ff6600;margin:0 0 12px 0;font-size:14px;font-weight:500;">색상 조정</h5>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">빨강 (Red)</label>
                                    <div class="slider-container">
                                        <input id="colorR" type="range" min="0" max="255" step="1" value="${this.currentValues.colorR}" class="modern-slider">
                                        <span id="colorR-value" class="value-display">${this.currentValues.colorR}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">초록 (Green)</label>
                                    <div class="slider-container">
                                        <input id="colorG" type="range" min="0" max="255" step="1" value="${this.currentValues.colorG}" class="modern-slider">
                                        <span id="colorG-value" class="value-display">${this.currentValues.colorG}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">파랑 (Blue)</label>
                                    <div class="slider-container">
                                        <input id="colorB" type="range" min="0" max="255" step="1" value="${this.currentValues.colorB}" class="modern-slider">
                                        <span id="colorB-value" class="value-display">${this.currentValues.colorB}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 카툰 스타일 -->
                            <div class="setting-subsection">
                                <h5 style="color:#ff6600;margin:0 0 12px 0;font-size:14px;font-weight:500;">카툰 스타일</h5>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">색상 단계 수</label>
                                    <div class="slider-container">
                                        <input id="toonSteps" type="range" min="2" max="8" step="1" value="${this.currentValues.toonSteps}" class="modern-slider">
                                        <span id="toonSteps-value" class="value-display">${this.currentValues.toonSteps}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">밝기 강화</label>
                                    <div class="slider-container">
                                        <input id="toonBrightness" type="range" min="0.5" max="2.0" step="0.1" value="${this.currentValues.toonBrightness}" class="modern-slider">
                                        <span id="toonBrightness-value" class="value-display">${this.currentValues.toonBrightness}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">투명도</label>
                                    <div class="slider-container">
                                        <input id="opacity" type="range" min="0.0" max="1.0" step="0.05" value="${this.currentValues.opacity}" class="modern-slider">
                                        <span id="opacity-value" class="value-display">${this.currentValues.opacity}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 연기 강도 -->
                            <div class="setting-subsection">
                                <h5 style="color:#ff6600;margin:0 0 12px 0;font-size:14px;font-weight:500;">연기 효과</h5>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">연기 강도</label>
                                    <div class="slider-container">
                                        <input id="smokeIntensity" type="range" min="0" max="1" step="0.01" value="${this.currentValues.smokeIntensity}" class="modern-slider">
                                        <span id="smokeIntensity-value" class="value-display">${this.currentValues.smokeIntensity}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 빛무리 효과 -->
                            <div class="setting-subsection">
                                <h5 style="color:#ff6600;margin:0 0 12px 0;font-size:14px;font-weight:500;">빛무리 효과</h5>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">빛무리 범위</label>
                                    <div class="slider-container">
                                        <input id="glowRange" type="range" min="0.1" max="3" step="0.01" value="${this.currentValues.glowRange}" class="modern-slider">
                                        <span id="glowRange-value" class="value-display">${this.currentValues.glowRange}</span>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <label style="color:#fff;margin-bottom:6px;display:block;font-size:13px;">빛무리 밝기</label>
                                    <div class="slider-container">
                                        <input id="glowAlpha" type="range" min="0" max="1" step="0.01" value="${this.currentValues.glowAlpha}" class="modern-slider">
                                        <span id="glowAlpha-value" class="value-display">${this.currentValues.glowAlpha}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 설정 초기화 및 후원하기 버튼 컨테이너 -->
                    <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;display:flex;flex-direction:column;gap:10px;">
                        <button id="resetSettings" style="width:100%;box-sizing:border-box;padding:12px;background-color:rgba(255,80,80,0.2);color:rgba(255,80,80,0.9);border:none;border-radius:6px;cursor:pointer;font-weight:500;font-size:14px;transition:all 0.2s;">
                            설정 초기화
                        </button>
                        <a id="bmcButton" href="https://www.buymeacoffee.com/chococo" target="_blank" rel="noopener" style="display:block;width:100%;box-sizing:border-box;padding:12px;background-color:#333;color:#ffffff;border:none;border-radius:6px;cursor:pointer;font-weight:400;font-size:14px;text-decoration:none;transition:all 0.2s;text-align:center;">☕ 후원하기 (Buy me a coffee)</a>
                    </div>
                </div>
            </div>
            
            <!-- 문의/버그 제보 및 개인정보처리방침 링크 -->
            <div style="margin-top:20px;text-align:center;">
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSf131mGyiZ52mHARoaSBV_9UqBsT3KHThLQhV5FT_3hW87zYA/viewform?usp=header" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.7);font-size:12px;text-decoration:none;">문의/버그 제보</a>
            </div>
            <div style="margin-top:8px;text-align:center;">
                <a href="privacy.html" target="_blank" rel="noopener" style="color:rgba(255,255,255,0.7);font-size:12px;text-decoration:none;">개인정보처리방침</a>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        
        // 디버깅: 사이드바 상태 확인
        console.log('사이드바 생성됨:', {
            id: sidebar.id,
            right: sidebar.style.right,
            width: sidebar.style.width,
            position: sidebar.style.position
        });
    }

    setupEventListeners() {
        // 설정 버튼 클릭
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // 닫기 버튼 클릭
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeSidebar();
        });

        // 고급 설정 아코디언 토글
        document.getElementById('advancedToggle').addEventListener('click', () => {
            const content = document.getElementById('advancedContent');
            const arrow = document.getElementById('advancedArrow');
            
            if (content.style.display === 'none') {
                content.style.display = 'flex';
                arrow.textContent = '-';
            } else {
                content.style.display = 'none';
                arrow.textContent = '+';
            }
        });

        // 윈도우 리사이즈 이벤트 - 반응형 사이드바 크기 조정
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 모든 슬라이더와 토글에 이벤트 리스너 추가
        this.setupControls();

        // 음소거 토글 기능 (볼륨 값 표시 클릭)
        const soundVolumeValue = document.getElementById('soundVolume-value');
        const soundVolumeSlider = document.getElementById('soundVolume');
        if (soundVolumeValue) {
            soundVolumeValue.addEventListener('click', () => {
                if (window.fireApp && window.fireApp.toggleMute) {
                    window.fireApp.toggleMute();
                    
                    // 시각적 피드백 추가 - 크기 변화 없이 스타일만 변경
                    const currentVolume = this.currentValues.soundVolume;
                    const isMuted = window.fireApp.isMuted || false;
                    
                    if (isMuted) {
                        soundVolumeValue.textContent = 'OFF';
                        soundVolumeValue.style.color = '#ff6666';
                        soundVolumeValue.style.backgroundColor = 'rgba(255, 102, 102, 0.2)';
                        soundVolumeValue.style.textDecoration = 'none';
                        // 슬라이더도 음소거 상태로 표시
                        if (soundVolumeSlider) {
                            soundVolumeSlider.style.opacity = '0.5';
                            soundVolumeSlider.style.filter = 'grayscale(1)';
                        }
                    } else {
                        soundVolumeValue.textContent = currentVolume.toFixed(2);
                        soundVolumeValue.style.color = '#ff6600';
                        soundVolumeValue.style.backgroundColor = 'rgba(255, 102, 0, 0.2)';
                        soundVolumeValue.style.textDecoration = 'none';
                        // 슬라이더를 정상 상태로 복원
                        if (soundVolumeSlider) {
                            soundVolumeSlider.style.opacity = '1';
                            soundVolumeSlider.style.filter = 'none';
                        }
                    }
                }
            });
        }

        // 리셋 및 후원하기 버튼 이벤트 추가
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('모든 설정을 초기화하시겠습니까?')) {
                    this.resetToDefaults();
                }
            });
            resetBtn.addEventListener('mouseover', () => {
                resetBtn.style.backgroundColor = 'rgba(255,80,80,0.3)';
                resetBtn.style.color = 'rgba(255,100,100,1)';
            });
            resetBtn.addEventListener('mouseout', () => {
                resetBtn.style.backgroundColor = 'rgba(255,80,80,0.2)';
                resetBtn.style.color = 'rgba(255,80,80,0.9)';
            });
        }
        const bmcBtn = document.getElementById('bmcButton');
        if (bmcBtn) {
            bmcBtn.addEventListener('mouseover', () => {
                bmcBtn.style.backgroundColor = '#444';
            });
            bmcBtn.addEventListener('mouseout', () => {
                bmcBtn.style.backgroundColor = '#333';
            });
        }
    }

    setupControls() {
        if (!this.fire) return;

        // 기본 설정 컨트롤
        this.setupSlider('scale', (value) => {
            // 카메라 FOV 조절로 확대/축소 효과 (브라우저 줌과 같은 효과)
            if (window.fireApp && window.fireApp.camera) {
                const baseFOV = 75; // 기본 FOV
                const newFOV = baseFOV / value; // scale이 클수록 FOV 작아짐 (확대)
                window.fireApp.camera.fov = newFOV;
                window.fireApp.camera.updateProjectionMatrix();
            }
            this.currentValues.scale = value;
            this.saveSettings();
        });

        this.setupSlider('animationSpeed', (value) => {
            // 애니메이션 속도로 불꽃의 움직임을 조절
            this.fire.material.uniforms.noiseScale.value.w = value;
            this.currentValues.animationSpeed = value;
            this.saveSettings();
        });

        // 위치 조정 컨트롤 (CSS transform으로 캔버스 전체 이동)
        this.setupSlider('positionX', (value) => {
            this.currentValues.positionX = value;
            this.updateCanvasPosition(value, this.currentValues.positionY);
            this.saveSettings();
        });

        this.setupSlider('positionY', (value) => {
            // slider 값(value)을 실제 positionY로 변환 (value - 300)
            const actualY = value - 300;
            this.currentValues.positionY = actualY;
            this.updateCanvasPosition(this.currentValues.positionX, actualY);
            this.saveSettings();
        });

        // 밤하늘 토글 컨트롤
        this.setupToggle('nightSky', (enabled) => {
            if (window.fireApp && window.fireApp.toggleNightSky) {
                window.fireApp.toggleNightSky(enabled);
            }
            this.currentValues.nightSky = enabled;
            this.saveSettings();
        });

        // 배경 이미지 토글 컨트롤
        this.setupToggle('backgroundImage', (enabled) => {
            if (window.fireApp && window.fireApp.toggleBackgroundImage) {
                window.fireApp.toggleBackgroundImage(enabled);
            }
            this.currentValues.backgroundImage = enabled;
            this.saveSettings();
        });

        // 소품 이미지 토글 컨트롤
        this.setupToggle('imageLayer', (enabled) => {
            if (window.fireApp && window.fireApp.toggleImageLayer) {
                window.fireApp.toggleImageLayer(enabled);
            }
            this.currentValues.imageLayer = enabled;
            this.saveSettings();
        });

        // 불 모양 조정 컨트롤
        this.setupSlider('fireScale', (value) => {
            if (this.fire) {
                this.fire.scale.set(value, value, value);
            }
            this.currentValues.fireScale = value;
            // Glow 크기도 모닥불 크기에 맞추어 동기화
            if (window.fireApp && window.fireApp.setGlowScale) {
                window.fireApp.setGlowScale(value);
            }
            this.saveSettings();
        });

        this.setupSlider('magnitude', (value) => {
            this.fire.material.uniforms.magnitude.value = value;
            this.currentValues.magnitude = value;
            this.saveSettings();
        });

        this.setupSlider('lacunarity', (value) => {
            this.fire.material.uniforms.lacunarity.value = value;
            this.currentValues.lacunarity = value;
            this.saveSettings();
        });

        this.setupSlider('gain', (value) => {
            this.fire.material.uniforms.gain.value = value;
            this.currentValues.gain = value;
            this.saveSettings();
        });

        this.setupSlider('baseWidth', (value) => {
            this.fire.material.uniforms.baseWidth.value = value;
            this.currentValues.baseWidth = value;
            this.saveSettings();
        });

        // 노이즈 스케일 컨트롤
        this.setupSlider('noiseScaleX', (value) => {
            this.fire.material.uniforms.noiseScale.value.x = value;
            this.currentValues.noiseScaleX = value;
            this.saveSettings();
        });

        this.setupSlider('noiseScaleY', (value) => {
            this.fire.material.uniforms.noiseScale.value.y = value;
            this.currentValues.noiseScaleY = value;
            this.saveSettings();
        });

        this.setupSlider('noiseScaleZ', (value) => {
            this.fire.material.uniforms.noiseScale.value.z = value;
            this.currentValues.noiseScaleZ = value;
            this.saveSettings();
        });

        // 색상 컨트롤
        const updateColor = () => {
            const r = this.currentValues.colorR / 255;
            const g = this.currentValues.colorG / 255;
            const b = this.currentValues.colorB / 255;
            this.fire.material.uniforms.color.value.setRGB(r, g, b);
            this.saveSettings();
        };

        this.setupSlider('colorR', (value) => {
            this.currentValues.colorR = value;
            updateColor();
        });

        this.setupSlider('colorG', (value) => {
            this.currentValues.colorG = value;
            updateColor();
        });

        this.setupSlider('colorB', (value) => {
            this.currentValues.colorB = value;
            updateColor();
        });

        // 카메라 FOV 적용
        if (window.fireApp && window.fireApp.camera) {
            const baseFOV = 75;
            const newFOV = baseFOV / this.currentValues.scale;
            window.fireApp.camera.fov = newFOV;
            window.fireApp.camera.updateProjectionMatrix();
        }

        // 카툰 스타일 컨트롤
        this.setupSlider('toonSteps', (value) => {
            console.log('toonSteps changed to:', value);
            if (this.fire && this.fire.material && this.fire.material.uniforms.toonSteps) {
                this.fire.material.uniforms.toonSteps.value = value;
                console.log('toonSteps uniform updated:', this.fire.material.uniforms.toonSteps.value);
            } else {
                console.warn('Fire object or toonSteps uniform not found');
            }
            this.currentValues.toonSteps = value;
            this.saveSettings();
        });

        this.setupSlider('toonBrightness', (value) => {
            console.log('toonBrightness changed to:', value);
            if (this.fire && this.fire.material && this.fire.material.uniforms.toonBrightness) {
                this.fire.material.uniforms.toonBrightness.value = value;
                console.log('toonBrightness uniform updated:', this.fire.material.uniforms.toonBrightness.value);
            } else {
                console.warn('Fire object or toonBrightness uniform not found');
            }
            this.currentValues.toonBrightness = value;
            this.saveSettings();
        });

        this.setupSlider('opacity', (value) => {
            console.log('opacity changed to:', value);
            if (this.fire && this.fire.material && this.fire.material.uniforms.opacity) {
                this.fire.material.uniforms.opacity.value = value;
                console.log('opacity uniform updated:', this.fire.material.uniforms.opacity.value);
            } else {
                console.warn('Fire object or opacity uniform not found');
            }
            this.currentValues.opacity = value;
            this.saveSettings();
        });

        // 사운드 볼륨 컨트롤
        this.setupSlider('soundVolume', (value) => {
            // FireApp의 볼륨 설정 적용
            if (window.fireApp && window.fireApp.setVolume) {
                window.fireApp.setVolume(value);
            }
            this.currentValues.soundVolume = value;
            this.saveSettings();
        });

        // 사운드 켜기/끄기 토글
        this.setupToggle('soundEnabled', (enabled) => {
            // FireApp의 토글뮤트를 호출하여 음소거 상태 변경
            if (window.fireApp && typeof window.fireApp.toggleMute === 'function') {
                window.fireApp.toggleMute();
            }
            this.currentValues.soundEnabled = enabled;
            this.saveSettings();
        });

        this.setupToggle('embersEnabled', (enabled) => {
            if (window.fireApp) {
                if (enabled && window.fireApp.isFireLit) {
                    window.fireApp.createEmbers();
                } else if (!enabled && window.fireApp.embers) {
                    window.fireApp.embers.sprites.forEach(sprite => window.fireApp.fireGroup.remove(sprite));
                    window.fireApp.embers = null;
                }
            }
            this.currentValues.embersEnabled = enabled;
            this.saveSettings();
        });

        this.setupToggle('smokeEnabled', (enabled) => {
            if (window.fireApp) {
                if (enabled && window.fireApp.isFireLit) {
                    window.fireApp.createSmoke();
                } else if (!enabled && window.fireApp.smoke) {
                    window.fireApp.smoke.sprites.forEach(sprite => window.fireApp.fireGroup.remove(sprite));
                    window.fireApp.smoke = null;
                }
            }
            this.currentValues.smokeEnabled = enabled;
            this.saveSettings();
        });

        this.setupToggle('glowEnabled', (enabled) => {
            if (window.fireApp && window.fireApp.toggleGlow) {
                window.fireApp.toggleGlow(enabled);
            }
            this.currentValues.glowEnabled = enabled;
            this.saveSettings();
        });

        this.setupSlider('smokeIntensity', (value) => {
            if (window.fireApp && window.fireApp.setSmokeIntensity) {
                window.fireApp.setSmokeIntensity(value);
            }
            this.currentValues.smokeIntensity = value;
            this.saveSettings();
        });

        // 빛무리 범위 조절
        this.setupSlider('glowRange', (value) => {
            this.currentValues.glowRange = value;
            if (window.fireApp && window.fireApp.setGlowRange) {
                window.fireApp.setGlowRange(value);
            }
            this.saveSettings();
        });

        // 빛무리 밝기 조절
        this.setupSlider('glowAlpha', (value) => {
            this.currentValues.glowAlpha = value;
            if (window.fireApp && window.fireApp.setGlowAlpha) {
                window.fireApp.setGlowAlpha(value);
            }
            this.saveSettings();
        });
    }

    setupSlider(id, callback) {
        const slider = document.getElementById(id);
        const valueSpan = document.getElementById(id + '-value');
        
        if (!slider || !valueSpan) {
            console.warn(`Slider or value span not found for id: ${id}`);
            return;
        }
        
        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            
            // 표시값 업데이트 (정밀도 고려)
            if (slider.step && parseFloat(slider.step) >= 1) {
                // step이 1 이상이면 정수로 표시
                valueSpan.textContent = value.toFixed(0);
            } else {
                // 소수점 2자리로 표시
                valueSpan.textContent = value.toFixed(2);
            }
            
            // 콜백 실행
            callback(value);
        });
        
        // 초기값 설정 확인
        const initialValue = parseFloat(slider.value);
        if (slider.step && parseFloat(slider.step) >= 1) {
            valueSpan.textContent = initialValue.toFixed(0);
        } else {
            valueSpan.textContent = initialValue.toFixed(2);
        }
    }

    setupToggle(id, callback) {
        const toggle = document.getElementById(id);
        if (!toggle) {
            console.warn(`Toggle not found for id: ${id}`);
            return;
        }
        
        toggle.addEventListener('change', () => {
            const enabled = toggle.checked;
            callback(enabled);
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('settingsSidebar');
        if (sidebar.style.right === '0px') {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('settingsSidebar');
        sidebar.style.right = '0px';
    }

    closeSidebar() {
        const sidebar = document.getElementById('settingsSidebar');
        sidebar.style.right = '-350px';
    }

    setFire(fire) {
        this.fire = fire;
        console.log('Fire object set, available uniforms:', Object.keys(this.fire.material.uniforms));
        console.log('toonSteps uniform exists:', !!this.fire.material.uniforms.toonSteps);
        console.log('toonBrightness uniform exists:', !!this.fire.material.uniforms.toonBrightness);
        this.setupControls();
        this.applyCurrentValues();
        
        // UI 동기화 확실히 하기
        setTimeout(() => {
            this.updateAllDisplayValues();
        }, 100);
    }

    applyCurrentValues() {
        if (!this.fire) return;

        // 카메라 FOV 적용
        if (window.fireApp && window.fireApp.camera) {
            const baseFOV = 75;
            const newFOV = baseFOV / this.currentValues.scale;
            window.fireApp.camera.fov = newFOV;
            window.fireApp.camera.updateProjectionMatrix();
        }
        
        // 불꽃 크기 적용
        this.fire.scale.set(
            this.currentValues.fireScale,
            this.currentValues.fireScale,
            this.currentValues.fireScale
        );
        
        // 캔버스 위치 적용
        this.updateCanvasPosition();
        
        this.fire.material.uniforms.magnitude.value = this.currentValues.magnitude;
        this.fire.material.uniforms.lacunarity.value = this.currentValues.lacunarity;
        this.fire.material.uniforms.gain.value = this.currentValues.gain;
        this.fire.material.uniforms.baseWidth.value = this.currentValues.baseWidth;
        
        this.fire.material.uniforms.noiseScale.value.set(
            this.currentValues.noiseScaleX,
            this.currentValues.noiseScaleY,
            this.currentValues.noiseScaleZ,
            this.currentValues.animationSpeed
        );
        
        this.fire.material.uniforms.color.value.setRGB(
            this.currentValues.colorR / 255,
            this.currentValues.colorG / 255,
            this.currentValues.colorB / 255
        );

        // 카툰 스타일 설정 적용
        if (this.fire.material.uniforms.toonSteps) {
            this.fire.material.uniforms.toonSteps.value = this.currentValues.toonSteps;
            console.log('Initial toonSteps applied:', this.currentValues.toonSteps);
        }
        if (this.fire.material.uniforms.toonBrightness) {
            this.fire.material.uniforms.toonBrightness.value = this.currentValues.toonBrightness;
            console.log('Initial toonBrightness applied:', this.currentValues.toonBrightness);
        }
        if (this.fire.material.uniforms.opacity) {
            // 불이 꺼져있으면 opacity를 0으로 유지
            if (window.fireApp && !window.fireApp.isFireLit) {
                this.fire.material.uniforms.opacity.value = 0.0;
                console.log('Fire is off, opacity kept at 0');
            } else {
                this.fire.material.uniforms.opacity.value = this.currentValues.opacity;
                console.log('Initial opacity applied:', this.currentValues.opacity);
            }
        }

        // UI 업데이트
        this.updateAllDisplayValues();
        
        // 밤하늘 초기 상태 적용
        if (window.fireApp && window.fireApp.toggleNightSky) {
            window.fireApp.toggleNightSky(this.currentValues.nightSky);
        }
        
        // 배경 이미지 초기 상태 적용
        if (window.fireApp && window.fireApp.toggleBackgroundImage) {
            window.fireApp.toggleBackgroundImage(this.currentValues.backgroundImage);
        }
        
        // 소품 이미지 레이어 초기 상태 적용
        if (window.fireApp && window.fireApp.toggleImageLayer) {
            window.fireApp.toggleImageLayer(this.currentValues.imageLayer);
        }
        
        // 빛무리 초기 상태 적용
        if (window.fireApp && window.fireApp.toggleGlow) {
            window.fireApp.toggleGlow(this.currentValues.glowEnabled);
        }
        
        // Glow 크기 초기 적용 (모닥불 크기 기준)
        if (window.fireApp && window.fireApp.setGlowScale) {
            window.fireApp.setGlowScale(this.currentValues.fireScale);
        }
        
        // Glow 범위 초기 적용
        if (window.fireApp && window.fireApp.setGlowRange) {
            window.fireApp.setGlowRange(this.currentValues.glowRange);
        }
        
        // Glow 밝기 초기 적용
        if (window.fireApp && window.fireApp.setGlowAlpha) {
            window.fireApp.setGlowAlpha(this.currentValues.glowAlpha);
        }
        
        // 연기 강도 초기 적용
        if (window.fireApp && window.fireApp.setSmokeIntensity) {
            window.fireApp.setSmokeIntensity(this.currentValues.smokeIntensity);
        }
        
        // 사운드 설정 초기 상태 적용
        if (window.fireApp) {
            if (window.fireApp.setVolume) {
                window.fireApp.setVolume(this.currentValues.soundVolume);
            }
            window.fireApp.isMuted = !this.currentValues.soundEnabled;
        }
    }

    resetToDefaults() {
        this.currentValues = { ...this.defaultValues };
        
        // 슬라이더 값들을 기본값으로 리셋
        Object.keys(this.defaultValues).forEach(key => {
            const slider = document.getElementById(key);
            if (slider) {
                slider.value = this.defaultValues[key];
            }
        });

        // 실제 값들 적용
        this.applyCurrentValues();
        this.saveSettings();
    }

    updateAllDisplayValues() {
        Object.keys(this.currentValues).forEach(key => {
            const value = this.currentValues[key];
            const slider = document.getElementById(key);
            const valueSpan = document.getElementById(key + '-value');
            
            // 슬라이더 값 업데이트 및 표시값 업데이트
            if (slider && slider.type === 'range') {
                if (key === 'positionY') {
                    // slider 범위 [-300,300], slider.value = actual + 300
                    const sliderVal = value + 300;
                    slider.value = sliderVal;
                    if (valueSpan) {
                        valueSpan.textContent = sliderVal.toFixed(0);
                    }
                } else {
                    slider.value = value;
                    if (valueSpan) {
                        if (typeof value === 'number') {
                            // 정수 step인지 확인하여 표시 형식 결정
                            if (slider.step && parseFloat(slider.step) >= 1) {
                                valueSpan.textContent = value.toFixed(0);
                            } else {
                                valueSpan.textContent = value.toFixed(2);
                            }
                        } else {
                            valueSpan.textContent = value;
                        }
                    }
                }
            } else if (valueSpan) {
                // 슬라이더가 없거나 다른 타입인 경우 기본 표시
                if (typeof value === 'number') {
                    valueSpan.textContent = value.toFixed(2);
                } else {
                    valueSpan.textContent = value;
                }
            }
            
            // 토글 상태 업데이트
            const toggle = document.getElementById(key);
            if (toggle && toggle.type === 'checkbox') {
                toggle.checked = value;
            }
        });
        
        console.log('🔄 UI 값 동기화 완료');
    }

    getRotationSpeed() {
        return this.rotationSpeed;
    }

    // 컨트롤 패널 숨기기/보이기 (하위 호환성)
    toggleControls() {
        this.toggleSidebar();
    }

    updateCanvasPosition(x = null, y = null) {
        // 파라미터가 주어지면 사용하고, 아니면 currentValues 사용
        const sliderX = x !== null ? x : this.currentValues.positionX;
        const sliderY = y !== null ? y : this.currentValues.positionY;

        // 배경 이미지 기반의 기본 오프셋 가져오기
        let baseOffsetX = 0;
        let baseOffsetY = 0;
        if (window.fireApp && window.fireApp.bgImageFireOffset) {
            baseOffsetX = window.fireApp.bgImageFireOffset.x;
            baseOffsetY = window.fireApp.bgImageFireOffset.y;
        }

        // 전역 패닝 오프셋 가져오기
        let panOffsetX = 0;
        let panOffsetY = 0;
        if (window.fireApp && window.fireApp.panOffset) {
            panOffsetX = window.fireApp.panOffset.x;
            panOffsetY = window.fireApp.panOffset.y;
        }
        
        // 최종 오프셋 계산 = 기본 오프셋 + (슬라이더 변환값) + 패닝 오프셋
        const finalX = baseOffsetX + sliderX + panOffsetX;
        const finalY = baseOffsetY + sliderY + panOffsetY;

        // CSS transform으로 전체 캔버스 이동
        if (window.fireApp && window.fireApp.renderer && window.fireApp.renderer.domElement) {
            const canvas = window.fireApp.renderer.domElement;
            const transformString = `translate(${finalX}px, ${finalY}px)`;
            canvas.style.transform = transformString;
            
            // Glow 캔버스도 동일하게 이동
            if (window.fireApp.glowCanvas) {
                window.fireApp.glowCanvas.style.transform = transformString;
            }
        }
    }

    handleResize() {
        const sidebar = document.getElementById('settingsSidebar');
        if (!sidebar) return;
        
        // 사이드바가 열려있으면 닫기
        if (sidebar.style.right === '0px') {
            this.closeSidebar();
        }
    }

    wrapSlidersWithContainers() {
        const sliders = document.querySelectorAll('#settingsSidebar .modern-slider');
        sliders.forEach(slider => {
            const parent = slider.parentElement;
            const valueDisplay = parent.querySelector('.value-display');
            
            // 이미 container로 감싸져 있으면 스킵
            if (parent.classList.contains('slider-container')) return;
            
            // 새 container 생성
            const container = document.createElement('div');
            container.className = 'slider-container';
            
            // 슬라이더와 값 표시를 container에 이동
            parent.insertBefore(container, slider);
            container.appendChild(slider);
            if (valueDisplay) {
                container.appendChild(valueDisplay);
            }
        });
    }

    // 디버깅을 위한 로컬스토리지 상태 확인 메서드
    debugLocalStorage() {
        console.log('🔍 === 로컬스토리지 디버깅 ===');
        console.log('현재 설정 값:', this.currentValues);
        console.log('기본 설정 값:', this.defaultValues);
        console.log('저장된 로컬스토리지 데이터:', localStorage.getItem('fireSettings'));
        
        try {
            const saved = localStorage.getItem('fireSettings');
            if (saved) {
                console.log('파싱된 저장 데이터:', JSON.parse(saved));
            }
        } catch (e) {
            console.log('파싱 오류:', e);
        }
        
        // 테스트 저장
        console.log('테스트 저장 실행...');
        this.saveSettings();
        
        console.log('=========================');
    }

    // 강제로 설정 저장 테스트
    testSave() {
        const testSettings = { ...this.currentValues, scale: Math.random() };
        console.log('테스트 설정 저장:', testSettings);
        localStorage.setItem('fireSettings', JSON.stringify(testSettings));
        console.log('저장 후 확인:', localStorage.getItem('fireSettings'));
    }

    // 강제 UI 동기화 (디버깅용)
    forceSyncUI() {
        console.log('🔧 강제 UI 동기화 시작...');
        this.updateAllDisplayValues();
        
        // 각 슬라이더의 실제 값과 currentValues 비교
        Object.keys(this.currentValues).forEach(key => {
            const slider = document.getElementById(key);
            const valueSpan = document.getElementById(key + '-value');
            const currentValue = this.currentValues[key];
            
            if (slider && slider.type === 'range') {
                const sliderValue = parseFloat(slider.value);
                if (Math.abs(sliderValue - currentValue) > 0.001) {
                    console.warn(`⚠️ 불일치 발견: ${key} - 슬라이더: ${sliderValue}, 저장값: ${currentValue}`);
                    slider.value = currentValue; // 강제 수정
                }
            }
            
            if (valueSpan && typeof currentValue === 'number') {
                const displayValue = parseFloat(valueSpan.textContent);
                if (Math.abs(displayValue - currentValue) > 0.001) {
                    console.warn(`⚠️ 표시값 불일치: ${key} - 표시: ${displayValue}, 저장값: ${currentValue}`);
                    valueSpan.textContent = currentValue.toFixed(2); // 강제 수정
                }
            }
        });
        
        console.log('✅ 강제 UI 동기화 완료');
    }
}

export default FireControls; 