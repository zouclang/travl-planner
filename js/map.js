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
    const DAY_COLORS = TRIP_DATA.routeColors;

    /* ---------- 公共方法 ---------- */

    /**
     * 渲染总览地图
     * @param {string} containerId  DOM 容器 id
     */
    function renderOverview(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!window.AMap) {
            _showPlaceholder(el, '配置高德地图 JS API Key 后即可显示路线地图');
            return;
        }

        _overviewMap = new AMap.Map(containerId, {
            zoom: 6,
            center: [115.0, 38.0],
            mapStyle: 'amap://styles/whitesmoke',
            features: ['bg', 'road', 'building', 'point']
        });

        // 绘制各天路线
        const allPoints = [];
        TRIP_DATA.days.forEach((day, i) => {
            const points = _collectDayCoords(day);
            allPoints.push(...points);

            // 路线折线
            if (points.length >= 2) {
                new AMap.Polyline({
                    path: points,
                    strokeColor: DAY_COLORS[i % DAY_COLORS.length],
                    strokeWeight: 4,
                    strokeOpacity: 0.85,
                    lineJoin: 'round',
                    lineCap: 'round',
                    map: _overviewMap
                });
            }

            // 起点标记
            const startPt = points[0];
            if (startPt) {
                _addMarker(_overviewMap, startPt, `D${day.day}`, DAY_COLORS[i % DAY_COLORS.length]);
            }
        });

        // 终点标记（最后一天终点）
        const lastDay = TRIP_DATA.days[TRIP_DATA.days.length - 1];
        if (lastDay && lastDay.route && lastDay.route.end) {
            _addMarker(_overviewMap, lastDay.route.end.coords, '终', '#6b7280');
        }

        // 自适应视野
        if (allPoints.length > 0) {
            _overviewMap.setFitView(null, false, [60, 60, 60, 60]);
        }
    }

    /**
     * 渲染每日地图
     * @param {string} containerId  DOM 容器 id
     * @param {number} dayIndex     天索引（0-based）
     */
    function renderDay(containerId, dayIndex) {
        const el = document.getElementById(containerId);
        if (!el) return;

        const day = TRIP_DATA.days[dayIndex];
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
                strokeWeight: 5,
                strokeOpacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round',
                showDir: true,
                map: _dayMap
            });
        }

        // 标记起点
        if (day.route && day.route.start) {
            _addMarker(_dayMap, day.route.start.coords, '始', color, day.route.start.name);
        }

        // 标记途经点
        if (day.route && day.route.waypoints) {
            day.route.waypoints.forEach((wp, idx) => {
                _addMarker(_dayMap, wp.coords, String(idx + 1), color, wp.name);
            });
        }

        // 标记终点
        if (day.route && day.route.end) {
            _addMarker(_dayMap, day.route.end.coords, '终', '#6b7280', day.route.end.name);
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

    function _addMarker(map, coords, label, color, title) {
        const content = `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    ">${label}</div>`;

        const marker = new AMap.Marker({
            position: coords,
            content: content,
            offset: new AMap.Pixel(-13, -13),
            map: map,
            title: title || ''
        });

        if (title) {
            marker.setLabel({
                content: `<span style="font-size:12px;color:#333;background:#fff;padding:2px 6px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.15);white-space:nowrap;">${title}</span>`,
                offset: new AMap.Pixel(0, -36),
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
