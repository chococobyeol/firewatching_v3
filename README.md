# 불멍 v2 - THREE.js Fire Simulation

불멍 v2는 웹 브라우저에서 모닥불을 시뮬레이션하며, 알람, 타이머, 명언, 운세, 세계 시간/날씨, 이미지 레이어, 광고 표시 기능을 제공하는 인터랙티브 웹 애플리케이션입니다.

## 주요 기능
- 모닥불(화염) 시뮬레이션 (Three.js 기반)
- 연기 및 Ember(불똥) 입자 효과
- 화염 색상, 강도, 속도, Glow 등 실시간 파라미터 조정
- 배경 이미지 및 밤하늘(별) 연출
- 이미지 레이어 전환(책, 의자, 광고 등)
- - 오늘의 요미(Yomi Note) 기능: 원격 서버에서 매일 업데이트된 이미지 목록을 가져와 모달로 표시
- 랜덤 명언(Quotes) 및 운세(Fortune) 표시
- 광고(Advertisements) 출력 및 관리
- 알람(Alarm) 설정 및 알림음 제공
- 타이머/스톱워치 기능
- 세계 시간 및 날씨(Time & Weather) 조회(Open-Meteo API)
- 로컬 스토리지에 사용자 설정(화염, 알람, 날씨 등) 저장

## 설치 및 실행
1. 리포지토리 복제:
   ```bash
   git clone https://github.com/<사용자명>/bulmeong3.git
   cd bulmeong3
   ```
2. 로컬 서버 실행 (간단한 HTTP 서버 사용 권장):
   ```bash
   # Python3
   python3 -m http.server 8000
   ```
3. 웹 브라우저에서 `http://localhost:8000` 방문

## 디렉토리 구조
```
bulmeong3/
├─ index.html          # 메인 페이지
├─ privacy.html        # 개인정보처리방침
├─ styles.css          # 전역 스타일
├─ images/             # 이미지 리소스
├─ sounds/             # 사운드 리소스
└─ src/                # 자바스크립트 소스 코드
   ├─ index.js         # 진입점
   ├─ fire-app.js      # 메인 애플리케이션 로직
   ├─ Fire.js          # 화염 시뮬레이션 클래스
   ├─ FireShader.js    # 셰이더 코드
   ├─ Smoke.js         # 연기 입자 시스템
   ├─ Ember.js         # Ember(불똥) 입자 시스템
   ├─ fire-controls.js # 화염 파라미터 제어 UI
   ├─ alarm.js         # 알람 기능
   ├─ timer.js         # 타이머/스톱워치 기능
   ├─ timeweather.js   # 세계 시간/날씨 기능
   ├─ quotes.js        # 명언 데이터
   ├─ fortune.js       # 운세 데이터
   ├─ advertisements.js# 광고 관리
   └─ image-layer.js   # 이미지 레이어 전환 로직
```

## 사용법
- **모닥불 설정**: 우측 상단 톱니바퀴 아이콘 클릭 → 파라미터 사이드바에서 조정
- **알람**: 좌측 상단 알람 아이콘 클릭 → 시간·제목·반복·알림음 설정 후 추가
- **타이머/스톱워치**: 알람 아이콘 아래 타이머 아이콘 클릭 → 스톱워치·타이머 탭 선택
- **명언/운세**: 화면 클릭 또는 지정 영역 클릭 시 팝업 표시
- **오늘의 요미**: 화면 클릭 또는 지정 영역 클릭 시 원격 서버에서 이미지 목록을 로드하고 모달로 표시
- **세계 시간/날씨**: 날씨 아이콘 클릭 → 도시 추가·편집

## 기여 방법
1. 이슈 등록 후 PR 생성
2. 코드 스타일: ES6 모듈, 일관된 들여쓰기 및 주석 사용 권장

## 라이선스
MIT 라이선스

## 연락처
- Email: chococobyeol@gmail.com
- GitHub: https://github.com/<사용자명>/bulmeong3
