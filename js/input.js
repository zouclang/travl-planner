/**
 * 旅游规划助手 — 输入表单模块
 *
 * 职责：
 *  - 渲染输入表单 HTML
 *  - 表单验证
 *  - 收集表单数据
 *  - 渲染历史记录列表
 *  - 渲染设置弹窗
 *  - 渲染加载动画
 */

const TripInput = (() => {

  /* ========== 输入表单 ========== */

  function renderForm() {
    const tomorrow = _getDateStr(1);
    const history = TripAPI.getHistory();

    return `
      <div class="input-page">
        <!-- 页头 -->
        <div class="input-hero">
          <div class="input-hero__icon">🗺️</div>
          <h1 class="input-hero__title">AI 旅游规划助手</h1>
          <p class="input-hero__subtitle">输入出发地和目的地，AI 为你生成详细行程攻略</p>
        </div>

        <!-- 表单 -->
        <form id="trip-form" class="trip-form" autocomplete="off">

          <!-- 核心信息 -->
          <div class="form-section">
            <div class="form-section__title">📍 行程基本信息</div>

            <div class="form-row form-row--two">
              <div class="form-group">
                <label class="form-label" for="inp-departure">出发地 <span class="required">*</span></label>
                <input type="text" id="inp-departure" class="form-input" placeholder="如：北京" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="inp-destination">目的地 <span class="required">*</span></label>
                <input type="text" id="inp-destination" class="form-input" placeholder="如：成都、西安" required>
              </div>
            </div>

            <div class="form-row form-row--three">
              <div class="form-group">
                <label class="form-label" for="inp-date">出发日期</label>
                <input type="date" id="inp-date" class="form-input" value="${tomorrow}" min="${_getDateStr(0)}">
              </div>
              <div class="form-group">
                <label class="form-label" for="inp-days">行程天数</label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" data-step="-1" data-target="inp-days">−</button>
                  <input type="number" id="inp-days" class="form-input stepper__input" value="3" min="1" max="14">
                  <button type="button" class="stepper__btn" data-step="1" data-target="inp-days">+</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <input type="checkbox" id="inp-roundtrip" checked> 往返（含返程）
                </label>
              </div>
            </div>
          </div>

          <!-- 旅客信息 -->
          <div class="form-section">
            <div class="form-section__title">👥 旅客信息</div>
            <div class="form-row form-row--three">
              <div class="form-group">
                <label class="form-label" for="inp-adults">成人</label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" data-step="-1" data-target="inp-adults">−</button>
                  <input type="number" id="inp-adults" class="form-input stepper__input" value="2" min="1" max="10">
                  <button type="button" class="stepper__btn" data-step="1" data-target="inp-adults">+</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="inp-children">儿童</label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" data-step="-1" data-target="inp-children">−</button>
                  <input type="number" id="inp-children" class="form-input stepper__input" value="0" min="0" max="5">
                  <button type="button" class="stepper__btn" data-step="1" data-target="inp-children">+</button>
                </div>
              </div>
              <div class="form-group" id="grp-child-age" style="display:none;">
                <label class="form-label" for="inp-child-age">儿童年龄</label>
                <input type="number" id="inp-child-age" class="form-input" value="4" min="0" max="17" placeholder="岁">
              </div>
            </div>
            <div class="form-row form-row--two" style="margin-top:8px;">
              <div class="form-group">
                <label class="form-label" for="inp-rooms">房间数</label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" data-step="-1" data-target="inp-rooms">−</button>
                  <input type="number" id="inp-rooms" class="form-input stepper__input" value="1" min="1" max="10">
                  <button type="button" class="stepper__btn" data-step="1" data-target="inp-rooms">+</button>
                </div>
              </div>
              <div class="form-group" style="align-self:end;padding-bottom:4px;">
                <span class="form-hint" style="font-size:0.78rem;color:var(--text-muted);">💡 夫妻可共用1间，朋友建议分开</span>
              </div>
            </div>
          </div>

          <!-- 出行偏好 -->
          <div class="form-section">
            <div class="form-section__title">🎯 出行偏好</div>

            <div class="form-label" style="margin-bottom:8px;">旅行风格（可多选）</div>
            <div class="chip-group" id="pref-chips">
              ${['自然风光', '历史文化', '美食探店', '亲子游乐', '户外徒步', '摄影打卡', '购物逛街', '休闲度假', '古镇村落', '主题乐园'].map(p =>
      `<label class="chip"><input type="checkbox" name="pref" value="${p}"><span class="chip__label">${p}</span></label>`
    ).join('')}
            </div>

            <div class="form-row form-row--two" style="margin-top:16px;">
              <div class="form-group">
                <label class="form-label" for="inp-transport">交通方式</label>
                <select id="inp-transport" class="form-input">
                  <option value="self-drive">🚗 自驾</option>
                  <option value="train">🚄 高铁+租车</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="inp-budget">预算水平</label>
                <select id="inp-budget" class="form-input">
                  <option value="economy">💰 经济型</option>
                  <option value="comfortable" selected>💎 舒适型</option>
                  <option value="luxury">👑 高端</option>
                </select>
              </div>
            </div>

            <div class="form-group" id="grp-fuel" style="margin-top:8px;">
              <label class="form-label" for="inp-fuel">百公里油耗（L）</label>
              <input type="number" id="inp-fuel" class="form-input" value="8.0" min="3" max="20" step="0.1">
            </div>

            <div class="form-group" style="margin-top:12px;">
              <label class="form-label" for="inp-notes">特别要求</label>
              <textarea id="inp-notes" class="form-input form-textarea" rows="2" placeholder="如：必去某景点、避免爬山、需要无障碍设施…"></textarea>
            </div>
          </div>

          <!-- 提交 -->
          <button type="submit" id="btn-generate" class="btn-primary btn-generate">
            <span class="btn-generate__icon">✨</span>
            <span class="btn-generate__text">AI 生成行程</span>
          </button>
        </form>

        <!-- 历史记录 -->
        ${history.length > 0 ? `
          <div class="form-section" style="margin-top:8px;">
            <div class="form-section__title" style="display:flex;justify-content:space-between;align-items:center;">
              📋 历史行程
              <button type="button" id="btn-clear-history" class="btn-text">清空</button>
            </div>
            <div class="history-list">
              ${history.map(h => `
                <div class="history-item" data-history-id="${h.id}">
                  <div class="history-item__title">${h.title}</div>
                  <div class="history-item__meta">${h.days}天 · ${_formatDate(h.createdAt)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 设置按钮 -->
        <button type="button" id="btn-settings" class="btn-settings" title="API 设置">⚙️</button>

        <!-- Demo 入口 -->
        <div class="demo-hint">
          <button type="button" id="btn-demo" class="btn-text">查看示例行程（Demo）</button>
        </div>
      </div>
    `;
  }

  /* ========== 加载动画 ========== */

  function renderLoading() {
    const messages = [
      '正在分析路线和距离…',
      '正在搜索沿途景点…',
      '正在查询门票和费用…',
      '正在规划每日行程…',
      '正在生成攻略建议…',
      '正在优化行程安排…',
      '即将完成，请稍候…',
    ];
    return `
      <div class="loading-page">
        <div class="loading-animation">
          <div class="loading-globe">🌍</div>
          <div class="loading-ring"></div>
        </div>
        <div class="loading-title">AI 正在规划你的行程</div>
        <div class="loading-message" id="loading-msg">${messages[0]}</div>
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
  }

  /** 启动加载消息轮播 */
  let _msgTimer = null;
  function startLoadingMessages() {
    const messages = [
      '正在分析路线和距离…',
      '正在搜索沿途景点…',
      '正在查询门票和费用…',
      '正在规划每日行程…',
      '正在生成攻略建议…',
      '正在优化行程安排…',
      '即将完成，请稍候…',
    ];
    let idx = 0;
    _msgTimer = setInterval(() => {
      idx = (idx + 1) % messages.length;
      const el = document.getElementById('loading-msg');
      if (el) {
        el.style.opacity = '0';
        setTimeout(() => {
          el.textContent = messages[idx];
          el.style.opacity = '1';
        }, 300);
      }
    }, 3000);
  }

  function stopLoadingMessages() {
    if (_msgTimer) { clearInterval(_msgTimer); _msgTimer = null; }
  }

  /* ========== 设置弹窗 ========== */

  function renderSettingsModal() {
    const s = TripAPI.getSettings();
    return `
      <div class="modal-overlay" id="settings-modal">
        <div class="modal">
          <div class="modal__header">
            <div class="modal__title">⚙️ AI 服务设置</div>
            <button type="button" class="modal__close" id="btn-close-settings">✕</button>
          </div>
          <div class="modal__body">
            <p class="modal__hint">配置 AI 大模型 API。支持任何 OpenAI 兼容接口（DeepSeek / Gemini / Qwen 等）。</p>

            <label class="form-label">
              <input type="checkbox" id="set-direct" ${s.directMode ? 'checked' : ''}>
              直连模式（浏览器直接调用 API，无需后端）
            </label>

            <div class="form-group" style="margin-top:12px;">
              <label class="form-label" for="set-url">API Endpoint</label>
              <input type="text" id="set-url" class="form-input" value="${s.apiUrl || ''}" placeholder="https://api.deepseek.com/v1">
            </div>
            <div class="form-group">
              <label class="form-label" for="set-key">API Key</label>
              <input type="password" id="set-key" class="form-input" value="${s.apiKey || ''}" placeholder="sk-...">
            </div>
            <div class="form-group">
              <label class="form-label" for="set-model">模型名称</label>
              <input type="text" id="set-model" class="form-input" value="${s.model || ''}" placeholder="deepseek-chat">
            </div>

            <hr style="border:none;border-top:1px solid var(--divider);margin:16px 0;">
            <p class="modal__hint">🗺️ 高德地图配置（可选，用于显示路线地图）</p>

            <div class="form-group">
              <label class="form-label" for="set-amap-key">高德 JS API Key</label>
              <input type="text" id="set-amap-key" class="form-input" value="${s.amapKey || ''}" placeholder="请到 console.amap.com 申请">
            </div>
            <div class="form-group">
              <label class="form-label" for="set-amap-secret">安全密钥 (securityJsCode)</label>
              <input type="text" id="set-amap-secret" class="form-input" value="${s.amapSecret || ''}" placeholder="高德应用设置中获取">
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn-secondary" id="btn-cancel-settings">取消</button>
            <button type="button" class="btn-primary" id="btn-save-settings">保存</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ========== 错误提示 ========== */

  function renderError(message) {
    return `
      <div class="error-page">
        <div class="error-page__icon">😥</div>
        <div class="error-page__title">生成失败</div>
        <div class="error-page__message">${message}</div>
        <button type="button" class="btn-primary" onclick="location.hash='#input'">返回重试</button>
      </div>
    `;
  }

  /* ========== 表单数据收集 ========== */

  function collectFormData() {
    const prefs = [];
    document.querySelectorAll('#pref-chips input:checked').forEach(cb => prefs.push(cb.value));

    const children = parseInt(document.getElementById('inp-children').value, 10) || 0;

    return {
      departure: document.getElementById('inp-departure').value.trim(),
      destination: document.getElementById('inp-destination').value.trim(),
      startDate: document.getElementById('inp-date').value,
      days: parseInt(document.getElementById('inp-days').value, 10) || 3,
      roundTrip: document.getElementById('inp-roundtrip').checked,
      adults: parseInt(document.getElementById('inp-adults').value, 10) || 2,
      children: children,
      childAge: children > 0 ? (parseInt(document.getElementById('inp-child-age').value, 10) || 4) : null,
      rooms: parseInt(document.getElementById('inp-rooms').value, 10) || 1,
      preferences: prefs,
      transport: document.getElementById('inp-transport').value,
      budget: document.getElementById('inp-budget').value,
      fuelConsumption: parseFloat(document.getElementById('inp-fuel').value) || 8.0,
      notes: document.getElementById('inp-notes').value.trim(),
    };
  }

  /* ========== 表单交互绑定 ========== */

  function bindFormEvents() {
    // Stepper buttons
    document.querySelectorAll('.stepper__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const step = parseInt(btn.dataset.step, 10);
        const min = parseInt(target.min, 10) || 0;
        const max = parseInt(target.max, 10) || 99;
        let val = parseInt(target.value, 10) || 0;
        val = Math.min(max, Math.max(min, val + step));
        target.value = val;
        target.dispatchEvent(new Event('change'));
      });
    });

    // Show/hide child age
    const childrenInput = document.getElementById('inp-children');
    const childAgeGroup = document.getElementById('grp-child-age');
    if (childrenInput && childAgeGroup) {
      const toggle = () => {
        childAgeGroup.style.display = parseInt(childrenInput.value, 10) > 0 ? '' : 'none';
      };
      childrenInput.addEventListener('change', toggle);
      childrenInput.addEventListener('input', toggle);
      toggle();
    }

    // Show/hide fuel consumption
    const transportSel = document.getElementById('inp-transport');
    const fuelGroup = document.getElementById('grp-fuel');
    if (transportSel && fuelGroup) {
      const toggle = () => {
        fuelGroup.style.display = transportSel.value === 'self-drive' ? '' : 'none';
      };
      transportSel.addEventListener('change', toggle);
      toggle();
    }
  }

  /* ========== Helpers ========== */

  function _getDateStr(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  }

  function _formatDate(isoStr) {
    try {
      const d = new Date(isoStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return ''; }
  }

  /* ========== 导出 ========== */
  return {
    renderForm,
    renderLoading,
    renderSettingsModal,
    renderError,
    collectFormData,
    bindFormEvents,
    startLoadingMessages,
    stopLoadingMessages,
  };

})();
