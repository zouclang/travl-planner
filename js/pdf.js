/**
 * 旅游规划助手 — PDF 导出模块
 *
 * 使用浏览器原生打印功能生成 PDF（最可靠的方案）
 * 用户在打印对话框中选择「另存为 PDF」即可
 */

const TripPDF = (() => {

  function exportPDF(tripData) {
    if (!tripData) return alert('暂无行程数据');

    const html = _buildFullHTML(tripData);

    // 打开新窗口用于打印
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) {
      alert('弹窗被浏览器拦截！请点击地址栏右侧允许弹窗，然后重试。');
      return;
    }

    win.document.write(html);
    win.document.close();
  }

  /* ==================== 构建完整 HTML 页面 ==================== */

  function _buildFullHTML(d) {
    const m = d.meta || {};
    const s = m.stats || {};
    const budget = m.budget || {};
    const schedule = m.schedule || {};

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${m.title || '行程规划'}</title>
<style>
    @page {
        size: A4;
        margin: 15mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", system-ui, sans-serif;
        color: #222;
        font-size: 13px;
        line-height: 1.7;
        background: #fff;
        padding: 20px;
        max-width: 760px;
        margin: 0 auto;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 6px 0;
    }
    td, th {
        border: 1px solid #d0d0d0;
        padding: 6px 8px;
        vertical-align: top;
    }

    /* 封面 */
    .cover {
        text-align: center;
        padding: 36px 0 20px;
        border-bottom: 3px solid #2563eb;
        margin-bottom: 16px;
    }
    .cover h1 { font-size: 24px; color: #0c1d3a; margin-bottom: 6px; }
    .cover .sub { font-size: 13px; color: #666; }
    .cover .route { font-size: 12px; color: #999; margin-top: 4px; }

    /* 统计 */
    .stats td { text-align: center; background: #f0f4ff; font-size: 12px; }
    .stats strong { display: block; margin-bottom: 2px; }

    /* 预算 */
    .budget-box {
        background: #f8fafc;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        margin: 10px 0;
        font-size: 13px;
    }
    .schedule { font-size: 12px; color: #555; margin-bottom: 10px; }

    /* 每日 */
    .day-section { margin-top: 12px; }
    .day-header {
        background: linear-gradient(135deg, #2563eb, #0ea5e9);
        color: #fff;
        padding: 10px 14px;
        border-radius: 6px 6px 0 0;
        font-size: 14px;
    }
    .day-header .num { font-size: 18px; font-weight: 700; margin-right: 6px; }
    .day-header .theme { float: right; font-size: 11px; opacity: 0.85; margin-top: 4px; }
    .day-info td { font-size: 12px; background: #f7f9fc; }

    .sec-title {
        font-weight: 700;
        font-size: 13px;
        margin: 10px 0 4px;
        color: #333;
    }

    /* 时间轴 */
    .timeline td { border: none; border-bottom: 1px solid #eee; font-size: 12px; padding: 4px 6px; }
    .timeline .tcol { width: 60px; color: #2563eb; font-weight: 600; }

    /* 景点卡片 */
    .att-card {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 8px 10px;
        margin-bottom: 6px;
        font-size: 12px;
        page-break-inside: avoid;
    }
    .att-card .att-name { font-weight: 600; font-size: 13px; }
    .att-card .att-level { color: #888; font-size: 11px; }
    .att-card .att-detail { margin-top: 3px; font-size: 12px; line-height: 1.6; }
    .att-card .warn { color: #b45309; }
    .att-card .child { color: #7c3aed; }

    /* 用餐 */
    .meal-tbl td { font-size: 12px; }

    /* 费用 */
    .cost-tbl th { font-size: 12px; background: #f0f4ff; text-align: left; }
    .cost-tbl td { font-size: 12px; }
    .cost-summary { font-size: 12px; color: #555; margin-top: 4px; }
    .day-total {
        font-weight: 600;
        font-size: 13px;
        color: #2563eb;
        margin: 6px 0 10px;
    }

    /* 页脚 */
    .footer {
        text-align: center;
        margin-top: 24px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
        font-size: 11px;
        color: #aaa;
    }

    /* 打印分页 */
    .page-break { page-break-before: always; }

    /* 打印按钮 */
    .print-bar {
        background: #2563eb;
        color: #fff;
        padding: 12px;
        text-align: center;
        font-size: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        cursor: pointer;
    }
    .print-bar:hover { background: #1d4ed8; }
    .print-hint {
        text-align: center;
        font-size: 12px;
        color: #888;
        margin-bottom: 16px;
    }
    @media print {
        .print-bar, .print-hint { display: none !important; }
        body { padding: 0; max-width: none; }
    }
</style>
</head>
<body>

<div class="print-bar" onclick="window.print();">📄 点击此处打印 / 保存为 PDF</div>
<div class="print-hint">💡 在打印对话框中选择「目标打印机」→「另存为PDF」即可保存</div>

<!-- 封面 -->
<div class="cover">
    <h1>${m.title || '行程规划'}</h1>
    <div class="sub">${m.subtitle || ''}</div>
    <div class="route">${m.route || ''} · ${m.travelers || ''}</div>
</div>

<!-- 统计 -->
<table class="stats">
    <tr>
        <td><strong>全程里程</strong>${s.totalDistance || '-'} km</td>
        <td><strong>驾驶时长</strong>${s.totalDriving || '-'}</td>
        <td><strong>过路费</strong>${s.tollFees || 0} 元</td>
        <td><strong>油费</strong>${s.fuelCost || 0} 元</td>
    </tr>
</table>

<!-- 预算 -->
<div class="budget-box">
    <strong>预算合计：</strong>${(budget.range?.[0]) || 0} – ${(budget.range?.[1]) || 0} 元
    ${budget.includes ? ` (${budget.includes})` : ''}
</div>

<!-- 日程 -->
<div class="schedule">
    📅 ${schedule.departure || '-'} &nbsp;·&nbsp; 📍 ${schedule.midpoint || '-'} &nbsp;·&nbsp; 🏠 ${schedule.return || '-'}
</div>

${_buildDays(d.days || [])}

<!-- 页脚 -->
<div class="footer">AI 旅游规划助手 · 由 AI 生成 · ${new Date().toLocaleString('zh-CN')}</div>

</body>
</html>`;
  }

  /* ==================== 构建每日行程 ==================== */

  function _buildDays(days) {
    return days.map((day, i) => {
      const w = day.weather || {};
      const dr = day.driving || {};
      const ht = day.hotel || {};
      let h = '';

      if (i > 0) h += `<div class="page-break"></div>`;

      h += `<div class="day-section">`;

      // 日期头
      h += `<div class="day-header">
                <span class="num">D${day.day || (i + 1)}</span>
                ${day.date || ''} (${day.weekday || ''})
                <span class="theme">${day.theme || ''}</span>
            </div>`;

      // 概览
      h += `<table class="day-info"><tr>
                <td style="width:25%">🌤️ ${w.condition || '-'} ${w.low || '?'}~${w.high || '?'}℃</td>
                <td style="width:25%">⏰ ${day.departure || '-'}</td>
                <td style="width:25%">🏨 ${ht.name || '未定'}</td>
                <td style="width:25%">🚗 ${dr.distance || '-'}km / ${dr.duration || ''}</td>
            </tr></table>`;

      // 时间轴
      const tl = day.timeline || [];
      if (tl.length) {
        h += `<div class="sec-title">📋 时间轴</div>`;
        h += `<table class="timeline">`;
        tl.forEach(t => {
          h += `<tr><td class="tcol">${t.time || ''}</td><td>${t.event || ''}</td></tr>`;
        });
        h += `</table>`;
      }

      // 景点
      const att = day.attractions || [];
      if (att.length) {
        h += `<div class="sec-title">🏞️ 景点攻略</div>`;
        att.forEach(a => {
          h += `<div class="att-card">
                        <div><span class="att-name">${a.name || ''}</span> <span class="att-level">${a.level || ''}</span> · 🎫 ${a.ticket || '免费'}</div>
                        ${a.intro ? `<div class="att-detail">📝 ${a.intro}</div>` : ''}
                        ${a.tips ? `<div class="att-detail">💡 ${a.tips}</div>` : ''}
                        ${a.pitfalls ? `<div class="att-detail warn">⚠️ ${a.pitfalls}</div>` : ''}
                        ${a.childTips ? `<div class="att-detail child">👶 ${a.childTips}</div>` : ''}
                    </div>`;
        });
      }

      // 用餐
      const meals = day.meals || [];
      if (meals.length) {
        h += `<div class="sec-title">🍽️ 用餐建议</div>`;
        h += `<table class="meal-tbl">`;
        meals.forEach(ml => {
          h += `<tr>
                        <td style="width:15%;font-weight:600">${ml.type || ''}</td>
                        <td>${ml.suggestion || ''}</td>
                        <td style="width:15%;text-align:right">¥${ml.budget || '?'}</td>
                    </tr>`;
        });
        h += `</table>`;
      }

      // 费用
      const cb = day.costBreakdown;
      if (cb) {
        h += `<div class="sec-title">💰 当日费用</div>`;
        if (cb.routes?.length) {
          h += `<table class="cost-tbl">
                        <tr><th>路段</th><th style="width:18%;text-align:right">距离</th><th style="width:18%;text-align:right">过路费</th><th style="width:18%;text-align:right">油费</th></tr>`;
          cb.routes.forEach(r => {
            h += `<tr><td>${r.segment || ''}</td><td style="text-align:right">${r.distance || 0}km</td><td style="text-align:right">${r.toll || 0}元</td><td style="text-align:right">${r.fuel || 0}元</td></tr>`;
          });
          h += `</table>`;
        }
        if (cb.budget) {
          const entries = Object.entries(cb.budget);
          if (entries.length) {
            h += `<div class="cost-summary">`;
            h += entries.map(([k, v]) => `${k}：${v === 0 ? '—' : v + '元'}`).join(' · ');
            h += `</div>`;
          }
        }
        if (cb.totalRange) {
          h += `<div class="day-total">当日合计：${cb.totalRange[0] || 0} – ${cb.totalRange[1] || 0} 元</div>`;
        }
      }

      h += `</div>`; // day-section
      return h;
    }).join('\n');
  }

  return { exportPDF };
})();
