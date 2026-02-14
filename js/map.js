/**
 * 旅游规划助手 — 高德地图集成模块
 *
 * 功能：
 *  - 总览地图（全路线按天分色）
 *  - 每日地图（当日路线 + POI 标注）
 *  - 无 AMap SDK 时的优雅降级
 */

const TripMap = (() => {

    /* ---------- 内部状态 ---------- */
    let _overviewMap = null;
    let _dayMap = null;

    /* ---------- 公共方法 ---------- */

    /**
     * 渲染总览地图 (海报风格)
     * @param {string} containerId  DOM 容器 id
     * @param {Object} tripData     当前行程数据
     */
    function renderOverview(containerId, tripData) {
        const el = document.getElementById(containerId);
        if (!el || !tripData) return;

        // Poster Style Colors: Vibrant Rainbow Road
        const DAY_COLORS = (tripData.routeColors || ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0ea5e9', '#ec4899']);

        if (!window.AMap) {
            _showPlaceholder(el, '配置高德地图 JS API Key 后即可显示路线地图');
            return;
        }

        _overviewMap = new AMap.Map(containerId, {
            zoom: 6,
            center: [115.0, 38.0],
            mapStyle: 'amap://styles/whitesmoke',
            features: ['bg', 'road', 'point'] // Hide default buildings to reduce noise
        });

        // 1. 添加顶部悬浮标题
        _addHeaderOverlay(el, tripData);

        // 2. 绘制 "彩虹路"
        const allPoints = [];
        tripData.days.forEach((day, i) => {
            const points = _collectDayCoords(day);
            if (points.length < 1) return;
            allPoints.push(...points);

            // 路线折线 (Bold & Vibrant)
            if (points.length >= 2) {
                new AMap.Polyline({
                    path: points,
                    strokeColor: DAY_COLORS[i % DAY_COLORS.length],
                    strokeWeight: 8, // Thicker line
                    strokeOpacity: 0.9,
                    lineJoin: 'round',
                    lineCap: 'round',
                    zIndex: 10,
                    map: _overviewMap
                });

                // 3. 路程时长胶囊 (Duration Pill)
                // 显示在每一天路线的中间位置
                if (day.driving && day.driving.duration) {
                    const midPt = points[Math.floor(points.length / 2)];
                    _addDurationMarker(_overviewMap, midPt, day.driving.duration);
                }
            }

            // 4. 城市卡片标记 (City Card)
            // 起点 (D1 only)
            if (i === 0 && day.route && day.route.start) {
                _addCityMarker(_overviewMap, day.route.start.coords, {
                    day: '起点',
                    name: day.route.start.name,
                    sub: '出发'
                });
            }

            // 每一天的终点 (City Card)
            if (day.route && day.route.end) {
                _addCityMarker(_overviewMap, day.route.end.coords, {
                    day: `D${day.day}`,
                    name: day.hotel && day.hotel.name && day.hotel.name !== '未定' ? day.hotel.name : (day.route.end.name || '住宿点'),
                    sub: day.hotel && day.hotel.landmark ? `近${day.hotel.landmark}` : ''
                });
            }
        });

        // 自适应视野
        if (allPoints.length > 0) {
            _overviewMap.setFitView(null, false, [100, 60, 60, 60]); // More padding top for header
        }
    }

    /**
     * 渲染每日地图
     * @param {string} containerId  DOM 容器 id
     * @param {number} dayIndex     天索引（0-based）
     * @param {Object} tripData     当前行程数据
     */
    function renderDay(containerId, dayIndex, tripData) {
        const el = document.getElementById(containerId);
        if (!el || !tripData) return;

        const DAY_COLORS = (tripData.routeColors || ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0ea5e9', '#ec4899']);

        const day = tripData.days[dayIndex];
        if (!day) return;

        if (!window.AMap) {
            _showPlaceholder(el, `D${day.day} 路线地图（需配置高德 Key）`);
            return;
        }

        _dayMap = new AMap.Map(containerId, {
            zoom: 10,
            mapStyle: 'amap://styles/whitesmoke',
            features: ['bg', 'road', 'building', 'point']
        });

        const points = _collectDayCoords(day);
        const color = DAY_COLORS[dayIndex % DAY_COLORS.length];

        // 路线折线
        if (points.length >= 2) {
            new AMap.Polyline({
                path: points,
                strokeColor: color,
                strokeWeight: 8,
                strokeOpacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round',
                showDir: true,
                zIndex: 10,
                map: _dayMap
            });

            // 添加时长胶囊
            if (day.driving && day.driving.duration) {
                const midPt = points[Math.floor(points.length / 2)];
                _addDurationMarker(_dayMap, midPt, day.driving.duration);
            }
        }

        // 起点
        if (day.route && day.route.start) {
            _addCityMarker(_dayMap, day.route.start.coords, {
                day: '始',
                name: day.route.start.name
            });
        }

        // 途经点 (Regular Marker)
        if (day.route && day.route.waypoints) {
            day.route.waypoints.forEach((wp, idx) => {
                _addMarker(_dayMap, wp.coords, String(idx + 1), color, wp.name);
            });
        }

        // 终点
        if (day.route && day.route.end) {
            _addCityMarker(_dayMap, day.route.end.coords, {
                day: '终',
                name: day.route.end.name || '住宿点',
                sub: day.hotel && day.hotel.landmark ? `近${day.hotel.landmark}` : ''
            });
        }

        // 自适应视野
        if (points.length > 0) {
            _dayMap.setFitView(null, false, [60, 60, 60, 60]);
        }
    }

    /** 销毁地图实例 */
    function destroy() {
        if (_overviewMap) { _overviewMap.destroy(); _overviewMap = null; }
        if (_dayMap) { _dayMap.destroy(); _dayMap = null; }
    }

    /* ---------- 内部工具 ---------- */

    function _collectDayCoords(day) {
        const pts = [];
        if (day.route) {
            if (day.route.start) pts.push(day.route.start.coords);
            if (day.route.waypoints) day.route.waypoints.forEach(wp => pts.push(wp.coords));
            if (day.route.end) pts.push(day.route.end.coords);
        }
        return pts;
    }

    // New: Custom "City Card" Marker
    function _addCityMarker(map, coords, { day, name, sub }) {
        if (!coords) return;
        const content = `
            <div class="map-marker-city">
                <div class="map-marker-city__day">${day}</div>
                <div class="map-marker-city__name">${name}</div>
                ${sub ? `<div class="map-marker-city__sub">${sub}</div>` : ''}
            </div>
        `;
        return new AMap.Marker({
            position: coords,
            content: content,
            offset: new AMap.Pixel(0, 0), // Base styling handles transform
            zIndex: 100, // Top of lines
            map: map
        });
    }

    // New: "Duration Pill" Marker
    function _addDurationMarker(map, coords, durationText) {
        if (!coords) return;
        const content = `<div class="map-marker-duration">🚗 ${durationText}</div>`;
        return new AMap.Marker({
            position: coords,
            content: content,
            offset: new AMap.Pixel(0, 0),
            zIndex: 90,
            map: map
        });
    }

    // New: Header Overlay
    function _addHeaderOverlay(parentElement, tripData) {
        // Remove existing if any
        const existing = parentElement.querySelector('.map-header-overlay');
        if (existing) existing.remove();

        const m = tripData.meta || {};
        const stats = m.stats || {};

        // Find departure and destination manually if route string is complex
        // Or just use the title/route logic
        let titleText = m.title || '行程规划';

        const overlay = document.createElement('div');
        overlay.className = 'map-header-overlay';
        overlay.innerHTML = `
            <div class="map-header-overlay__title">${titleText}</div>
            <div class="map-header-overlay__badge">
                ${m.totalDays || tripData.days.length}天 · ${stats.totalDistance || '?'}km
            </div>
        `;
        parentElement.appendChild(overlay);
    }

    // Classic Marker Helper (kept for waypoints)
    function _addMarker(map, coords, label, color, title) {
        const content = `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    ">${label}</div>`;

        const marker = new AMap.Marker({
            position: coords,
            content: content,
            offset: new AMap.Pixel(-12, -12),
            map: map,
            title: title || ''
        });

        if (title) {
            marker.setLabel({
                content: `<span style="font-size:11px;color:#333;background:#fff;padding:2px 6px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.15);white-space:nowrap;">${title}</span>`,
                offset: new AMap.Pixel(0, -32),
                direction: 'top'
            });
        }

        return marker;
    }

    function _showPlaceholder(el, text) {
        el.innerHTML = `
      <div class="map-placeholder">
        <div class="map-placeholder__icon">🗺️</div>
        <div class="map-placeholder__text">${text}</div>
      </div>`;
    }

    /* ---------- 导出 ---------- */
    return { renderOverview, renderDay, destroy };

})();
