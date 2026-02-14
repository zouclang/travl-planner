/**
 * 旅游规划助手 — API 客户端模块
 *
 * 职责：
 *  - 调用后端 /api/plan 接口
 *  - 管理历史记录 (localStorage)
 *  - 提供 demo 模式回退
 */

const TripAPI = (() => {

    const STORAGE_KEY = 'trip_planner_history';
    const SETTINGS_KEY = 'trip_planner_settings';

    /* ========== API 调用 ========== */

    /**
     * 生成行程
     * @param {Object} params - 用户输入参数
     * @returns {Promise<Object>} TRIP_DATA 格式的 JSON
     */
    async function generate(params) {
        const settings = getSettings();

        // ---- 直连模式（默认开启） ----
        // directMode 默认 true；仅当显式关闭且后端可用时走代理
        const useDirect = settings.directMode !== false;
        if (useDirect) {
            if (!settings.apiUrl || !settings.apiKey) {
                throw new Error('请先点击右下角 ⚙️ 配置 API Key 和 API Endpoint');
            }
            return _callLLMDirect(params, settings);
        }

        // ---- 通过后端代理 ----
        const resp = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!resp.ok) {
            // Helper for local dev confusion
            if ((resp.status === 404 || resp.status === 501 || resp.status === 405) &&
                (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
                throw new Error(`本地预览请开启「直连模式」（因为当前没有运行 Cloudflare 后端）。请点击右下角设置 ⚙️ 配置。`);
            }

            const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
            throw new Error(err.error || err.detail || `请求失败 (${resp.status})`);
        }

        const tripData = await resp.json();
        _saveToHistory(params, tripData);
        return tripData;
    }

    /**
     * 直连 LLM API（本地开发 / 无后端时使用）
     */
    async function _callLLMDirect(params, settings) {
        const chatUrl = settings.apiUrl.replace(/\/$/, '') + '/chat/completions';

        // Import the system prompt from the page (injected as a global)
        const systemPrompt = window.__SYSTEM_PROMPT || _getBuiltinSystemPrompt();
        const userPrompt = _buildUserPrompt(params);

        const resp = await fetch(chatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`,
            },
            body: JSON.stringify({
                model: settings.model || 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 32000,
            }),
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`AI 服务调用失败 (${resp.status}): ${errText.slice(0, 200)}`);
        }

        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('AI 返回结果为空');

        let cleaned = content.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        try {
            const tripData = JSON.parse(cleaned);
            _saveToHistory(params, tripData);
            return tripData;
        } catch (e) {
            console.warn('JSON Parse failed, attempting repair...', e);
            try {
                const repaired = _repairAndParseJSON(cleaned);
                _saveToHistory(params, repaired);
                return repaired;
            } catch (e2) {
                throw new Error('AI 返回数据格式错误（无法解析 JSON），请重试。错误信息: ' + e.message);
            }
        }
    }

    /**
     * 尝试修复截断的 JSON
     */
    function _repairAndParseJSON(str) {
        console.log('[JSON Repair] Input length:', str.length);

        // Strategy 1: trim to last valid brace
        const lastBrace = str.lastIndexOf('}');
        if (lastBrace > -1) {
            try { return JSON.parse(str.substring(0, lastBrace + 1)); } catch { }
        }

        // Strategy 2: bracket-counting auto-close
        const closed = _autoCloseJSON(str);
        try { return JSON.parse(closed); } catch { }

        // Strategy 3: progressively trim trailing garbage then auto-close
        let trimmed = str;
        for (let i = 0; i < 500 && trimmed.length > 10; i++) {
            // Remove trailing incomplete element (partial key:value or array item)
            trimmed = trimmed.replace(/,\s*("[^"]*"?\s*:?\s*[^,\}\]]*)?$/, '');
            const attempt = _autoCloseJSON(trimmed);
            try { return JSON.parse(attempt); } catch { }
            trimmed = trimmed.slice(0, -1);
        }

        throw new Error('JSON 数据不完整，无法自动修复');
    }

    /** Walk JSON string char-by-char, close any unclosed brackets/braces/strings */
    function _autoCloseJSON(s) {
        const stack = [];
        let inStr = false, esc = false;
        for (let i = 0; i < s.length; i++) {
            const c = s[i];
            if (esc) { esc = false; continue; }
            if (c === '\\' && inStr) { esc = true; continue; }
            if (c === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (c === '{' || c === '[') stack.push(c);
            else if (c === '}' || c === ']') stack.pop();
        }
        let result = s;
        if (inStr) result += '"';
        result = result.replace(/,\s*$/, '');
        while (stack.length) {
            const open = stack.pop();
            result = result.replace(/,\s*$/, '');
            result += (open === '{') ? '}' : ']';
        }
        return result;
    }

    /* ========== 历史记录 ========== */

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch { return []; }
    }

    function _saveToHistory(params, tripData) {
        const history = getHistory();
        history.unshift({
            id: Date.now().toString(36),
            createdAt: new Date().toISOString(),
            params,
            title: tripData.meta?.title || `${params.departure} → ${params.destination}`,
            days: tripData.meta?.totalDays || params.days,
            data: tripData,
        });
        // Keep last 20
        if (history.length > 20) history.length = 20;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function loadFromHistory(id) {
        const item = getHistory().find(h => h.id === id);
        return item?.data || null;
    }

    function clearHistory() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /* ========== 设置 ========== */

    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        } catch { return {}; }
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    /* ========== User Prompt Builder (mirror of server side) ========== */

    function _buildUserPrompt(params) {
        const lines = [];
        lines.push(`请为以下旅行需求规划详细行程：`);
        lines.push('');
        lines.push(`出发地：${params.departure || '未指定'}`);
        lines.push(`目的地：${params.destination || '未指定'}`);
        lines.push(`出发日期：${params.startDate || '近期'}`);
        lines.push(`行程天数：${params.days || 3}天`);
        lines.push(`是否往返：${params.roundTrip ? '是（需要返回出发地）' : '否（单程）'}`);
        if (params.adults) lines.push(`成人人数：${params.adults}`);
        if (params.children) lines.push(`儿童人数：${params.children}（年龄：${params.childAge || '未知'}岁）`);
        if (params.rooms) lines.push(`房间数：${params.rooms}间`);
        if (params.preferences?.length) lines.push(`出行偏好：${params.preferences.join('、')}`);
        if (params.transport === 'self-drive') {
            lines.push(`交通方式：自驾`);
            if (params.fuelConsumption) lines.push(`百公里油耗：${params.fuelConsumption}L`);
        } else if (params.transport === 'train') {
            lines.push(`交通方式：高铁+租车`);
        }
        const budgetMap = { economy: '经济型', comfortable: '舒适型', luxury: '高端' };
        if (params.budget) lines.push(`预算水平：${budgetMap[params.budget] || params.budget}`);
        if (params.notes) lines.push(`特别要求：${params.notes}`);
        lines.push('');
        lines.push('请生成完整的行程规划 JSON。');
        return lines.join('\n');
    }

    /* ========== Built-in System Prompt (for direct mode) ========== */

    function _getBuiltinSystemPrompt() {
        return `你是专业旅游行程规划师。根据用户需求生成行程JSON。

**规则：**
1. 只返回纯JSON，不要markdown格式、不要换行符（minified JSON）
2. 坐标用GCJ-02（高德），格式[经度,纬度]
3. 文字保持精简：intro/tips/pitfalls每项最多1-2句话
4. route.coords只放起点、终点和途经点坐标（3-5个点即可），不要放完整路线

JSON结构：
{"meta":{"title","subtitle","route","travelers","startDate","endDate","totalDays","stats":{"totalDistance","totalDriving","tollFees","fuelCost"},"budget":{"range":[min,max],"includes"},"schedule":{"departure","midpoint","return"}},"routeColors":[7个颜色],"keyPoints":[[lng,lat]...],"days":[{"day","date","weekday","theme","tags":[],"weather":{"condition","low","high"},"highlights":[],"departure","hotel":{"name","landmark"},"driving":{"distance","duration","toll","fuel"},"route":{"start":{"name","coords":[lng,lat]},"end":{"name","coords":[lng,lat]},"waypoints":[{"name","coords"}],"coords":[[lng,lat]...]},"timeline":[{"time","event"}],"attractions":[{"name","level","ticket","intro","tips","pitfalls","childTips"}],"meals":[{"type","suggestion","budget"}],"costBreakdown":{"routes":[{"segment","distance","toll","fuel"}],"budget":{分类:金额},"totalRange":[min,max]}}]}`;
    }

    /* ========== 导出 ========== */
    return {
        generate,
        getHistory,
        loadFromHistory,
        clearHistory,
        getSettings,
        saveSettings,
    };

})();
