// alarm.js
// 좌측 알람 버튼 및 사이드바 생성, 알람 설정 로직
(function() {
    // 페이지 활성화/비활성화 상태 추적 변수
    let isPageVisible = !document.hidden;
    let pendingAlarmPopup = null;
    let lastVisibleTime = Date.now(); // 마지막으로 페이지가 보였던 시간 추적
  
    // 페이지 가시성 변화 이벤트 리스너 추가
    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      
      if (document.hidden) {
        // 페이지가 숨겨질 때 시간 기록
        lastVisibleTime = now;
      } else {
        // 페이지가 다시 보일 때
        isPageVisible = true;
        const hiddenDuration = now - lastVisibleTime;
        
        // 장시간(5분 이상) 절전모드 후 돌아온 경우, 대기 중인 알람 팝업 초기화
        if (hiddenDuration > 5 * 60 * 1000 && pendingAlarmPopup) {
          pendingAlarmPopup = null;
        }
        
        // 대기 중인 알람 팝업이 있으면 표시
        if (pendingAlarmPopup) {
          document.body.appendChild(pendingAlarmPopup.containerDiv);
          // 이벤트 리스너 다시 바인딩
          setupAlarmPopupEvents(pendingAlarmPopup);
          pendingAlarmPopup = null;
        }
      }
    });
  
    // 알람 버튼 생성
    const alarmBtn = document.createElement('button');
    alarmBtn.id = 'alarmBtn';
    alarmBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
    Object.assign(alarmBtn.style, {
      position: 'fixed', top: '20px', left: '20px',
      width: '44px', height: '44px',
      padding: '0', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
      border: 'none', cursor: 'pointer', zIndex: '100',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      transition: 'transform 0.3s ease, background-color 0.3s'
    });
    alarmBtn.addEventListener('mouseover', () => {
      alarmBtn.style.backgroundColor = 'rgba(50,50,50,0.8)';
      alarmBtn.style.transform = 'scale(1.1)';
    });
    alarmBtn.addEventListener('mouseout', () => {
      alarmBtn.style.backgroundColor = 'rgba(0,0,0,0.6)';
      alarmBtn.style.transform = 'scale(1)';
    });
    document.body.appendChild(alarmBtn);
  
    // 알람 사이드바 생성
    const sidebar = document.createElement('div');
    sidebar.id = 'alarmSidebar';
    Object.assign(sidebar.style, {
      position: 'fixed', top: '0', left: '-300px',
      width: '300px', height: '100%',
      background: 'rgba(20,20,20,0.9)', padding: '20px',
      boxSizing: 'border-box',
      boxShadow: '2px 0 15px rgba(0,0,0,0.5)',
      transition: 'left 0.3s ease', zIndex: '101',
      backdropFilter: 'blur(15px)', overflowY: 'auto',
      fontFamily: "'Arial', sans-serif", color: '#fff'
    });
    sidebar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
        <h3 style="margin:0;font-size:18px;font-weight:600;">알람 설정</h3>
        <button id="closeAlarmSidebar" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
      </div>
      <div id="alarmContent" style="display:flex;flex-direction:column;gap:18px;">
        <div class="setting-group">
          <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">시간</label>
          <div style="display:flex;align-items:center;gap:5px;">
            <select id="alarmHour" style="flex:1;padding:8px;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;"></select>
            <span style="font-size:18px;">:</span>
            <select id="alarmMinute" style="flex:1;padding:8px;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;"></select>
          </div>
        </div>
        
        <div class="setting-group">
          <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">제목</label>
          <input type="text" id="alarmTitle" placeholder="알람 제목" style="width:100%;padding:8px;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;box-sizing:border-box;">
        </div>
        
        <div class="setting-group" style="display:flex;justify-content:space-between;align-items:center;">
          <label style="color:#fff;font-size:14px;font-weight:500;">반복</label>
          <input type="checkbox" id="alarmRepeat" style="width:18px;height:18px;accent-color:#ff6b00;cursor:pointer;">
        </div>
        
        <div class="setting-group" style="display:flex;justify-content:space-between;align-items:center;">
          <label style="color:#fff;font-size:14px;font-weight:500;">알림소리</label>
          <input type="checkbox" id="alarmSound" checked style="width:18px;height:18px;accent-color:#ff6b00;cursor:pointer;">
        </div>
        
        <div class="setting-group" style="display:flex;gap:10px;margin-top:10px;">
          <button id="testAlarm" style="flex:1;padding:10px;background-color:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            테스트
          </button>
          <button id="addAlarm" style="flex:2;padding:10px;background:linear-gradient(to right, #ff6b00, #ff9800);color:#fff;border:none;border-radius:4px;cursor:pointer;">
            알람 추가
          </button>
        </div>
        
        <div class="setting-group" style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <label style="color:#ff6b00;font-size:14px;font-weight:500;">정각 알림 추가</label>
            <button id="addHourlyAlarms" style="padding:6px 10px;background:linear-gradient(to right, #3f51b5, #5677fc);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">추가하기</button>
          </div>
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:16px;">24시간 동안의 정각 알림(00:00~23:00)을 추가합니다.</p>
        </div>
        
        <div class="setting-group" style="border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;">
          <label style="color:#ff6b00;margin-bottom:12px;display:block;font-size:14px;font-weight:500;">알람 목록</label>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:12px;color:rgba(255,255,255,0.6);" id="alarmCount">0개 알람</span>
          </div>
          <ul id="alarmList" style="list-style:none;padding:0;margin:0;"></ul>
        </div>
        
        <audio id="alarmAudio" src="sounds/alarm.wav" preload="auto"></audio>
      </div>
    `;
    document.body.appendChild(sidebar);
  
    // CSS 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      #alarmSidebar select::-webkit-scrollbar {
        width: 8px;
        background-color: rgba(60,60,60,0.4);
      }
      #alarmSidebar select::-webkit-scrollbar-thumb {
        background-color: rgba(200,200,200,0.4);
        border-radius: 4px;
      }
      /* 토글 스위치 스타일 제거 */
      #alarmList li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        margin-bottom: 8px;
        background-color: rgba(60,60,60,0.5);
        border-radius: 4px;
        font-size: 14px;
        overflow: hidden;
        width: 100%;
        box-sizing: border-box;
      }
      #alarmList li button {
        background: none;
        border: none;
        color: rgba(255,100,100,0.7);
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.2s;
      }
      #alarmList li button:hover {
        background-color: rgba(255,100,100,0.2);
        color: rgba(255,100,100,1);
      }
      /* 알람 정보 영역 스타일 추가 */
      .alarm-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        margin-right: 10px;
      }
      .alarm-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        display: block;
      }
      /* 알람 컨트롤 버튼 영역 */
      .alarm-controls {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
        min-width: 60px;
        justify-content: flex-end;
      }
      #resetAlarms:hover {
        background-color: rgba(255,80,80,0.3) !important;
        color: rgba(255,100,100,1) !important;
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  
    // 사이드바 토글 이벤트
    alarmBtn.addEventListener('click', () => {
      sidebar.style.left = sidebar.style.left === '0px' ? '-300px' : '0px';
    });
    document.getElementById('closeAlarmSidebar').addEventListener('click', () => {
      sidebar.style.left = '-300px';
    });
  
    // 알람 로직
    const hourSelect = document.getElementById('alarmHour');
    const minuteSelect = document.getElementById('alarmMinute');
    const titleInput = document.getElementById('alarmTitle');
    const repeatCheckbox = document.getElementById('alarmRepeat');
    const soundCheckbox = document.getElementById('alarmSound');
    const addHourlyAlarmsBtn = document.getElementById('addHourlyAlarms');
    const testBtn = document.getElementById('testAlarm');
    const addBtn = document.getElementById('addAlarm');
    const alarmList = document.getElementById('alarmList');
    const alarmAudioEl = document.getElementById('alarmAudio');
    const alarmCountEl = document.getElementById('alarmCount');
    
    let alarms = [];
    let testTimeout = null;
    const STORAGE_KEY = 'bulmeong_alarms';
  
    // 알람 시간순 정렬 함수
    function sortAlarmsByTime() {
      alarms.sort((a, b) => {
        // 24시간 기준으로 분 환산하여 비교
        const aMinutes = a.hour * 60 + a.minute;
        const bMinutes = b.hour * 60 + b.minute;
        return aMinutes - bMinutes;
      });
    }
  
    // 알람 로컬 스토리지 저장 함수
    function saveAlarms() {
      // 타이머 ID는 저장하지 않음 (복원 시 새로 설정)
      const alarmsToSave = alarms.map(alarm => ({
        id: alarm.id,
        hour: alarm.hour,
        minute: alarm.minute,
        title: alarm.title,
        repeat: alarm.repeat,
        sound: alarm.sound,
        active: alarm.active,
        isHourly: alarm.isHourly
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alarmsToSave));
      updateAlarmCount();
    }
  
    // 알람 로컬 스토리지에서 불러오기
    function loadAlarms() {
      const savedAlarms = localStorage.getItem(STORAGE_KEY);
      if (savedAlarms) {
        const parsedAlarms = JSON.parse(savedAlarms);
        // 저장된 알람들 복원하고 타이머 새로 설정
        alarms = parsedAlarms.map(alarm => {
          // sound 속성이 없는 오래된 알람 데이터 처리
          if (alarm.sound === undefined) {
            alarm.sound = true;
          }
          
          // active 속성이 없는 오래된 알람 데이터 처리
          if (alarm.active === undefined) {
            alarm.active = true;
          }
          
          // 타이머 설정 (활성화된 알람만)
          let timeoutId = null;
          let nextTriggerTime = null;
          if (alarm.active) {
            const now = new Date();
            const target = new Date();
            target.setHours(alarm.hour, alarm.minute, 0, 0);
            
            // 이미 지난 시간이면 다음 날로 설정
            if (target <= now) target.setDate(target.getDate() + 1);
            const diff = target.getTime() - now.getTime();
            
            // 동기화용 다음 트리거 시간 저장
            nextTriggerTime = target.getTime();
            timeoutId = setTimeout(createAlarmCallback(alarm), diff);
          }
          
          return {
            ...alarm,
            timeoutId,
            nextTriggerTime
          };
        });
        
        // 알람을 시간순으로 정렬
        sortAlarmsByTime();
        renderAlarms();
      }
    }
  
    // 알람 시간 표시 형식 반환
    function formatAlarmTime(hour, minute) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  
    // 정각 알림 추가 버튼 클릭 이벤트
    addHourlyAlarmsBtn.addEventListener('click', () => {
      // 기존 정각 알림이 있는지 확인
      const hourlyAlarms = alarms.filter(alarm => alarm.isHourly);
      
      // 이미 정각 알림이 있으면 추가하지 않음
      if (hourlyAlarms.length > 0) {
        alert('이미 정각 알림이 추가되어 있습니다.');
        return;
      }
      
      // 정각 알림 추가 (00:00 ~ 23:00)
      for (let hour = 0; hour < 24; hour++) {
        const now = new Date();
        const target = new Date();
        target.setHours(hour, 0, 0, 0);
        
        // 이미 지난 시간이면 다음 날로 설정
        if (target <= now) target.setDate(target.getDate() + 1);
        const diff = target.getTime() - now.getTime();
        
        // 정각 알림 객체 생성
        const newAlarm = {
          id: `hourly_${hour}`,
          hour,
          minute: 0,
          title: `정각 알림 (${formatAlarmTime(hour, 0)})`,
          repeat: true,
          sound: true,
          active: true,
          isHourly: true
        };
        
        // 동기화용 다음 트리거 시간 저장
        newAlarm.nextTriggerTime = target.getTime();
        // 타이머 설정
        newAlarm.timeoutId = setTimeout(createAlarmCallback(newAlarm), diff);
        alarms.push(newAlarm);
      }
      
      // 알람을 시간순으로 정렬
      sortAlarmsByTime();
      
      // 저장 및 렌더링
      saveAlarms();
      renderAlarms();
      
      // 알림 메시지
      alert('24시간 정각 알림이 추가되었습니다.');
    });
  
    // 알람 팝업 이벤트 설정 함수 (이벤트 위임을 위해 별도 함수로 분리)
    function setupAlarmPopupEvents(popupData) {
      const { containerDiv, alarm } = popupData;
      
      // 페이지 전체에 이벤트 리스너 추가 (이벤트 위임 방식)
      const stopAlarmBtn = containerDiv.querySelector('#stopAlarm');
      if (stopAlarmBtn) {
        // 기존 리스너 제거 (중복 방지)
        stopAlarmBtn.removeEventListener('click', popupData.clickHandler);
        
        // 새 리스너 추가 및 참조 저장
        popupData.clickHandler = () => {
          if (alarm.sound) {
            alarmAudioEl.pause();
            alarmAudioEl.currentTime = 0;
            alarmAudioEl.loop = false;
          }
          
          try {
            document.body.removeChild(containerDiv);
          } catch (e) {
            console.log('알람 컨테이너가 이미 제거됨');
          }
          
          // 반복이 아닌 알람만 목록에서 제거
          if (!alarm.repeat) {
            removeAlarm(alarm.id);
          }
          // 반복 알람은 자동 재스케줄링되었으므로 추가 처리 불필요
        };
        
        stopAlarmBtn.addEventListener('click', popupData.clickHandler);
        
        // 중요: 이벤트 위임 방식으로 버튼 클릭 대체 핸들러 추가
        // 경우에 따라 버튼 이벤트가 작동하지 않을 때를 대비
        containerDiv.addEventListener('click', (e) => {
          if (e.target === stopAlarmBtn || stopAlarmBtn.contains(e.target)) {
            popupData.clickHandler();
          }
        });
        
        // 키보드 이벤트도 추가 (Enter 또는 Space 키로 확인 가능)
        containerDiv.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            popupData.clickHandler();
          }
        });
      }
    }
  
    // 알람 콜백 생성 함수 (클로저로 알람 정보 유지)
    function createAlarmCallback(alarm) {
      return () => {
        // 알람이 비활성화 상태면 실행하지 않음
        if (!alarm.active) return;
        
        // 중복 트리거 방지: 기존 예약과 nextTriggerTime 초기화
        if (alarm.timeoutId) {
          clearTimeout(alarm.timeoutId);
          alarm.timeoutId = null;
        }
        if (!alarm.repeat) {
          alarm.nextTriggerTime = null;
        }
        
        // 반복 알람일 경우 다음 알람 예약 (사용자 확인과 무관하게)
        if (alarm.repeat) {
          const nextTarget = new Date();
          nextTarget.setHours(alarm.hour, alarm.minute, 0, 0);
          nextTarget.setDate(nextTarget.getDate() + 1);
          const diffNext = nextTarget.getTime() - Date.now();
          // 동기화용 다음 트리거 시간 저장
          alarm.nextTriggerTime = nextTarget.getTime();
          alarm.timeoutId = setTimeout(createAlarmCallback(alarm), diffNext);
          saveAlarms();
        }
        
        // 오디오 컨텍스트 초기화 확인
        if (window.audioContext && window.audioContext.state === 'suspended') {
          window.audioContext.resume();
        }
        
        // 알람 소리 재생 (소리 설정이 켜져 있을 때만)
        if (alarm.sound) {
          alarmAudioEl.currentTime = 0;
          alarmAudioEl.loop = false; // 반복 재생하지 않음
          
          // 소리가 끝나는 이벤트 핸들러 재설정
          alarmAudioEl.onended = () => {
            alarmAudioEl.pause();
            alarmAudioEl.currentTime = 0;
          };
          
          // 소리 재생 시도
          const playPromise = alarmAudioEl.play().catch(e => {
            console.log('오디오 재생 실패:', e);
            // 자동 재생 정책으로 실패했을 수 있음, 페이지가 활성화될 때 다시 시도
          });
        }
        
        // 알람 창을 표시하는 커스텀 함수 만들기
        const containerDiv = document.createElement('div');
        containerDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          backdrop-filter: blur(5px);
        `;
        
        const alarmPopup = document.createElement('div');
        alarmPopup.style.cssText = `
          background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          max-width: 400px;
          width: 80%;
          box-shadow: 0 20px 25px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.1);
          animation: fadeIn 0.3s ease-out forwards;
        `;
        
        const alarmTime = formatAlarmTime(alarm.hour, alarm.minute);
        
        // 정각 알림이면 특별한 스타일 적용
        const isHourly = alarm.isHourly === true;
        const iconColor = isHourly ? '#3f51b5' : '#ff6b00';
        
        // 알람 아이콘 형태 업데이트
        const alarmIcon = isHourly ? 
          `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>` :
          `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
        
        alarmPopup.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;">
            <div style="width:80px;height:80px;background:${iconColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(${isHourly ? '63, 81, 181' : '255, 107, 0'},0.4);animation:pulse 1.5s infinite;margin-bottom:5px;">
              ${alarmIcon}
            </div>
            
            <div style="display:flex;justify-content:center;align-items:center;margin:5px 0;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${alarm.sound ? iconColor : '#999'}" stroke-width="2">
                <path d="M11 5L6 9H2v6h4l5 4z"></path>
                ${alarm.sound 
                  ? '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>'
                  : '<path d="M22 9l-6 6"></path><path d="M16 9l6 6"></path>'
                }
              </svg>
            </div>
            
            <h1 style="margin:0;color:${iconColor};font-size:60px;font-weight:700;line-height:1;">${alarmTime}</h1>
            
            ${alarm.title ? `<p style="margin:5px 0 0 0;color:#fff;font-size:18px;font-weight:500;">${alarm.title}</p>` : ''}
            
            <button id="stopAlarm" style="width:100%;padding:14px;margin-top:20px;background:${iconColor};color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:16px;">확인</button>
          </div>
        `;
        
        containerDiv.appendChild(alarmPopup);
        
        // 팝업 데이터 객체 생성
        const popupData = {
          containerDiv,
          alarm,
          clickHandler: null, // 이벤트 핸들러 참조를 저장할 속성
          createdAt: Date.now() // 알람 생성 시간 추가
        };
        
        // 숨김 상태와 관계없이 즉시 알람 팝업을 표시
        document.body.appendChild(containerDiv);
        setupAlarmPopupEvents(popupData);
      };
    }
  
    // 알람 개수 업데이트
    function updateAlarmCount() {
      alarmCountEl.textContent = `${alarms.length}개 알람`;
    }
  
    for (let i = 0; i < 24; i++) {
      const o = document.createElement('option'); 
      o.value = i; 
      o.textContent = String(i).padStart(2,'0'); 
      hourSelect.appendChild(o);
    }
    for (let i = 0; i < 60; i++) {
      const o = document.createElement('option'); 
      o.value = i; 
      o.textContent = String(i).padStart(2,'0'); 
      minuteSelect.appendChild(o);
    }
  
    testBtn.addEventListener('click', () => {
      if (testTimeout) clearTimeout(testTimeout);
      
      // 알림소리 설정이 켜져있는 경우에만 소리 재생
      if (soundCheckbox.checked) {
        alarmAudioEl.currentTime = 0; 
        alarmAudioEl.play();
        testTimeout = setTimeout(() => { 
          alarmAudioEl.pause(); 
          alarmAudioEl.currentTime = 0; 
        }, 1000);
      }
    });
  
    addBtn.addEventListener('click', () => {
      const hour = +hourSelect.value, minute = +minuteSelect.value;
      const title = titleInput.value || '알람';
      const repeat = repeatCheckbox.checked;
      const sound = soundCheckbox.checked;
      const now = new Date(), target = new Date(); 
      target.setHours(hour, minute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      
      // 고유 ID 생성
      const alarmId = Date.now().toString();
      
      // 알람 객체 생성
      const newAlarm = {
        id: alarmId,
        hour, 
        minute, 
        title, 
        repeat,
        sound,
        active: true,
        isHourly: false
      };
      
      // 동기화용 다음 트리거 시간 저장
      newAlarm.nextTriggerTime = target.getTime();
      // 타이머 설정 및 알람 추가
      newAlarm.timeoutId = setTimeout(createAlarmCallback(newAlarm), diff);
      alarms.push(newAlarm);
      
      // 알람을 시간순으로 정렬
      sortAlarmsByTime();
      
      // 로컬 스토리지 저장 및 화면 렌더링
      saveAlarms();
      renderAlarms();
      
      // 추가 후 입력 필드 초기화
      titleInput.value = '';
    });
    
    // 알람 삭제 함수
    function removeAlarm(id) {
      const index = alarms.findIndex(a => a.id === id);
      if (index !== -1) {
        // 타이머 취소
        if (alarms[index].timeoutId) {
          clearTimeout(alarms[index].timeoutId);
        }
        
        // 배열에서 제거
        alarms.splice(index, 1);
        saveAlarms();
        renderAlarms();
      }
    }
  
    function renderAlarms() {
      alarmList.innerHTML = '';
      updateAlarmCount();
      
      if (alarms.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = '등록된 알람이 없습니다';
        emptyMsg.style.color = 'rgba(255,255,255,0.5)';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '10px 0';
        alarmList.appendChild(emptyMsg);
        return;
      }
      
      // 정각 알림 수
      const hourlyAlarmsCount = alarms.filter(alarm => alarm.isHourly).length;
      
      // 버튼 컨테이너 생성 (초기화 버튼과 정각 알림 제거 버튼을 포함)
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.justifyContent = 'space-between';
      buttonsContainer.style.gap = '10px';
      buttonsContainer.style.marginBottom = '15px';
      buttonsContainer.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
      buttonsContainer.style.paddingBottom = '10px';
      
      // 초기화 버튼 (통일된 디자인)
      const resetAllBtn = document.createElement('button');
      resetAllBtn.textContent = '모든 알람 초기화';
      resetAllBtn.style.flex = '1';
      resetAllBtn.style.padding = '6px 12px';
      resetAllBtn.style.backgroundColor = 'rgba(255,80,80,0.2)';
      resetAllBtn.style.color = 'rgba(255,80,80,0.9)';
      resetAllBtn.style.border = 'none';
      resetAllBtn.style.borderRadius = '4px';
      resetAllBtn.style.cursor = 'pointer';
      resetAllBtn.style.fontSize = '12px';
      resetAllBtn.style.whiteSpace = 'nowrap';
      
      resetAllBtn.addEventListener('click', () => {
        if (confirm('모든 알람을 초기화하시겠습니까?')) {
          // 모든 타이머 취소
          alarms.forEach(alarm => {
            if (alarm.timeoutId) {
              clearTimeout(alarm.timeoutId);
            }
          });
          
          // 알람 목록 비우기
          alarms = [];
          localStorage.removeItem(STORAGE_KEY);
          renderAlarms();
          updateAlarmCount();
        }
      });
      
      buttonsContainer.appendChild(resetAllBtn);
      
      // 정각 알림 제거 버튼 (정각 알림이 있을 경우에만 표시)
      if (hourlyAlarmsCount > 0) {
        const removeHourlyBtn = document.createElement('button');
        removeHourlyBtn.textContent = '정각 알림 제거';
        removeHourlyBtn.style.flex = '1';
        removeHourlyBtn.style.padding = '6px 12px';
        removeHourlyBtn.style.backgroundColor = 'rgba(255,80,80,0.2)';
        removeHourlyBtn.style.color = 'rgba(255,80,80,0.9)';
        removeHourlyBtn.style.border = 'none';
        removeHourlyBtn.style.borderRadius = '4px';
        removeHourlyBtn.style.cursor = 'pointer';
        removeHourlyBtn.style.fontSize = '12px';
        removeHourlyBtn.style.whiteSpace = 'nowrap';
        
        removeHourlyBtn.addEventListener('click', () => {
          if (confirm('모든 정각 알림을 제거하시겠습니까?')) {
            // 타이머 취소
            const hourlyAlarms = alarms.filter(alarm => alarm.isHourly);
            hourlyAlarms.forEach(alarm => {
              if (alarm.timeoutId) {
                clearTimeout(alarm.timeoutId);
              }
            });
            
            // 정각 알림 제거
            alarms = alarms.filter(alarm => !alarm.isHourly);
            saveAlarms();
            renderAlarms();
          }
        });
        
        buttonsContainer.appendChild(removeHourlyBtn);
      }
      
      alarmList.appendChild(buttonsContainer);
      
      alarms.forEach(alarm => {
        const li = document.createElement('li');
        
        // 정각 알림이면 특별한 스타일 적용
        if (alarm.isHourly) {
          li.style.backgroundColor = 'rgba(63, 81, 181, 0.2)';
          li.style.border = '1px solid rgba(63, 81, 181, 0.3)';
        }
        
        // 알람이 비활성화되어 있으면 투명도 낮춤
        if (!alarm.active) {
          li.style.opacity = '0.6';
        }
        
        const alarmInfo = document.createElement('div');
        
        // 알람 소리 및 활성화 상태에 따른 표시 (소리 아이콘으로 변경)
        const soundStatus = alarm.sound ? 
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>' : 
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4z"></path><line x1="22" y1="2" x2="11" y2="13"></line><line x1="22" y1="16" x2="14" y2="16"></line></svg>';
        
        const timeColor = alarm.isHourly ? '#3f51b5' : '#ff6b00';
        
        alarmInfo.innerHTML = `
          <div style="display:flex;align-items:center;gap:5px;">
            <strong style="color:${timeColor}">${formatAlarmTime(alarm.hour, alarm.minute)}</strong> 
            ${alarm.repeat ? '<span style="color:#ff9800;font-size:12px;margin-left:5px;">반복</span>' : ''}
            ${alarm.isHourly ? '<span style="color:#3f51b5;font-size:12px;margin-left:5px;">정각</span>' : ''}
          </div>
          <div class="alarm-title" title="${alarm.title}" style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">${alarm.title}</div>
        `;
        
        // 알람 정보에 클래스 추가
        alarmInfo.className = 'alarm-info';
        
        // 컨트롤 영역 (삭제 및 토글 버튼)
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'alarm-controls';
        
        // 활성화/비활성화 토글 버튼
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = alarm.active ? 
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 00-6-6 6 6 0 00-6 6c0 7-3 9-3 9h18s-3-2-3-9z"></path><path d="M13.73 21a2 2 0 01-3.46 0"></path></svg>' :
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 00-6-6 6 6 0 00-6 6c0 7-3 9-3 9h18s-3-2-3-9z"></path><path d="M13.73 21a2 2 0 01-3.46 0"></path><line x1="3" y1="3" x2="21" y2="21" stroke-width="1.5"></line></svg>';
        toggleBtn.title = alarm.active ? '비활성화' : '활성화';
        toggleBtn.style.color = alarm.active ? '#4CAF50' : '#9E9E9E';
        toggleBtn.style.background = 'none';
        toggleBtn.style.border = 'none';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.padding = '5px';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.addEventListener('click', () => toggleAlarmActive(alarm.id));
        
        // 소리 토글 버튼 추가
        const soundBtn = document.createElement('button');
        soundBtn.innerHTML = alarm.sound ? 
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>' : 
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4z"></path><path d="M22 9l-6 6"></path><path d="M16 9l6 6"></path></svg>';
        soundBtn.title = alarm.sound ? '소리 끄기' : '소리 켜기';
        soundBtn.style.color = alarm.sound ? '#4CAF50' : '#9E9E9E';
        soundBtn.style.background = 'none';
        soundBtn.style.border = 'none';
        soundBtn.style.cursor = 'pointer';
        soundBtn.style.padding = '5px';
        soundBtn.style.borderRadius = '4px';
        soundBtn.addEventListener('click', () => toggleAlarmSound(alarm.id));
        
        // 삭제 버튼
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        deleteBtn.title = '알람 삭제';
        deleteBtn.style.color = 'rgba(255,100,100,0.7)';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '5px';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.addEventListener('click', () => removeAlarm(alarm.id));
        
        // 아이콘 색상 통일 - 알람이 켜져있을 때는 활성화 색상으로, 꺼져있을 때는 회색으로
        if (alarm.active) {
          // 활성화된 알람의 경우
          const activeColor = alarm.isHourly ? '#3f51b5' : '#ff6b00'; // 정각알람은 파란색, 일반알람은 주황색
          toggleBtn.style.color = activeColor;
          if (alarm.sound) {
            soundBtn.style.color = activeColor;
          }
        } else {
          // 비활성화된 알람의 경우 모든 아이콘 회색
          toggleBtn.style.color = '#9E9E9E';
          soundBtn.style.color = '#9E9E9E';
        }
        
        controlsDiv.appendChild(toggleBtn);
        controlsDiv.appendChild(soundBtn);
        controlsDiv.appendChild(deleteBtn);
        
        li.appendChild(alarmInfo);
        li.appendChild(controlsDiv);
        alarmList.appendChild(li);
      });
    }
    
    // 페이지 로드 시 저장된 알람 불러오기
    loadAlarms();
  
    // 알람 소리 토글 함수 추가
    function toggleAlarmSound(id) {
      const alarm = alarms.find(a => a.id === id);
      if (!alarm) return;
      
      // 소리 상태 토글
      alarm.sound = !alarm.sound;
      
      // 저장 및 렌더링
      saveAlarms();
      renderAlarms();
    }
  
    // 알람 활성화/비활성화 토글 함수
    function toggleAlarmActive(id) {
      const alarm = alarms.find(a => a.id === id);
      if (!alarm) return;
      
      // 활성화 상태 토글
      alarm.active = !alarm.active;
      
      // 타이머 처리
      if (alarm.active) {
        const now = new Date();
        const target = new Date();
        target.setHours(alarm.hour, alarm.minute, 0, 0);
        
        // 이미 지난 시간이면 다음 날로 설정
        if (target <= now) target.setDate(target.getDate() + 1);
        const diff = target.getTime() - now.getTime();
        
        // 동기화용 다음 트리거 시간 저장
        alarm.nextTriggerTime = target.getTime();
        alarm.timeoutId = setTimeout(createAlarmCallback(alarm), diff);
      } else {
        // 비활성화: 기존 타이머 취소
        if (alarm.timeoutId) {
          clearTimeout(alarm.timeoutId);
          alarm.timeoutId = null;
        }
        // 동기화용 정보 초기화
        alarm.nextTriggerTime = null;
      }
      
      // 저장 및 렌더링
      saveAlarms();
      renderAlarms();
    }
  })(); 