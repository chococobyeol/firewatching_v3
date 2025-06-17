// timeweather.js - 지역별 시간과 날씨 표시 기능
(function() {
    // 전역 변수
    let isWeatherSidebarOpen = false;
    // 기본 도시 목록 (5개로 줄임)
    const defaultCities = [
      { name: "서울", timezone: "Asia/Seoul", lat: 37.5665, lon: 126.9780 },
      { name: "뉴욕", timezone: "America/New_York", lat: 40.7128, lon: -74.0060 },
      { name: "런던", timezone: "Europe/London", lat: 51.5074, lon: -0.1278 },
      { name: "도쿄", timezone: "Asia/Tokyo", lat: 35.6762, lon: 139.6503 },
      { name: "파리", timezone: "Europe/Paris", lat: 48.8566, lon: 2.3522 }
    ];
    let citiesData = [...defaultCities];
    let weatherData = {};
    let weatherCache = {}; // 날씨 캐시 데이터 저장
    let updateInterval;
    let userCurrentLocation = null;
    let isEditMode = false;
    let pendingRequests = 0; // 진행 중인 API 요청 수 추적
    const CACHE_DURATION = 30 * 60 * 1000; // 캐시 유효 시간 (30분)
    const REQUEST_DELAY = 300; // API 요청 간 지연 시간 (밀리초)
    
    // 사용자 설정 저장/불러오기
    function saveUserSettings() {
      const settings = {
        cities: citiesData,
        customLocation: userCurrentLocation
      };
      
      try {
        localStorage.setItem('weatherSettings', JSON.stringify(settings));
      } catch (e) {
        console.error('설정 저장 실패:', e);
      }
    }
    
    // 날씨 캐시 저장/불러오기
    function saveWeatherCache() {
      try {
        localStorage.setItem('weatherCache', JSON.stringify(weatherCache));
      } catch (e) {
        console.error('날씨 캐시 저장 실패:', e);
      }
    }
    
    function loadWeatherCache() {
      try {
        const cachedData = localStorage.getItem('weatherCache');
        if (cachedData) {
          weatherCache = JSON.parse(cachedData);
        }
      } catch (e) {
        console.error('날씨 캐시 불러오기 실패:', e);
        weatherCache = {};
      }
    }
    
    function loadUserSettings() {
      try {
        const settingsStr = localStorage.getItem('weatherSettings');
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          
          // 도시 목록 불러오기
          if (settings.cities && Array.isArray(settings.cities) && settings.cities.length > 0) {
            citiesData = settings.cities;
          }
          
          // 사용자 정의 위치 불러오기
          if (settings.customLocation) {
            userCurrentLocation = settings.customLocation;
          }
        }
      } catch (e) {
        console.error('설정 불러오기 실패:', e);
      }
    }
    
    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', function() {
      // 사용자 설정 불러오기
      loadUserSettings();
      
      // 날씨 캐시 불러오기
      loadWeatherCache();
      
      // UI 초기화
      initWeatherUI();
    });
    
    // 날씨/시간 UI 초기화
    function initWeatherUI() {
      // 사이드바에 날씨/시간 버튼 추가
      const weatherBtn = document.createElement('button');
      weatherBtn.id = 'weatherBtn';
      weatherBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="12"></line><line x1="12" y1="12" x2="16" y2="14"></line></svg>';
      Object.assign(weatherBtn.style, {
        position: 'fixed', 
        top: '140px', 
        left: '20px',
        width: '44px',
        height: '44px',
        padding: '0', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.6)', 
        color: '#fff',
        border: 'none', 
        cursor: 'pointer', 
        zIndex: '100',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        transition: 'transform 0.3s ease, background-color 0.3s'
      });
      
      weatherBtn.addEventListener('mouseover', () => {
        weatherBtn.style.backgroundColor = 'rgba(50,50,50,0.8)';
        weatherBtn.style.transform = 'scale(1.1)';
      });
      
      weatherBtn.addEventListener('mouseout', () => {
        weatherBtn.style.backgroundColor = 'rgba(0,0,0,0.6)';
        weatherBtn.style.transform = 'scale(1)';
      });
      
      weatherBtn.addEventListener('click', toggleWeatherSidebar);
      document.body.appendChild(weatherBtn);
      
      // 날씨/시간 사이드바 생성
      const weatherSidebar = document.createElement('div');
      weatherSidebar.id = 'weatherSidebar';
      Object.assign(weatherSidebar.style, {
        position: 'fixed', 
        top: '0', 
        left: '-300px',
        boxSizing: 'border-box', // 사이드바 너비에 패딩 포함
        width: '300px', 
        height: '100%',
        background: 'rgba(20,20,20,0.9)', 
        padding: '20px',
        boxShadow: '2px 0 15px rgba(0,0,0,0.5)',
        transition: 'left 0.3s ease', 
        zIndex: '101',
        backdropFilter: 'blur(15px)', 
        overflowY: 'hidden',
        fontFamily: "'Arial', sans-serif", 
        color: '#fff'
      });
      
      weatherSidebar.innerHTML = `
        <div class="sidebar-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
          <h3 style="color:#fff;margin:0;font-size:18px;font-weight:600;">세계 시간 / 날씨</h3>
          <button id="closeWeatherSidebar" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
        </div>
        <div class="weather-content" style="display:flex;flex-direction:column;flex:1;overflow-y:auto;padding-right:5px;">
        
        <div id="currentLocationCard" class="location-card" style="margin-bottom:20px;padding:15px;background-color:rgba(40,40,40,0.8);border-radius:8px;border-left:4px solid #ff9800;">
          <div class="location-top" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div class="location-name" style="font-size:16px;font-weight:500;">현재 위치</div>
            <div class="location-time" style="font-size:24px;font-weight:500;">--:--</div>
          </div>
          <div class="location-weather" style="display:flex;align-items:center;gap:10px;">
            <div class="weather-icon" style="font-size:20px;"><i class="fas fa-circle-notch fa-spin"></i></div>
            <div class="weather-temp" style="font-size:16px;">로딩 중...</div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:10px;">
            <button id="changeLocationBtn" style="background:rgba(60,60,60,0.8);color:#fff;cursor:pointer;font-size:14px;padding:6px 12px;border-radius:4px;display:flex;align-items:center;gap:4px;transition:all 0.2s;border:none;">
              <i class="fas fa-map-marker-alt"></i> 위치 변경
            </button>
          </div>
        </div>
        
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:8px;">
          <h4 style="color:#fff;margin:0;font-size:16px;font-weight:500;">주요 도시</h4>
          <div>
            <button id="addCityBtn" style="background:rgba(50,50,50,0.8);border:none;color:#fff;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:4px;transition:all 0.2s;">
              <i class="fas fa-plus-circle"></i>
            </button>
            <button id="editCitiesBtn" style="background:rgba(50,50,50,0.8);border:none;color:#fff;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:4px;transition:all 0.2s;">
              <i class="fas fa-edit"></i>
            </button>
            <button id="resetCitiesBtn" style="background:rgba(50,50,50,0.8);border:none;color:#fff;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:4px;transition:all 0.2s;">
              <i class="fas fa-undo"></i>
            </button>
          </div>
        </div>
        
        <div id="worldCitiesContainer">
          <!-- 세계 도시들의 시간과 날씨가 여기에 추가됩니다 -->
        </div>
        
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2);font-size:11px;color:rgba(255,255,255,0.5);text-align:center;">
          날씨 데이터 제공: <a href="https://open-meteo.com/" target="_blank" style="color:rgba(255,255,255,0.7);text-decoration:none;">Open-Meteo</a>
        </div>
        
        <!-- 위치 변경 모달 -->
        <div id="locationModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;align-items:center;justify-content:center;">
          <div style="width:90%;max-width:500px;background:rgba(30,30,30,0.95);border-radius:10px;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
              <h3 style="margin:0;font-size:18px;color:#fff;">위치 설정</h3>
              <button id="closeLocationModal" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom:20px;">
              <div style="margin-bottom:10px;color:#ddd;font-size:14px;font-weight:500;">도시 이름으로 검색:</div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <input id="citySearchInput" type="text" placeholder="예: 서울, 부산, Tokyo..." style="flex:3;min-width:150px;padding:10px;background-color:rgba(60,60,60,0.8);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:4px;">
                <button id="searchCityBtn" style="flex:1;min-width:50px;max-width:70px;padding:10px;background:linear-gradient(to right, #ff6b00, #ff9800);color:#fff;border:none;border-radius:4px;cursor:pointer;">검색</button>
              </div>
            </div>
            
            <div id="searchResults" style="max-height:200px;overflow-y:auto;margin-bottom:20px;">
              <!-- 검색 결과가 여기에 표시됩니다 -->
            </div>
            
            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button id="resetLocationBtn" style="padding:8px 15px;background-color:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;">초기화</button>
            </div>
          </div>
        </div>
        
        <!-- 도시 추가 모달 -->
        <div id="addCityModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;align-items:center;justify-content:center;">
          <div style="width:90%;max-width:500px;background:rgba(30,30,30,0.95);border-radius:10px;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
              <h3 style="margin:0;font-size:18px;color:#fff;">도시 추가</h3>
              <button id="closeAddCityModal" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom:20px;">
              <div style="margin-bottom:10px;color:#ddd;font-size:14px;font-weight:500;">도시 이름으로 검색:</div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <input id="addCityInput" type="text" placeholder="예: 파리, 베이징, New York..." style="flex:3;min-width:150px;padding:10px;background-color:rgba(60,60,60,0.8);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:4px;">
                <button id="searchForAddBtn" style="flex:1;min-width:50px;max-width:70px;padding:10px;background:linear-gradient(to right, #ff6b00, #ff9800);color:#fff;border:none;border-radius:4px;cursor:pointer;">검색</button>
              </div>
            </div>
            
            <div id="addCityResults" style="max-height:200px;overflow-y:auto;margin-bottom:20px;">
              <!-- 검색 결과가 여기에 표시됩니다 -->
            </div>
          </div>
        </div>
      </div>
      `;
      
      document.body.appendChild(weatherSidebar);
      
      // 이벤트 리스너 설정
      setupEventListeners();
      
      // 초기 데이터 로드
      loadWeatherData();
      
      // 시간 업데이트 시작
      updateAllTimes();
      setInterval(updateAllTimes, 60000); // 1분마다 시간 업데이트
    }
    
    // 이벤트 리스너 설정
    function setupEventListeners() {
      const closeBtn = document.getElementById('closeWeatherSidebar');
      const changeLocationBtn = document.getElementById('changeLocationBtn');
      const closeLocationModal = document.getElementById('closeLocationModal');
      const searchCityBtn = document.getElementById('searchCityBtn');
      const citySearchInput = document.getElementById('citySearchInput');
      const addCityBtn = document.getElementById('addCityBtn');
      const closeAddCityModal = document.getElementById('closeAddCityModal');
      const searchForAddBtn = document.getElementById('searchForAddBtn');
      const addCityInput = document.getElementById('addCityInput');
      const editCitiesBtn = document.getElementById('editCitiesBtn');
      const resetCitiesBtn = document.getElementById('resetCitiesBtn');
      const resetLocationBtn = document.getElementById('resetLocationBtn');
      
      // 사이드바 닫기
      if (closeBtn) {
        closeBtn.addEventListener('click', toggleWeatherSidebar);
      }
      
      // 위치 변경 버튼
      if (changeLocationBtn) {
        changeLocationBtn.addEventListener('click', () => {
          showLocationModal();
        });
      }
      
      // 위치 모달 닫기
      if (closeLocationModal) {
        closeLocationModal.addEventListener('click', hideLocationModal);
      }
      
      // 위치 초기화 버튼
      if (resetLocationBtn) {
        resetLocationBtn.addEventListener('click', () => {
          resetUserLocation();
          hideLocationModal();
        });
      }
      
      // 도시 검색 버튼
      if (searchCityBtn) {
        searchCityBtn.addEventListener('click', () => {
          const query = citySearchInput.value.trim();
          if (query) {
            searchCity(query, 'searchResults', setUserLocation);
          }
        });
      }
      
      // 검색창 엔터 이벤트
      if (citySearchInput) {
        citySearchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const query = citySearchInput.value.trim();
            if (query) {
              searchCity(query, 'searchResults', setUserLocation);
            }
          }
        });
      }
      
      // 도시 추가 버튼
      if (addCityBtn) {
        addCityBtn.addEventListener('click', () => {
          showAddCityModal();
        });
      }
      
      // 도시 추가 모달 닫기
      if (closeAddCityModal) {
        closeAddCityModal.addEventListener('click', hideAddCityModal);
      }
      
      // 도시 추가 검색 버튼
      if (searchForAddBtn) {
        searchForAddBtn.addEventListener('click', () => {
          const query = addCityInput.value.trim();
          if (query) {
            searchCity(query, 'addCityResults', addCity);
          }
        });
      }
      
      // 도시 추가 검색창 엔터 이벤트
      if (addCityInput) {
        addCityInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const query = addCityInput.value.trim();
            if (query) {
              searchCity(query, 'addCityResults', addCity);
            }
          }
        });
      }
      
      // 편집 모드 버튼
      if (editCitiesBtn) {
        editCitiesBtn.addEventListener('click', toggleEditMode);
      }
      
      // 도시 목록 초기화 버튼
      if (resetCitiesBtn) {
        resetCitiesBtn.addEventListener('click', resetCityList);
      }
    }
    
    // 날씨 사이드바 토글
    function toggleWeatherSidebar() {
      const sidebar = document.getElementById('weatherSidebar');
      if (!sidebar) return;
      
      isWeatherSidebarOpen = !isWeatherSidebarOpen;
      
      if (isWeatherSidebarOpen) {
        sidebar.style.left = '0';
        // 사이드바를 열 때 데이터 업데이트
        loadWeatherData();
        updateAllTimes();
        
        // 10분마다 날씨 데이터 업데이트
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(loadWeatherData, 600000);
      } else {
        sidebar.style.left = '-300px';
        // 사이드바를 닫을 때 업데이트 간격 해제
        if (updateInterval) {
          clearInterval(updateInterval);
          updateInterval = null;
        }
      }
    }
    
    // 모든 도시의 시간 업데이트
    function updateAllTimes() {
      const now = new Date();
      
      // 현재 위치(로컬) 시간 업데이트
      const localTimeElement = document.querySelector('#currentLocationCard .location-time');
      if (localTimeElement) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        localTimeElement.textContent = `${hours}:${minutes}`;
      }
      
      // 다른 모든 도시의 시간 업데이트
      citiesData.forEach(city => {
        const cityCardId = `city-${city.name}`;
        updateCityTimeLocal(cityCardId, now, city.timezone);
      });
    }
    
    // 특정 도시의 시간 업데이트 (로컬 계산 방식)
    function updateCityTimeLocal(cardId, localDate, timezone) {
      const timeElement = document.querySelector(`#${cardId} .location-time`);
      if (!timeElement) return;
      
      try {
        // 도시별 시간 계산 - 간단하고 안정적인 방식
        const date = new Date();
        
        // 시간대별 오프셋 맵 (분 단위)
        const timezoneOffsets = {
          'Asia/Seoul': 9*60,     // UTC+9
          'America/New_York': -4*60,  // UTC-4 (EDT)
          'Europe/London': 1*60,     // UTC+1 (BST)
          'Asia/Tokyo': 9*60,     // UTC+9
          'Europe/Paris': 2*60,    // UTC+2 (CEST)
          'Australia/Sydney': 10*60,   // UTC+10 (AEST)
          // 추가적인 시간대들
          'Europe/Berlin': 2*60,    // UTC+2
          'Europe/Moscow': 3*60,    // UTC+3
          'Asia/Dubai': 4*60,       // UTC+4
          'Asia/Shanghai': 8*60,    // UTC+8
          'Asia/Singapore': 8*60,   // UTC+8
          'Pacific/Auckland': 12*60, // UTC+12
          'America/Chicago': -5*60,  // UTC-5
          'America/Denver': -6*60,   // UTC-6
          'America/Los_Angeles': -7*60, // UTC-7
          'Europe/Budapest': 2*60    // UTC+2 (부다페스트 - 헝가리)
        };
        
        // 알 수 없는 시간대는 timezone 문자열에서 추측
        if (!timezoneOffsets[timezone]) {
          // Asia/Seoul 형식에서 추측
          if (timezone.startsWith('Asia/')) {
            // 아시아 대부분 지역 UTC+7~9
            timezoneOffsets[timezone] = 8*60;
          } else if (timezone.startsWith('Europe/')) {
            // 유럽 대부분 지역 UTC+1~2
            timezoneOffsets[timezone] = 2*60;
          } else if (timezone.startsWith('America/')) {
            // 아메리카 대부분 지역 UTC-4~7
            timezoneOffsets[timezone] = -5*60;
          } else if (timezone.startsWith('Australia/')) {
            // 호주 대부분 지역 UTC+8~10
            timezoneOffsets[timezone] = 10*60;
          } else if (timezone.startsWith('Pacific/')) {
            // 태평양 지역 UTC+10~12
            timezoneOffsets[timezone] = 11*60;
          } else if (timezone.startsWith('Africa/')) {
            // 아프리카 대부분 지역 UTC+0~3
            timezoneOffsets[timezone] = 2*60;
          } else {
            // 기본값: GMT/UTC
            timezoneOffsets[timezone] = 0;
          }
          
          console.log(`알 수 없는 시간대: ${timezone}, 추정 오프셋: ${timezoneOffsets[timezone]/60}시간`);
        }
        
        // 현재 로컬 시간대의 UTC 기준 오프셋 (분)
        const localOffset = -date.getTimezoneOffset();
        
        // 목표 시간대의 오프셋 (분)
        const targetOffset = timezoneOffsets[timezone] || 0;
        
        // 두 시간대 간의 차이 (분)
        const diffMinutes = targetOffset - localOffset;
        
        // 현재 시간에 시차 적용
        const targetDate = new Date(date.getTime() + diffMinutes * 60 * 1000);
        
        // 시간 형식 지정
        const hours = String(targetDate.getHours()).padStart(2, '0');
        const minutes = String(targetDate.getMinutes()).padStart(2, '0');
        
        // 시간 표시
        timeElement.textContent = `${hours}:${minutes}`;
        
      } catch (error) {
        console.error(`시간대 변환 오류 (${timezone}):`, error);
        timeElement.textContent = '--:--';
      }
    }
    
    // 모든 도시의 날씨 데이터 로드
    function loadWeatherData() {
      // 현재 위치 날씨 데이터 로드
      getUserLocation();
      
      // 세계 도시들의 카드 생성 및 날씨 데이터 로드
      const container = document.getElementById('worldCitiesContainer');
      if (!container) return;
      
      // 컨테이너 초기화
      container.innerHTML = '';
      
      // 도시별 카드 추가 - 각 도시 카드를 생성하고 순차적으로 날씨 데이터 요청
      citiesData.forEach((city, index) => {
        const cityCardId = `city-${city.name}`;
        
        // 도시 카드 생성
        const cityCard = document.createElement('div');
        cityCard.id = cityCardId;
        cityCard.className = 'location-card';
        cityCard.style.cssText = 'margin-bottom:12px;padding:12px;background-color:rgba(40,40,40,0.6);border-radius:8px;position:relative;';
        
        // 편집 모드일 때 드래그 가능하도록 설정
        if (isEditMode) {
          cityCard.draggable = true;
          cityCard.dataset.index = index;
          cityCard.dataset.cityName = city.name;
          cityCard.style.cursor = 'move';
          cityCard.style.transition = 'transform 0.2s, box-shadow 0.2s';
          
          // 드래그 시작 시 스타일 변경을 위한 클래스 추가
          cityCard.addEventListener('dragstart', handleDragStart);
          cityCard.addEventListener('dragend', handleDragEnd);
        }
        
        let cardContent = `
          <div class="location-top" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div class="location-name" style="font-size:16px;font-weight:500;">${city.name}</div>
            <div class="location-time" style="font-size:24px;font-weight:500;padding-right:${isEditMode ? '30px' : '0'};">--:--</div>
          </div>
          <div class="location-weather" style="display:flex;align-items:center;gap:10px;">
            <div class="weather-icon" style="font-size:20px;"><i class="fas fa-circle-notch fa-spin"></i></div>
            <div class="weather-temp" style="font-size:16px;">로딩 중...</div>
          </div>
        `;
        
        // 편집 모드일 때 삭제 버튼 추가
        if (isEditMode) {
          cardContent += `
            <div class="delete-btn" style="position:absolute;top:12px;right:12px;padding:5px;background:none;color:rgba(255,100,100,0.7);cursor:pointer;border:none;border-radius:4px;" data-city="${city.name}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
          `;
        }
        
        cityCard.innerHTML = cardContent;
        container.appendChild(cityCard);
        
        // 삭제 버튼 이벤트 리스너
        if (isEditMode) {
          const deleteBtn = cityCard.querySelector('.delete-btn');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
              const cityName = e.currentTarget.getAttribute('data-city');
              removeCity(cityName);
            });
          }
        }
        
        // 날씨 데이터 요청 - 지연 시간 추가하여 순차적으로 요청
        setTimeout(() => {
          fetchWeatherData(city);
        }, index * REQUEST_DELAY); // 각 도시마다 일정 간격으로 요청
      });
      
      // 편집 모드일 때 컨테이너에 드래그 이벤트 리스너 추가
      if (isEditMode) {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
      } else {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
      }
    }
    
    // 드래그 이벤트 핸들러
    let draggedItem = null;
    
    function handleDragStart(e) {
      draggedItem = this;
      setTimeout(() => this.style.opacity = '0.5', 0);
      this.style.boxShadow = '0 0 10px rgba(255,152,0,0.5)';
      
      // 드래그 데이터 설정
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.dataset.index);
    }
    
    function handleDragEnd(e) {
      this.style.opacity = '1';
      this.style.boxShadow = 'none';
      
      // 모든 카드의 스타일 초기화
      const cards = document.querySelectorAll('.location-card');
      cards.forEach(card => {
        card.style.borderTop = 'none';
        card.style.borderBottom = 'none';
      });
    }
    
    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // 드래그 오버 중인 요소 찾기
      const card = e.target.closest('.location-card');
      if (!card || card === draggedItem) return;
      
      // 드래그 방향 결정 (위/아래)
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isAbove = e.clientY < midY;
      
      // 이전 효과 제거
      const cards = document.querySelectorAll('.location-card');
      cards.forEach(c => {
        c.style.borderTop = 'none';
        c.style.borderBottom = 'none';
      });
      
      // 드랍 위치 표시
      if (isAbove) {
        card.style.borderTop = '2px solid #ff9800';
      } else {
        card.style.borderBottom = '2px solid #ff9800';
      }
    }
    
    function handleDrop(e) {
      e.preventDefault();
      
      // 드랍 대상 요소 찾기
      const card = e.target.closest('.location-card');
      if (!card || card === draggedItem) return;
      
      // 이동할 인덱스 가져오기
      const fromIndex = parseInt(draggedItem.dataset.index);
      const toIndex = parseInt(card.dataset.index);
      
      // 드래그 방향 결정 (위/아래)
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isAbove = e.clientY < midY;
      
      let newIndex = isAbove ? toIndex : toIndex + 1;
      // fromIndex가 newIndex보다 작으면 하나 빼기 (요소가 이미 제거되었기 때문)
      if (fromIndex < newIndex) {
        newIndex--;
      }
      
      // 배열에서 요소 재정렬
      const movedCity = citiesData.splice(fromIndex, 1)[0];
      citiesData.splice(newIndex, 0, movedCity);
      
      // 설정 저장
      saveUserSettings();
      
      // 목록 다시 로드
      loadWeatherData();
      
      // 시간 정보 업데이트
      setTimeout(updateAllTimes, 100);
    }
    
    // 현재 위치 정보 가져오기 (IP-API 사용)
    function getUserLocation() {
      // 사용자가 저장한 위치가 있으면 해당 위치 사용
      if (userCurrentLocation) {
        // 현재 위치 카드 이름 업데이트
        const locationName = document.querySelector('#currentLocationCard .location-name');
        if (locationName) {
          locationName.textContent = userCurrentLocation.name;
        }
        
        // 날씨 데이터 가져오기 - IP API 요청을 피하기 위해 살짝 지연
        setTimeout(() => {
          fetchWeatherData({
            name: userCurrentLocation.name,
            lat: userCurrentLocation.lat,
            lon: userCurrentLocation.lon
          }, 'currentLocationCard');
        }, 100);
        
        return;
      }
      
      // 현재 위치 카드의 로딩 상태 표시
      const locationName = document.querySelector('#currentLocationCard .location-name');
      const weatherIcon = document.querySelector('#currentLocationCard .weather-icon');
      const weatherTemp = document.querySelector('#currentLocationCard .weather-temp');
      
      if (locationName) locationName.textContent = "현재 위치";
      if (weatherIcon) weatherIcon.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      if (weatherTemp) weatherTemp.textContent = '로딩 중...';
      
      // IP 기반 위치 정보 가져오기 (fetch 사용)
      fetch('https://ipapi.co/json/')
        .then(response => {
          if (!response.ok) {
            throw new Error('IP 정보를 가져오는데 실패했습니다');
          }
          return response.json();
        })
        .then(data => {
          if (data && data.latitude && data.longitude) {
            // 위치 정보 가져오기 성공
            const userLocation = {
              lat: data.latitude,
              lon: data.longitude,
              name: data.city || '현재 위치'
            };
            
            // 위치 이름 업데이트
            if (locationName) {
              locationName.textContent = userLocation.name;
            }
            
            // 날씨 데이터 가져오기 - IP API 요청을 피하기 위해 살짝 지연
            setTimeout(() => {
              fetchWeatherData({
                name: userLocation.name,
                lat: userLocation.lat,
                lon: userLocation.lon
              }, 'currentLocationCard');
            }, 100);
          } else {
            throw new Error('IP 위치 정보에 필요한 데이터가 없습니다');
          }
        })
        .catch(error => {
          console.error('IP 위치 정보 처리 중 오류:', error);
          useDefaultLocation();
        });
    }
    
    // 기본 위치(서울) 사용
    function useDefaultLocation() {
      // 현재 위치 카드 이름 업데이트
      const locationName = document.querySelector('#currentLocationCard .location-name');
      if (locationName) {
        locationName.textContent = "서울 (기본값)";
      }
      
      // 서울 위치의 날씨 데이터 가져오기
      fetchWeatherData({
        name: "서울",
        lat: 37.5665,
        lon: 126.9780
      }, 'currentLocationCard');
    }
    
    // Open-Meteo Geocoding API로 위치 이름 가져오기
    function fetchLocationName(lat, lon) {
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1`;
      
      fetch(geocodingUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('위치 정보를 가져오는데 실패했습니다');
          }
          return response.json();
        })
        .then(data => {
          if (data.results && data.results.length > 0) {
            let locationName = data.results[0].name;
            
            // 위치가 한국이고 한글 이름이 있으면 사용
            if (data.results[0].country_code === 'KR' && data.results[0].admin1) {
              locationName = data.results[0].admin1;
            }
            
            // 현재 위치 카드 이름 업데이트
            const locationNameElem = document.querySelector('#currentLocationCard .location-name');
            if (locationNameElem) {
              locationNameElem.textContent = locationName;
            }
          }
        })
        .catch(error => {
          console.error('지오코딩 API 오류:', error);
        });
    }
    
    // Open-Meteo API로 날씨 정보 가져오기
    function fetchWeatherData(city, cardId = null) {
      const targetCardId = cardId || `city-${city.name}`;
      const cacheKey = `${city.lat}_${city.lon}`;
      
      // 캐시된 데이터 확인
      const now = Date.now();
      if (weatherCache[cacheKey] && weatherCache[cacheKey].timestamp > now - CACHE_DURATION) {
        // 캐시된 데이터가 유효하면 사용
        updateWeatherUI(city.name, weatherCache[cacheKey].data, targetCardId);
        return;
      }
      
      // 진행 중인 요청이 너무 많으면 잠시 대기 후 다시 시도
      if (pendingRequests >= 3) {
        setTimeout(() => fetchWeatherData(city, cardId), 1000);
        return;
      }
      
      pendingRequests++;
      
      // Open-Meteo API URL
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&timezone=auto`;
      
      fetch(weatherUrl)
        .then(response => {
          pendingRequests--;
          
          if (response.status === 429) {
            // 요청 제한에 걸린 경우 3초 후 재시도
            console.log(`API 요청 제한 (${city.name}), 3초 후 재시도합니다.`);
            setTimeout(() => fetchWeatherData(city, cardId), 3000);
            throw new Error('API 요청 제한 초과');
          }
          
          if (!response.ok) {
            throw new Error('날씨 데이터를 가져오는데 실패했습니다');
          }
          return response.json();
        })
        .then(data => {
          if (data.current) {
            // 날씨 데이터 저장
            weatherData[city.name] = data.current;
            
            // 캐시에 저장
            weatherCache[cacheKey] = {
              data: data.current,
              timestamp: now
            };
            saveWeatherCache();
            
            // UI 업데이트
            updateWeatherUI(city.name, data.current, targetCardId);
          }
        })
        .catch(error => {
          pendingRequests--;
          
          // API 요청 제한 오류가 아닌 경우에만 콘솔에 오류 출력
          if (error.message !== 'API 요청 제한 초과') {
            console.error(`${city.name} 날씨 API 오류:`, error);
          }
          
          // 캐시된 데이터가 있으면 오래된 데이터라도 사용
          if (weatherCache[cacheKey]) {
            console.log(`${city.name} 캐시된 날씨 데이터 사용 (오래됨)`);
            updateWeatherUI(city.name, weatherCache[cacheKey].data, targetCardId);
            
            // 오류 아이콘 변경으로 오래된 데이터임을 표시
            const weatherIcon = document.querySelector(`#${targetCardId} .weather-icon`);
            if (weatherIcon) {
              weatherIcon.innerHTML = '<i class="fas fa-history"></i>';
            }
          } else {
            // 에러 UI 표시
            const weatherIcon = document.querySelector(`#${targetCardId} .weather-icon`);
            const weatherTemp = document.querySelector(`#${targetCardId} .weather-temp`);
            
            if (weatherIcon && weatherTemp) {
              weatherIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
              weatherTemp.textContent = '날씨 정보 없음';
            }
          }
        });
    }
    
    // 날씨 UI 업데이트
    function updateWeatherUI(cityName, weatherData, cardId) {
      const weatherIcon = document.querySelector(`#${cardId} .weather-icon`);
      const weatherTemp = document.querySelector(`#${cardId} .weather-temp`);
      
      if (weatherIcon && weatherTemp) {
        // 온도 표시
        weatherTemp.textContent = `${Math.round(weatherData.temperature_2m)}°C`;
        
        // 날씨 아이콘 결정
        const iconClass = getWeatherIconClass(weatherData.weather_code);
        weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
      }
    }
    
    // WMO 날씨 코드에 따른 폰트어썸 아이콘 클래스 결정
    function getWeatherIconClass(code) {
      // WMO 날씨 코드 기준 (https://open-meteo.com/en/docs)
      if (code === 0) return 'fa-sun'; // 맑음
      if (code === 1) return 'fa-sun'; // 대체로 맑음
      if (code >= 2 && code <= 3) return 'fa-cloud-sun'; // 약간 흐림 ~ 대체로 흐림
      if (code === 45 || code === 48) return 'fa-smog'; // 안개
      if (code >= 51 && code <= 55) return 'fa-cloud-rain'; // 이슬비
      if (code >= 56 && code <= 57) return 'fa-snowflake'; // 얼어붙은 이슬비
      if (code >= 61 && code <= 65) return 'fa-cloud-showers-heavy'; // 비
      if (code >= 66 && code <= 67) return 'fa-snowflake'; // 얼어붙은 비
      if (code >= 71 && code <= 77) return 'fa-snowflake'; // 눈
      if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy'; // 소나기
      if (code >= 85 && code <= 86) return 'fa-snowflake'; // 눈 소나기
      if (code >= 95 && code <= 99) return 'fa-bolt'; // 천둥번개
      
      return 'fa-cloud'; // 기본값
    }
    
    // 도시 삭제
    function removeCity(cityName) {
      // 삭제 확인
      if (confirm(`'${cityName}' 도시를 목록에서 삭제하시겠습니까?`)) {
        // 도시 목록에서 제거
        citiesData = citiesData.filter(city => city.name !== cityName);
        
        // 설정 저장
        saveUserSettings();
        
        // 목록 다시 로드
        loadWeatherData();
        
        // 시간 정보 즉시 업데이트
        setTimeout(updateAllTimes, 100);
      }
    }
    
    // 편집 모드 토글
    function toggleEditMode() {
      isEditMode = !isEditMode;
      
      // 편집 버튼 스타일 변경
      const editBtn = document.getElementById('editCitiesBtn');
      if (editBtn) {
        if (isEditMode) {
          editBtn.style.color = '#ff9800';
          editBtn.innerHTML = '<i class="fas fa-check"></i>';
        } else {
          editBtn.style.color = 'rgba(255,255,255,0.7)';
          editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        }
      }
      
      // 도시 목록 다시 로드
      loadWeatherData();
      
      // 편집 모드 종료 시 시간 정보 즉시 업데이트
      if (!isEditMode) {
        setTimeout(updateAllTimes, 100);
      }
    }
    
    // 위치 모달 표시
    function showLocationModal() {
      const modal = document.getElementById('locationModal');
      if (modal) {
        modal.style.display = 'flex';
      }
    }
    
    // 위치 모달 숨기기
    function hideLocationModal() {
      const modal = document.getElementById('locationModal');
      if (modal) {
        modal.style.display = 'none';
      }
      // 검색 결과 초기화
      const results = document.getElementById('searchResults');
      if (results) {
        results.innerHTML = '';
      }
    }
    
    // 도시 추가 모달 표시
    function showAddCityModal() {
      const modal = document.getElementById('addCityModal');
      if (modal) {
        modal.style.display = 'flex';
      }
    }
    
    // 도시 추가 모달 숨기기
    function hideAddCityModal() {
      const modal = document.getElementById('addCityModal');
      if (modal) {
        modal.style.display = 'none';
      }
      // 검색 결과 초기화
      const results = document.getElementById('addCityResults');
      if (results) {
        results.innerHTML = '';
      }
    }
    
    // 도시 검색 함수
    function searchCity(query, resultsContainerId, callback) {
      const resultsContainer = document.getElementById(resultsContainerId);
      if (!resultsContainer) return;
      
      // 로딩 표시
      resultsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#ddd;"><i class="fas fa-circle-notch fa-spin"></i> 검색 중...</div>';
      
      // Open-Meteo Geocoding API로 도시 검색
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ko`;
      
      fetch(geocodingUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('도시 검색에 실패했습니다');
          }
          return response.json();
        })
        .then(data => {
          // 검색 결과 표시
          if (data.results && data.results.length > 0) {
            resultsContainer.innerHTML = '';
            
            data.results.forEach(result => {
              const resultItem = document.createElement('div');
              resultItem.className = 'search-result-item';
              resultItem.style.cssText = 'padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);cursor:pointer;';
              
              // 도시 이름과 국가 표시
              let displayName = result.name;
              if (result.admin1) {
                displayName += `, ${result.admin1}`;
              }
              if (result.country) {
                displayName += ` (${result.country})`;
              }
              
              resultItem.innerHTML = `
                <div style="font-size:14px;color:#fff;">${displayName}</div>
                <div style="font-size:12px;color:#aaa;">${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}</div>
              `;
              
              // 클릭 이벤트 추가
              resultItem.addEventListener('click', () => {
                callback({
                  name: result.name,
                  lat: result.latitude,
                  lon: result.longitude,
                  timezone: result.timezone || 'Auto'
                });
              });
              
              resultsContainer.appendChild(resultItem);
            });
          } else {
            resultsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#ddd;">검색 결과가 없습니다</div>';
          }
        })
        .catch(error => {
          console.error('도시 검색 오류:', error);
          resultsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#ff6b6b;">검색 중 오류가 발생했습니다</div>';
        });
    }
    
    // 사용자 위치 설정
    function setUserLocation(locationData) {
      userCurrentLocation = locationData;
      
      // 현재 위치 카드 이름 업데이트
      const locationName = document.querySelector('#currentLocationCard .location-name');
      if (locationName) {
        locationName.textContent = locationData.name;
      }
      
      // 날씨 데이터 가져오기
      fetchWeatherData({
        name: locationData.name,
        lat: locationData.lat,
        lon: locationData.lon
      }, 'currentLocationCard');
      
      // 위치 변경 모달 닫기
      hideLocationModal();
      
      // 설정 저장
      saveUserSettings();
    }
    
    // 도시 추가
    function addCity(cityData) {
      // 이미 있는 도시인지 확인
      const exists = citiesData.some(city => 
        city.name === cityData.name || 
        (Math.abs(city.lat - cityData.lat) < 0.01 && Math.abs(city.lon - cityData.lon) < 0.01)
      );
      
      if (exists) {
        alert(`'${cityData.name}'은(는) 이미 목록에 있습니다.`);
        return;
      }
      
      // 새 도시 정보 추가
      citiesData.push({
        name: cityData.name,
        timezone: cityData.timezone || getTimezoneFromCoordinates(cityData.lat, cityData.lon),
        lat: cityData.lat,
        lon: cityData.lon
      });
      
      // 설정 저장
      saveUserSettings();
      
      // 도시 목록 다시 로드
      loadWeatherData();
      
      // 시간 정보 즉시 업데이트 추가
      setTimeout(updateAllTimes, 100);
      
      // 도시 추가 모달 닫기
      hideAddCityModal();
    }
    
    // 좌표로 시간대 추정
    function getTimezoneFromCoordinates(lat, lon) {
      // 경도를 기준으로 대략적인 시간대 추정 (15도당 1시간)
      const timezone = Math.round(lon / 15);
      
      // 대륙 추정 (매우 단순화된 버전)
      let region = 'Etc/GMT';
      
      if (lon >= -20 && lon <= 40 && lat >= 35 && lat <= 70) {
        region = 'Europe';
      } else if (lon >= 100 && lon <= 150 && lat >= 20 && lat <= 50) {
        region = 'Asia';
      } else if (lon >= -130 && lon <= -50 && lat >= 25 && lat <= 50) {
        region = 'America';
      } else if (lon >= 110 && lon <= 160 && lat >= -45 && lat <= -10) {
        region = 'Australia';
      } else if (lon >= -20 && lon <= 50 && lat >= -35 && lat <= 35) {
        region = 'Africa';
      }
      
      // 대표적인 도시 기준 시간대 목록
      const timezoneMap = {
        '-12_Pacific': 'Pacific/Kwajalein',
        '-11_Pacific': 'Pacific/Samoa',
        '-10_Pacific': 'Pacific/Honolulu',
        '-9_America': 'America/Anchorage',
        '-8_America': 'America/Los_Angeles',
        '-7_America': 'America/Denver',
        '-6_America': 'America/Chicago',
        '-5_America': 'America/New_York',
        '-4_America': 'America/Halifax',
        '-3_America': 'America/Sao_Paulo',
        '-2_Atlantic': 'Atlantic/South_Georgia',
        '-1_Atlantic': 'Atlantic/Azores',
        '0_Europe': 'Europe/London',
        '1_Europe': 'Europe/Paris',
        '2_Europe': 'Europe/Helsinki',
        '3_Europe': 'Europe/Moscow',
        '4_Asia': 'Asia/Dubai',
        '5_Asia': 'Asia/Karachi',
        '6_Asia': 'Asia/Dhaka',
        '7_Asia': 'Asia/Bangkok',
        '8_Asia': 'Asia/Shanghai',
        '9_Asia': 'Asia/Tokyo',
        '10_Australia': 'Australia/Sydney',
        '11_Pacific': 'Pacific/Noumea',
        '12_Pacific': 'Pacific/Auckland'
      };
      
      // 시간대 문자열 생성
      const key = `${timezone}_${region}`;
      return timezoneMap[key] || `Etc/GMT${timezone >= 0 ? '-' : '+'}${Math.abs(timezone)}`;
    }
    
    // 사용자 위치 초기화 (IP 기반 위치로 재설정)
    function resetUserLocation() {
      // 사용자 정의 위치 초기화
      userCurrentLocation = null;
      
      // 설정 저장
      saveUserSettings();
      
      // 위치 정보 다시 로드
      getUserLocation();
    }
    
    // 도시 목록 초기화
    function resetCityList() {
      if (confirm('도시 목록을 기본값으로 초기화하시겠습니까?')) {
        // 도시 목록을 기본값으로 초기화
        citiesData = [...defaultCities];
        
        // 설정 저장
        saveUserSettings();
        
        // 도시 목록 다시 로드
        loadWeatherData();
        
        // 시간 즉시 업데이트 추가
        setTimeout(updateAllTimes, 100);
        
        // 편집 모드가 활성화되어 있으면 비활성화
        if (isEditMode) {
          toggleEditMode();
        }
      }
    }
  })(); 