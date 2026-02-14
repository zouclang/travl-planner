/**
 * 旅游规划助手 — 核心应用逻辑
 *
 * 职责：
 *  - Hash 路由（#input / #loading / #overview / #day/N）
 *  - 输入页 / 加载页 / 总览页 / 详情页 切换
 *  - 动态加载 trip data（AI 生成或历史记录）
 *  - 设置弹窗管理
 */

const App = (() => {

  let data = null;  // 当前行程数据（动态加载）
  let colors = [];

  /* ==================== 路由 ==================== */

  function init() {
    _loadAmapSDK();
    window.addEventListener('hashchange', _onRoute);
    _onRoute();
  }

  /** 加载行程数据并显示 */
  function loadTrip(tripData) {
    data = tripData;
    colors = data.routeColors || ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0ea5e9', '#ec4899'];
    location.hash = '#overview';
  }

  function _onRoute() {
    const hash = location.hash || '#input';

    if (hash === '#input' || hash === '') {
      _showView('input');
    } else if (hash === '#loading') {
      _showView('loading');
    } else if (hash.startsWith('#overview')) {
      if (!data) { location.hash = '#input'; return; }
      _showView('overview');
    } else if (hash.startsWith('#day/')) {
      if (!data) { location.hash = '#input'; return; }
      const idx = parseInt(hash.split('/')[1], 10) - 1;
      _showView('detail', idx);
    } else if (hash === '#error') {
      _showView('error');
    } else {
      _showView('input');
    }
  }

  /** 动态加载高德地图 SDK（返回 Promise） */
  let _amapPromise = null;
  function _loadAmapSDK() {
    if (window.AMap) return Promise.resolve();
    if (_amapPromise) return _amapPromise;

    const settings = TripAPI.getSettings();
    if (!settings.amapKey) return Promise.reject('未配置高德 Key');

    _amapPromise = new Promise((resolve, reject) => {
      // Set security config
      if (settings.amapSecret) {
        window._AMapSecurityConfig = { securityJsCode: settings.amapSecret };
      }

      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${settings.amapKey}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        _amapPromise = null;
        reject('高德地图 SDK 加载失败');
      };
      document.head.appendChild(script);
    });
    return _amapPromise;
  }

  function _showView(name, param) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const fab = document.getElementById('fab-back');

    if (name === 'input') {
      const el = document.getElementById('view-input');
      el.innerHTML = TripInput.renderForm();
      el.classList.add('active');
      if (fab) fab.classList.add('hidden');
      window.scrollTo(0, 0);
      _bindInputEvents(el);

    } else if (name === 'loading') {
      const el = document.getElementById('view-loading');
      el.innerHTML = TripInput.renderLoading();
      el.classList.add('active');
      if (fab) fab.classList.add('hidden');
      TripInput.startLoadingMessages();

    } else if (name === 'error') {
      const el = document.getElementById('view-error');
      // Content already set by _handleGenerate
      el.classList.add('active');
      if (fab) fab.classList.add('hidden');

    } else if (name === 'overview') {
      const el = document.getElementById('view-overview');
      el.innerHTML = _renderOverview();
      el.classList.add('active');
      if (fab) fab.classList.add('hidden');
      window.scrollTo(0, 0);

      _loadAmapSDK().then(() => {
        TripMap.renderOverview('map-overview', data);
      }).catch(() => {
        TripMap.renderOverview('map-overview', data);
      });

      el.querySelectorAll('[data-day]').forEach(card => {
        card.addEventListener('click', () => {
          location.hash = `#day/${card.dataset.day}`;
        });
      });

      // New trip button
      const newBtn = el.querySelector('#btn-new-trip');
      if (newBtn) {
        newBtn.addEventListener('click', () => {
          data = null;
          location.hash = '#input';
        });
      }

      // PDF export button
      const pdfBtn = el.querySelector('#btn-export-pdf');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', () => TripPDF.exportPDF(data));
      }

    } else if (name === 'detail' && param !== undefined) {
      const el = document.getElementById('view-detail');
      el.innerHTML = _renderDayDetail(param);
      el.classList.add('active');
      if (fab) fab.classList.remove('hidden');
      window.scrollTo(0, 0);

      _loadAmapSDK().then(() => {
        TripMap.renderDay('map-day', param, data);
      }).catch(() => {
        TripMap.renderDay('map-day', param, data);
      });

      el.querySelectorAll('.day-header__back').forEach(btn => {
        btn.addEventListener('click', () => { location.hash = '#overview'; });
      });

      el.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = parseInt(btn.dataset.nav, 10);
          location.hash = `#day/${target}`;
        });
      });
    }
  }

  /* ==================== 输入页事件 ==================== */

  function _bindInputEvents(container) {
    TripInput.bindFormEvents();

    // Form submit
    const form = document.getElementById('trip-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        _handleGenerate();
      });
    }

    // History items
    container.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const tripData = TripAPI.loadFromHistory(item.dataset.historyId);
        if (tripData) loadTrip(tripData);
      });
    });

    // Clear history
    const clearBtn = document.getElementById('btn-clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        TripAPI.clearHistory();
        location.hash = '#input'; // Refresh
        _onRoute();
      });
    }

    // Settings button
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', _showSettings);
    }

    // Demo button
    const demoBtn = document.getElementById('btn-demo');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        if (typeof TRIP_DATA !== 'undefined') {
          loadTrip(TRIP_DATA);
        }
      });
    }
  }

  /* ==================== AI 生成 ==================== */

  async function _handleGenerate() {
    const params = TripInput.collectFormData();

    if (!params.departure || !params.destination) {
      alert('请填写出发地和目的地');
      return;
    }

    // Show loading
    location.hash = '#loading';

    try {
      const tripData = await TripAPI.generate(params);
      TripInput.stopLoadingMessages();
      loadTrip(tripData);
    } catch (err) {
      TripInput.stopLoadingMessages();
      console.error('Generate error:', err);
      const el = document.getElementById('view-error');
      el.innerHTML = TripInput.renderError(err.message);
      location.hash = '#error';
    }
  }

  /* ==================== 设置弹窗 ==================== */

  function _showSettings() {
    const container = document.getElementById('settings-container');
    container.innerHTML = TripInput.renderSettingsModal();

    const modal = document.getElementById('settings-modal');
    requestAnimationFrame(() => modal.classList.add('modal-overlay--visible'));

    const close = () => {
      modal.classList.remove('modal-overlay--visible');
      setTimeout(() => { container.innerHTML = ''; }, 300);
    };

    document.getElementById('btn-close-settings').addEventListener('click', close);
    document.getElementById('btn-cancel-settings').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      TripAPI.saveSettings({
        directMode: document.getElementById('set-direct').checked,
        apiUrl: document.getElementById('set-url').value.trim(),
        apiKey: document.getElementById('set-key').value.trim(),
        model: document.getElementById('set-model').value.trim(),
        amapKey: document.getElementById('set-amap-key').value.trim(),
        amapSecret: document.getElementById('set-amap-secret').value.trim(),
      });
      // Reload Amap SDK if key changed
      _loadAmapSDK();
      close();
    });
  }

  /* ==================== 总览页渲染 ==================== */

  function _renderOverview() {
    const m = data.meta || {};
    const s = m.stats || {};
    const budget = m.budget || {};
    const schedule = m.schedule || {};

    return `
      <!-- 头部 -->
      <div class="trip-header">
        <div class="trip-header__top-bar">
          <button type="button" id="btn-new-trip" class="btn-new-trip">← 新行程</button>
          <button type="button" id="btn-export-pdf" class="btn-new-trip" style="margin-left:auto;">📄 导出PDF</button>
        </div>
        <div class="trip-header__title">${m.title || '行程规划'}</div>
        <div class="trip-header__subtitle">${m.subtitle || ''}</div>
        <div class="trip-header__route">${m.route || ''} | ${m.travelers || ''}</div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card__label">全程里程</div>
            <div class="stat-card__value">${s.totalDistance || '-'}<span class="stat-card__unit"> km</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">驾驶时长</div>
            <div class="stat-card__value">${s.totalDriving || '-'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">过路费</div>
            <div class="stat-card__value">${s.tollFees || 0}<span class="stat-card__unit"> 元</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">油费</div>
            <div class="stat-card__value">${s.fuelCost || 0}<span class="stat-card__unit"> 元</span></div>
          </div>
        </div>

        <div class="budget-bar">
          <div class="budget-bar__label">预算合计</div>
          <div class="budget-bar__value">${(budget.range && budget.range[0]) || 0} – ${(budget.range && budget.range[1]) || 0} 元</div>
          <div class="budget-bar__note">${budget.includes || ''}</div>
        </div>

        <div class="schedule-pills">
          <span class="schedule-pill">📅 ${schedule.departure || '出发日期'}</span>
          <span class="schedule-pill">📍 ${schedule.midpoint || '途经点'}</span>
          <span class="schedule-pill">🏠 ${schedule.return || '返程'}</span>
        </div>
      </div>

      <!-- 总路线地图 -->
      <div class="map-section">
        <div class="section-bar">总路线地图（按天分色）</div>
        <div id="map-overview" class="map-container"></div>
        <div class="card" style="margin:0;border-radius:0 0 var(--radius-sm) var(--radius-sm);box-shadow:none;border-top:1px solid var(--divider);">
          <div class="map-legend">
            ${data.days.map((d, i) => `
              <span class="map-legend__item">
                <span class="map-legend__dot" style="background:${colors[i % colors.length]}"></span>
                D${d.day} ${d.date.slice(5)}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Day Progress Dots -->
      <div class="day-progress">
        ${data.days.map((d, i) => `
          <div class="day-progress__item" style="cursor:pointer;" onclick="location.hash='#day/${d.day}'">
            <div class="day-progress__wrapper">
              <div class="day-progress__dot day-progress__dot--active" style="background:${colors[i % colors.length]};border-color:${colors[i % colors.length]}30;"></div>
              <div class="day-progress__label">D${d.day}</div>
            </div>
          </div>
          ${i < data.days.length - 1 ? '<div class="day-progress__line"></div>' : ''}
        `).join('')}
      </div>

      <!-- 每日概要 -->
      <div style="padding:8px 16px 4px;"><div class="section-bar" style="border-radius:var(--radius-sm);">每日概要</div></div>
      <div class="day-summary-list">
        ${data.days.map((d, i) => _renderDaySummaryCard(d, i)).join('')}
      </div>

      <!-- 数据更新时间 -->
      <div class="data-footer">
        AI 生成行程　|　高德POI距离为直线估算（以导航实际为准）
      </div>
    `;
  }

  function _renderDaySummaryCard(day, index) {
    const color = colors[index % colors.length];
    const driving = day.driving || {};
    const hotel = day.hotel || {};

    return `
      <div class="day-summary" data-day="${day.day}">
        <div class="day-summary__header">
          <div class="day-summary__badge" style="background:${color}">D${day.day}</div>
          <div class="day-summary__title-group">
            <div class="day-summary__date">${day.date} (${day.weekday})</div>
            <div class="day-summary__theme">主线：${day.theme}</div>
          </div>
        </div>
        <div class="day-summary__details">
          <div class="day-summary__detail-item">
            <span class="day-summary__detail-icon">📍</span>
            核心：${(day.highlights || []).join('、')}
          </div>
          <div class="day-summary__detail-item">
            <span class="day-summary__detail-icon">⏰</span>
            出发：${day.departure || '-'}
          </div>
          <div class="day-summary__detail-item">
            <span class="day-summary__detail-icon">🏨</span>
            ${hotel.name || '未定'}（${hotel.landmark || '-'}）
          </div>
          <div class="day-summary__detail-item">
            <span class="day-summary__detail-icon">🚗</span>
            ${driving.distance || '-'}km / ${driving.duration || '-'}
          </div>
          <div class="day-summary__detail-item">
            <span class="day-summary__detail-icon">💰</span>
            过路费${driving.toll || 0}元
          </div>
          <div class="day-summary__detail-item">
            <span class="day-summary__detail-icon">⛽</span>
            油费${driving.fuel || 0}元
          </div>
        </div>
        <span class="day-summary__arrow">›</span>
      </div>
    `;
  }

  /* ==================== 详情页渲染 ==================== */

  function _renderDayDetail(index) {
    const day = data.days[index];
    if (!day) return '<p>未找到该日行程</p>';

    const color = colors[index % colors.length];
    const prevDay = index > 0 ? data.days[index - 1] : null;
    const nextDay = index < data.days.length - 1 ? data.days[index + 1] : null;

    // Defensive objects
    const weather = day.weather || {};
    const driving = day.driving || {};
    const hotel = day.hotel || {};
    const route = day.route || { start: {}, end: {} };

    return `
      <!-- 日头部 -->
      <div class="day-header">
        <button class="day-header__back">← 返回总览</button>
        <div class="day-header__title">D${day.day} | ${day.date} (${day.weekday})</div>
        <div class="day-header__theme">${day.theme}</div>
        <div class="day-header__meta">
          ${(day.tags || []).map(t => `<span class="day-header__tag">${t}</span>`).join('')}
        </div>
        <div class="day-header__info-row">
          <span class="day-header__info-item">🌤️ ${weather.condition || '-'}，${weather.low || '?'}℃/${weather.high || '?'}℃</span>
          <span class="day-header__info-item">⏰ 出发 ${day.departure || '-'}</span>
          <span class="day-header__info-item">🏨 ${hotel.name || '未定'}（${hotel.landmark || '-'}）</span>
          <span class="day-header__info-item">🚗 当日车程 ${driving.distance || '-'}km / ${driving.duration || '-'}</span>
          <span class="day-header__info-item">💰 过路费${driving.toll || 0}元 · 油费${driving.fuel || 0}元</span>
        </div>
      </div>

      <!-- 当日地图 -->
      <div class="map-section">
        <div class="section-bar">地图路线（当日）</div>
        <div id="map-day" class="map-container map-container--small"></div>
        <div class="card" style="margin:0;border-radius:0 0 var(--radius-sm) var(--radius-sm);box-shadow:none;border-top:1px solid var(--divider);">
          <div class="map-legend">
            ${day.route ? `
              <span class="map-legend__item">
                <span class="map-legend__dot" style="background:${color}"></span>
                ${route.start.name || '起点'} → ${route.end.name || '终点'}
                ${route.waypoints && route.waypoints.length
          ? `（途经 ${route.waypoints.map(w => w.name).join('、')}）`
          : ''}
              </span>
            ` : ''}
            <span class="map-legend__item">
              总距离 ${driving.distance || '-'}km · 预估 ${driving.duration || '-'}
            </span>
          </div>
        </div>
      </div>

      <!-- 时间轴 -->
      <div class="card">
        <div class="section-bar">时间轴行程</div>
        <div class="card__body">
          <div class="timeline">
            ${(day.timeline || []).map((item, i) => `
              <div class="timeline__item">
                <div class="timeline__marker">
                  <div class="timeline__dot${i === 0 || i === day.timeline.length - 1 ? ' timeline__dot--highlight' : ''}"></div>
                  ${i < day.timeline.length - 1 ? '<div class="timeline__line"></div>' : ''}
                </div>
                <div class="timeline__content">
                  <div class="timeline__time">${item.time}</div>
                  <div class="timeline__event">${item.event}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 景点介绍 -->
      ${(day.attractions && day.attractions.length) ? `
      <div class="card">
        <div class="section-bar">重点介绍 / 等级 / 攻略 / 票价</div>
        <div class="card__body">
          ${day.attractions.map(a => _renderAttractionCard(a)).join('')}
        </div>
      </div>
      ` : ''}

      <!-- 用餐建议 -->
      ${(day.meals && day.meals.length) ? `
      <div class="card">
        <div class="section-bar">用餐建议</div>
        <div class="card__body">
          <div class="meal-list">
            ${day.meals.map(m => `
              <div class="meal-item">
                <div class="meal-item__icon">${m.type === '午餐' ? '🍱' : m.type === '晚餐' ? '🍽️' : '🍪'}</div>
                <div class="meal-item__info">
                  <div class="meal-item__type">${m.type}</div>
                  <div class="meal-item__suggestion">${m.suggestion}</div>
                </div>
                <div class="meal-item__budget">¥${m.budget}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- 用费建议 -->
      ${day.costBreakdown ? _renderCostSection(day) : ''}

      <!-- 上一天/下一天导航 -->
      <div style="display:flex;gap:10px;padding:8px 16px 16px;">
        ${prevDay ? `<button data-nav="${prevDay.day}" style="
          flex:1;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);
          background:var(--card-bg);cursor:pointer;text-align:left;font-size:0.82rem;
          transition:all var(--transition);color:var(--text);">
          ← D${prevDay.day} ${prevDay.weekday}
        </button>` : '<div style="flex:1;"></div>'}
        ${nextDay ? `<button data-nav="${nextDay.day}" style="
          flex:1;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);
          background:var(--card-bg);cursor:pointer;text-align:right;font-size:0.82rem;
          transition:all var(--transition);color:var(--text);">
          D${nextDay.day} ${nextDay.weekday} →
        </button>` : '<div style="flex:1;"></div>'}
      </div>
    `;
  }

  function _renderAttractionCard(a) {
    return `
      <div class="attraction-card">
        <div class="attraction-card__name">${a.name}</div>
        <span class="attraction-card__level">${a.level || ''}</span>
        <div class="attraction-card__ticket">🎫 ${a.ticket || '未知'}</div>

        <div class="attraction-card__section">
          <div class="attraction-card__section-title">📝 景区介绍</div>
          <div class="attraction-card__section-text">${a.intro || ''}</div>
        </div>

        <div class="attraction-card__section">
          <div class="attraction-card__section-title">💡 攻略建议</div>
          <div class="attraction-card__section-text">${a.tips || ''}</div>
        </div>

        <div class="attraction-card__section">
          <div class="attraction-card__section-title">⚠️ 避坑提醒</div>
          <div class="attraction-card__section-text">${a.pitfalls || '无'}</div>
        </div>

        ${a.childTips ? `
          <div class="attraction-card__child-tip">
            <div class="attraction-card__child-tip-title">👶 亲子提醒</div>
            <div class="attraction-card__child-tip-text">${a.childTips}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function _renderCostSection(day) {
    const cb = day.costBreakdown || {};
    return `
      <div class="card">
        <div class="section-bar">用费建议（路线控制）</div>
        <div class="card__body">
          <table class="cost-table">
            <thead>
              <tr>
                <th>路段</th>
                <th style="text-align:right;">距离</th>
                <th style="text-align:right;">过路费</th>
                <th style="text-align:right;">油费</th>
              </tr>
            </thead>
            <tbody>
              ${(cb.routes || []).map(r => `
                <tr>
                  <td>${r.segment}</td>
                  <td class="num">${r.distance}km</td>
                  <td class="num">${r.toll}元</td>
                  <td class="num">${r.fuel}元</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="section-bar">当日预算估算</div>
        <div class="card__body">
          <div class="budget-summary">
            ${Object.entries(cb.budget || {}).map(([k, v]) => `
              <div class="budget-item">
                <span class="budget-item__label">${k}</span>
                <span class="budget-item__value">${v === 0 ? '—' : v + '元'}</span>
              </div>
            `).join('')}
            <div class="budget-total">
              <span class="budget-total__label">当日合计（估）</span>
              <span class="budget-total__value">${(cb.totalRange && cb.totalRange[0]) || 0} – ${(cb.totalRange && cb.totalRange[1]) || 0} 元</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ==================== 导出 ==================== */
  return { init, loadTrip };

})();

/* ---------- 启动 ---------- */
document.addEventListener('DOMContentLoaded', () => App.init());
