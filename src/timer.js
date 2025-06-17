// timer.js - 스톱워치와 타이머 기능
(function() {
  // 상태 변수
  let isTimerTabActive = false;
  let isStopwatchRunning = false;
  let isTimerRunning = false;
  let stopwatchInterval = null;
  let timerInterval = null;
  let stopwatchStartTime = 0;
  let stopwatchElapsedTime = 0;
  let timerEndTime = 0;
  let timerDuration = 0;
  
  // 페이지 로드 시 DOM 요소가 모두 로드된 후 초기화 (중요)
  window.addEventListener('DOMContentLoaded', function() {
    initTimerUI();
  });
  
  // 타이머 UI 초기화 함수
  function initTimerUI() {
    // 사이드바에 타이머 버튼 추가
    const timerBtn = document.createElement('button');
    timerBtn.id = 'timerBtn';
    timerBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z"></path></svg>';
    Object.assign(timerBtn.style, {
      position: 'fixed', 
      top: '80px', 
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
    
    timerBtn.addEventListener('mouseover', () => {
      timerBtn.style.backgroundColor = 'rgba(50,50,50,0.8)';
      timerBtn.style.transform = 'scale(1.1)';
    });
    
    timerBtn.addEventListener('mouseout', () => {
      timerBtn.style.backgroundColor = 'rgba(0,0,0,0.6)';
      timerBtn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(timerBtn);
  
    // 타이머/스톱워치 사이드바 생성
    const timerSidebar = document.createElement('div');
    timerSidebar.id = 'timerSidebar';
    Object.assign(timerSidebar.style, {
      position: 'fixed', 
      top: '0', 
      left: '-300px',
      width: '300px', 
      height: '100%',
      background: 'rgba(20,20,20,0.9)', 
      padding: '20px',
      boxSizing: 'border-box',
      boxShadow: '2px 0 15px rgba(0,0,0,0.5)',
      transition: 'left 0.3s ease', 
      zIndex: '101',
      backdropFilter: 'blur(15px)', 
      overflowY: 'auto',
      fontFamily: "'Arial', sans-serif", 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    });
    
    timerSidebar.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
          <h3 style="margin:0;font-size:18px;font-weight:600;">타이머 / 스톱워치</h3>
          <button id="closeTimerSidebar" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
        </div>
        
        <div class="timer-content" style="display:flex;flex-direction:column;gap:18px;flex-grow:1;height:calc(100% - 60px);">
          <!-- 탭 네비게이션 -->
          <div class="tab-navigation" style="display:flex;border-radius:4px;overflow:hidden;margin-bottom:10px;flex-shrink:0;">
            <button id="stopwatchTab" class="tab-button active" style="flex:1;padding:10px;background-color:#444;color:#fff;border:none;cursor:pointer;transition:background-color 0.3s;">
              <div style="display:flex;align-items:center;justify-content:center;gap:5px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="6" x2="12" y2="12"></line>
                  <line x1="12" y1="12" x2="16" y2="14"></line>
                  <circle cx="12" cy="2" r="1.5"></circle>
                </svg>
                스톱워치
              </div>
            </button>
            <button id="timerTab" class="tab-button" style="flex:1;padding:10px;background-color:#222;color:#ccc;border:none;cursor:pointer;transition:background-color 0.3s;">
              <div style="display:flex;align-items:center;justify-content:center;gap:5px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z"></path>
                </svg>
                타이머
              </div>
            </button>
          </div>
          
          <!-- 스톱워치 컨텐츠 -->
          <div id="stopwatchContent" class="tab-content" style="height:100%;display:flex;flex-direction:column;">
            <div class="time-display" style="text-align:center;margin:20px 0;font-size:42px;font-family:'Courier New',monospace;font-weight:300;">
              <span id="stopwatchDisplay">00:00.00</span>
            </div>
            
            <div class="controls" style="display:flex;gap:10px;margin-top:10px;margin-bottom:20px;">
              <button id="stopwatchStartStop" style="flex:1;padding:12px;background:linear-gradient(to right, #ff6b00, #ff9800);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
                시작
              </button>
              <button id="stopwatchReset" style="flex:1;padding:12px;background-color:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
                리셋
              </button>
            </div>
            
            <div id="lapContainer" style="margin-top:0;max-height:350px;overflow-y:auto;flex-grow:1;">
              <ul id="lapTimes" style="list-style:none;padding:0;margin:0;"></ul>
            </div>
          </div>
          
          <!-- 타이머 컨텐츠 -->
          <div id="timerTabContent" class="tab-content" style="height:100%;display:none;flex-direction:column;">
            <div class="timer-setup" style="margin-bottom:20px;flex-shrink:0;">
              <div class="timer-input-group">
                <input id="timerHours" type="number" min="0" max="23" value="0" class="timer-input">
                <span class="timer-separator">:</span>
                <input id="timerMinutes" type="number" min="0" max="59" value="0" class="timer-input">
                <span class="timer-separator">:</span>
                <input id="timerSeconds" type="number" min="0" max="59" value="0" class="timer-input">
              </div>
              
              <div class="preset-buttons" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:15px;">
                <button class="timer-preset" data-minutes="1" style="padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">1분</button>
                <button class="timer-preset" data-minutes="3" style="padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">3분</button>
                <button class="timer-preset" data-minutes="5" style="padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">5분</button>
                <button class="timer-preset" data-minutes="10" style="padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">10분</button>
                <button class="timer-preset" data-minutes="30" style="padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">30분</button>
                <button class="timer-preset" data-hours="1" style="padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">1시간</button>
              </div>
            </div>
            
            <div class="time-display" style="text-align:center;margin:20px 0;font-size:42px;font-family:'Courier New',monospace;font-weight:300;">
              <span id="timerDisplay">00:00:00</span>
            </div>
            
            <div class="controls" style="display:flex;gap:10px;margin-top:10px;margin-bottom:20px;">
              <button id="timerStartStop" style="flex:1;padding:12px;background:linear-gradient(to right, #ff6b00, #ff9800);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
                시작
              </button>
              <button id="timerReset" style="flex:1;padding:12px;background-color:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
                리셋
              </button>
            </div>
            
            <div style="flex-grow:1;"></div>
          </div>
        </div>
        
        <audio id="timerAudio" src="sounds/alarm.wav" preload="auto"></audio>
      </div>
    `;
    
    document.body.appendChild(timerSidebar);
    
    // CSS 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      /* 탭 버튼 기본 스타일 (비활성) */
      .tab-button {
        background-color: #222 !important;
        color: #ccc !important;
        transition: background-color 0.3s;
      }

      /* 활성 탭 */
      .tab-button.active {
        background-color: #444 !important;
        color: #fff !important;
        font-weight: 500;
      }

      /* 탭 버튼 호버 */
      .tab-button:hover {
        background-color: #333 !important;
        color: #fff !important;
      }
      
      /* 스톱워치 랩 리스트 스타일 */
      #lapTimes li {
        display: flex;
        justify-content: space-between;
        padding: 10px 12px;
        margin-bottom: 8px;
        background-color: rgba(60,60,60,0.5);
        border-radius: 4px;
        font-size: 14px;
        border-left: 3px solid #ff6b00;
      }

      .timer-preset:hover {
        background-color: #444 !important;
      }
      
      #timerSidebar::-webkit-scrollbar {
        width: 8px;
        background-color: rgba(60,60,60,0.4);
      }

      /* 기존 추가 스타일 계속 유지 */
    `;
    
    document.head.appendChild(style);

    // 추가: 미니 타이머 및 time-ending CSS 정의
    const miniStyle = document.createElement('style');
    miniStyle.textContent = `
      .mini-timer {
        position: fixed;
        left: 80px;
        top: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-family: 'Courier New', monospace;
        font-size: 18px;
        z-index: 100;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        user-select: none;
        display: none;
      }
      .time-ending {
        color: #ff5252;
        animation: pulse 1s infinite;
      }
    `;
    document.head.appendChild(miniStyle);

    // 미니 타이머 생성 (초기에는 화면에 표시되지 않음)
    const miniTimer = document.createElement('div');
    miniTimer.className = 'mini-timer';
    miniTimer.id = 'miniTimer';
    miniTimer.textContent = '00:00:00';
    miniTimer.addEventListener('click', toggleTimerSidebar);
    document.body.appendChild(miniTimer);
  
    // 이벤트 리스너 설정
    setupEventListeners();
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    const timerBtn = document.getElementById('timerBtn');
    if (timerBtn) {
      timerBtn.addEventListener('click', toggleTimerSidebar);
    }
    const closeBtn = document.getElementById('closeTimerSidebar');
    if (closeBtn) {
      closeBtn.addEventListener('click', toggleTimerSidebar);
    }
    
    // 탭 전환 이벤트 바인딩
    const stopwatchTab = document.getElementById('stopwatchTab');
    if (stopwatchTab) {
      stopwatchTab.addEventListener('click', () => switchTab('stopwatch'));
    }
    const timerTab = document.getElementById('timerTab');
    if (timerTab) {
      timerTab.addEventListener('click', () => switchTab('timer'));
    }
    // 초기 탭 설정
    switchTab('stopwatch');
    
    // 스톱워치 컨트롤 바인딩
    const stopwatchStartStop = document.getElementById('stopwatchStartStop');
    if (stopwatchStartStop) {
      stopwatchStartStop.addEventListener('click', toggleStopwatch);
    }
    const stopwatchReset = document.getElementById('stopwatchReset');
    if (stopwatchReset) {
      stopwatchReset.addEventListener('click', resetStopwatch);
    }
    
    // 타이머 컨트롤 바인딩
    const timerStartStop = document.getElementById('timerStartStop');
    if (timerStartStop) {
      timerStartStop.addEventListener('click', toggleTimer);
    }
    const timerReset = document.getElementById('timerReset');
    if (timerReset) {
      timerReset.addEventListener('click', resetTimer);
    }
    
    // 타이머 프리셋 버튼 바인딩
    document.querySelectorAll('.timer-preset').forEach(button => {
      button.addEventListener('click', function() {
        const minutes = parseInt(this.getAttribute('data-minutes')) || 0;
        const hours = parseInt(this.getAttribute('data-hours')) || 0;
        const hoursInput = document.getElementById('timerHours');
        const minutesInput = document.getElementById('timerMinutes');
        const secondsInput = document.getElementById('timerSeconds');
        if (hoursInput) hoursInput.value = hours;
        if (minutesInput) minutesInput.value = minutes;
        if (secondsInput) secondsInput.value = 0;
        updateTimerDisplay();
      });
    });
  }

  // 타이머 사이드바 토글 함수
  function toggleTimerSidebar() {
    const timerSidebar = document.getElementById('timerSidebar');
    if (!timerSidebar) return;
    timerSidebar.style.left = timerSidebar.style.left === '0px' ? '-300px' : '0px';
  }

  // 탭 전환
  function switchTab(tab) {
    const stopwatchTab = document.getElementById('stopwatchTab');
    const timerTab = document.getElementById('timerTab');
    const stopwatchContent = document.getElementById('stopwatchContent');
    const timerTabContent = document.getElementById('timerTabContent');
    if (!stopwatchTab || !timerTab || !stopwatchContent || !timerTabContent) return;
    if (tab === 'stopwatch') {
      stopwatchTab.classList.add('active');
      timerTab.classList.remove('active');
      stopwatchContent.style.display = 'flex';
      timerTabContent.style.display = 'none';
      stopwatchTab.style.backgroundColor = '#444'; stopwatchTab.style.color = '#fff';
      timerTab.style.backgroundColor = '#222'; timerTab.style.color = '#ccc';
    } else {
      stopwatchTab.classList.remove('active');
      timerTab.classList.add('active');
      stopwatchContent.style.display = 'none';
      timerTabContent.style.display = 'flex';
      timerTab.style.backgroundColor = '#444'; timerTab.style.color = '#fff';
      stopwatchTab.style.backgroundColor = '#222'; stopwatchTab.style.color = '#ccc';
    }
    console.log(`탭 전환 후: stopwatch=${stopwatchContent.style.display}, timer=${timerTabContent.style.display}`);
  }

  // 스톱워치 기능
  function toggleStopwatch() {
    const btn = document.getElementById('stopwatchStartStop');
    const resetBtn = document.getElementById('stopwatchReset');
    if (!btn || !resetBtn) return;
    if (isStopwatchRunning) {
      clearInterval(stopwatchInterval);
      btn.textContent = '재개'; btn.style.background = 'linear-gradient(to right, #ff6b00, #ff9800)';
      resetBtn.textContent = '리셋'; isStopwatchRunning = false;
    } else {
      if (stopwatchElapsedTime === 0) stopwatchStartTime = Date.now();
      else stopwatchStartTime = Date.now() - stopwatchElapsedTime;
      stopwatchInterval = setInterval(updateStopwatch, 10);
      btn.textContent = '중지'; btn.style.background = 'linear-gradient(to right, #B71C1C, #7F0000)';
      resetBtn.textContent = '랩'; isStopwatchRunning = true;
    }
  }

  function resetStopwatch() {
    const resetBtn = document.getElementById('stopwatchReset');
    if (!resetBtn) return;
    if (isStopwatchRunning) {
      const lapsList = document.getElementById('lapTimes');
      if (lapsList) {
        const lapItem = document.createElement('li');
        const current = formatStopwatchTime(stopwatchElapsedTime);
        const lapNumber = lapsList.children.length + 1;
        lapItem.innerHTML = `<span class="lap-label">랩 ${lapNumber}</span><span class="lap-time">${current}</span>`;
        lapItem.className = 'lap-item new-lap';
        lapsList.querySelectorAll('li.new-lap').forEach(l => l.classList.remove('new-lap'));
        lapsList.prepend(lapItem);
      }
    } else {
      clearInterval(stopwatchInterval);
      stopwatchElapsedTime = 0;
      const disp = document.getElementById('stopwatchDisplay');
      const startBtn = document.getElementById('stopwatchStartStop');
      const lapsList = document.getElementById('lapTimes');
      if (disp) disp.textContent = '00:00.00';
      if (startBtn) { startBtn.textContent = '시작'; startBtn.style.background = 'linear-gradient(to right, #ff6b00, #ff9800)'; }
      if (lapsList) lapsList.innerHTML = '';
      isStopwatchRunning = false;
    }
  }

  function updateStopwatch() {
    const disp = document.getElementById('stopwatchDisplay');
    if (!disp) { clearInterval(stopwatchInterval); return; }
    const now = Date.now(); stopwatchElapsedTime = now - stopwatchStartTime;
    disp.textContent = formatStopwatchTime(stopwatchElapsedTime);
  }

  function formatStopwatchTime(ms) {
    const m = Math.floor(ms/60000);
    const s = Math.floor((ms%60000)/1000);
    const cs = Math.floor((ms%1000)/10);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  }

  // 타이머 기능
  function toggleTimer() {
    const btn = document.getElementById('timerStartStop');
    const disp = document.getElementById('timerDisplay');
    const mini = document.getElementById('miniTimer');
    if (!btn || !disp || !mini) return;
    if (isTimerRunning) {
      clearInterval(timerInterval);
      btn.textContent = '재개'; btn.style.background = 'linear-gradient(to right, #ff6b00, #ff9800)';
      isTimerRunning = false;
      timerDuration = timerEndTime - Date.now();
    } else {
      if (timerEndTime === 0) {
        const h = parseInt(document.getElementById('timerHours')?.value)||0;
        const mi = parseInt(document.getElementById('timerMinutes')?.value)||0;
        const s = parseInt(document.getElementById('timerSeconds')?.value)||0;
        timerDuration = (h*3600+mi*60+s)*1000;
        if (timerDuration<=0) { alert('시간을 설정해주세요.'); return; }
        window.lastTimerSettings = {hours:h,minutes:mi,seconds:s};
      }
      timerEndTime = Date.now()+timerDuration;
      timerInterval = setInterval(updateTimer,500);
      btn.textContent = '일시정지'; btn.style.background = 'linear-gradient(to right, #B71C1C, #7F0000)';
      isTimerRunning = true; mini.style.display = 'block';
    }
  }

  function updateTimer() {
    const disp = document.getElementById('timerDisplay');
    const mini = document.getElementById('miniTimer');
    const startBtn = document.getElementById('timerStartStop');
    if (!disp||!mini||!startBtn) { clearInterval(timerInterval); return; }
    const rem = timerEndTime - Date.now();
    if (rem<=0) {
      clearInterval(timerInterval);
      disp.textContent = '00:00:00'; startBtn.textContent='시작'; startBtn.style.background='linear-gradient(to right, #ff6b00, #ff9800)';
      mini.style.display='none'; isTimerRunning=false; timerEndTime=0; timerDuration=0;
      document.getElementById('timerAudio')?.play().catch(e=>console.error(e));
      showTimerCompleteNotification(); return;
    }
    const ft = formatTimerTime(rem);
    disp.textContent = ft; mini.textContent = ft;
    if (rem<60000) { disp.classList.add('time-ending'); mini.classList.add('time-ending'); }
    else { disp.classList.remove('time-ending'); mini.classList.remove('time-ending'); }
  }

  function resetTimer() {
    clearInterval(timerInterval); timerEndTime=0; timerDuration=0;
    const disp=document.getElementById('timerDisplay');
    const btn=document.getElementById('timerStartStop');
    const mini=document.getElementById('miniTimer');
    if (disp) { disp.textContent='00:00:00'; disp.classList.remove('time-ending'); }
    if (btn) { btn.textContent='시작'; btn.style.background='linear-gradient(to right, #ff6b00, #ff9800)'; }
    if (mini) { mini.style.display='none'; mini.classList.remove('time-ending'); }
    isTimerRunning=false; updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const hI=document.getElementById('timerHours');
    const mI=document.getElementById('timerMinutes');
    const sI=document.getElementById('timerSeconds');
    const disp=document.getElementById('timerDisplay'); if (!disp) return;
    const h=parseInt(hI?.value)||0;
    const m=parseInt(mI?.value)||0;
    const s=parseInt(sI?.value)||0;
    disp.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function formatTimerTime(ms) {
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function showTimerCompleteNotification() {
    const container=document.createElement('div');
    container.style.cssText=`position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,0.85);display:flex;justify-content:center;align-items:center;z-index:9999;backdrop-filter:blur(5px);`;
    const popup=document.createElement('div');
    popup.style.cssText=`background:linear-gradient(135deg,#2b2b2b 0%,#1a1a1a 100%);border-radius:16px;padding:30px;text-align:center;max-width:400px;width:80%;box-shadow:0 20px 25px rgba(0,0,0,0.25),0 10px 10px rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.1);animation:fadeIn 0.3s ease-out forwards;`;
    const iconColor='#ff6b00';
    let desc='설정한 시간이 끝났습니다.';
    if (window.lastTimerSettings) {
      const {hours,minutes,seconds}=window.lastTimerSettings;
      const parts=[]; if(hours>0)parts.push(`${hours}시간`); if(minutes>0)parts.push(`${minutes}분`);
      if(seconds>0||(!hours&&!minutes))parts.push(`${seconds}초`);
      desc=`${parts.join(' ')} 타이머가 완료되었습니다.`;
    }
    popup.innerHTML=`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;">
        <div style="width:80px;height:80px;background:${iconColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(255,107,0,0.4);animation:pulse 1.5s infinite;margin-bottom:5px;"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
        <h1 style="margin:0;color:${iconColor};font-size:36px;font-weight:700;line-height:1.2;">타이머 완료!</h1>
        <p style="margin:5px 0 0 0;color:#fff;font-size:18px;font-weight:500;">${desc}</p>
        <button id="closeTimerAlert" style="width:100%;padding:14px;margin-top:20px;background:${iconColor};color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:16px;">확인</button>
      </div>`;
    container.appendChild(popup); document.body.appendChild(container);
    const closeBtn=document.getElementById('closeTimerAlert');
    if(closeBtn){
      const handler=()=>{document.getElementById('timerAudio')?.pause(); document.getElementById('timerAudio').currentTime=0; try{document.body.removeChild(container);}catch{};};
      closeBtn.addEventListener('click',handler);
      container.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')handler();});
    }
  }
})(); 