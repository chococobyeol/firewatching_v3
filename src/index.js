// src/index.js

// 전역 THREE.js는 이미 로드됨
// 주요 모듈 import
import './FireShader.js';
import Fire from './Fire.js';
import EmberParticleSystem from './Ember.js';
import SmokeParticleSystem from './Smoke.js';
import './quotes.js';
import './fortune.js';
import './advertisements.js';
import FireControls from './fire-controls.js';
import ImageLayer from './image-layer.js';
import FireApp from './fire-app.js';
import './alarm.js';
import './timer.js';
import './timeweather.js';

// 애플리케이션 초기화
window.fireApp = new FireApp();
window.fireControls = new FireControls(); 