/**
 * 旅游规划助手 — PDF 导出模块
 *
 * 使用 html2pdf.js 将行程数据渲染为可下载的 PDF
 * 备用方案：浏览器打印（Ctrl+P / Cmd+P 另存为 PDF）
 */

const TripPDF = (() => {

  /**
   * 生成 PDF 并触发下载
   * @param {Object} tripData — 完整行程数据
   */
  async function exportPDF(tripData) {
    if (!tripData) return alert('暂无行程数据');

    // 检查 html2pdf 是否可用
    if (typeof html2pdf === 'undefined') {
      _fallbackPrint(tripData);
      return;
    }

    // 1. 隐藏当前页面内容，只保留渲染容器
    const appContainer = document.querySelector('.app-container');
    const fab = document.getElementById('fab-back');
    const originalDisplay = appContainer.style.display;
    const fabDisplay = fab ? fab.style.display : '';
    appContainer.style.display = 'none';
    if (fab) fab.style.display = 'none';

    // 2. 创建渲染容器 — 直接在 body 中，正常文档流，html2canvas 100% 能捕获
    const container = document.createElement('div');
    container.id = 'pdf-render-container';
    container.style.cssText = 'width:794px;margin:0 auto;background:#fff;font-family:"PingFang SC","Microsoft YaHei",system-ui,-apple-system,sans-serif;color:#1a1a1a;font-size:13px;line-height:1.6;padding:20px;';
    container.innerHTML = _buildPrintHTML(tripData);
    document.body.appendChild(container);

    // 3. 显示进度提示
    const progressEl = document.createElement('div');
    progressEl.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#2563eb;color:#fff;text-align:center;padding:10px;font-size:14px;z-index:99999;';
    progressEl.textContent = '📄 正在生成 PDF，请勿操作…';
    document.body.appendChild(progressEl);

    // 4. 等待浏览器完成布局和渲染
    await new Promise(r => setTimeout(r, 500));
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 200));

    try {
      const filename = `${(tripData.meta?.title || '行程规划').replace(/[\\/:*?"<>|]/g, '_')}.pdf`;

      await html2pdf().set({
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'], before: '.pdf-page-break' },
      }).from(container).save();

      progressEl.textContent = '✅ PDF 已保存！';
      progressEl.style.background = '#16a34a';
      setTimeout(() => progressEl.remove(), 2000);
    } catch (err) {
      console.error('PDF export error:', err);
      progressEl.textContent = '❌ 导出失败，正在尝试备用方案…';
      progressEl.style.background = '#dc2626';
      setTimeout(() => {
        progressEl.remove();
        _fallbackPrint(tripData);
      }, 1500);
    } finally {
      // 5. 恢复页面
      document.body.removeChild(container);
      appContainer.style.display = originalDisplay;
      if (fab) fab.style.display = fabDisplay;
    }
  }

  /* ==================== 备用方案：浏览器打印 ==================== */

  function _fallbackPrint(tripData) {
    const html = _buildPrintHTML(tripData);
    const win = window.open('', '_blank');
    if (!win) {
      alert('弹窗被拦截，请允许弹窗后重试');
      return;
    }
    win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>${tripData.meta?.title || '行程规划'} — PDF</title>
<style>
body { font-family: "PingFang SC","Microsoft YaHei",system-ui,sans-serif; color:#1a1a1a; font-size:13px; line-height:1.6; padding:20px; max-width:800px; margin:0 auto; }
table { width:100%; border-collapse:collapse; }
td, th { border:1px solid #ddd; padding:6px 8px; }
.pdf-page-break { page-break-before:always; }
@media print { body { padding:0; } }
</style>
</head><body>${html}
<script>setTimeout(function(){window.print();},500);<\/script>
</body></html>`);
    win.document.close();
  }

  /* ==================== 构建打印用 HTML ==================== */

  function _buildPrintHTML(d) {
    const m = d.meta || {};
    const s = m.stats || {};
    const budget = m.budget || {};
    const schedule = m.schedule || {};

    let html = '';

    // ======= 封面 & 总览 =======
    html += `
      <div style="text-align:center;padding:40px 0 20px;border-bottom:3px solid #2563eb;">
        <div style="font-size:26px;font-weight:700;color:#0c1d3a;">${m.title || '行程规划'}</div>
        <div style="font-size:14px;color:#666;margin-top:6px;">${m.subtitle || ''}</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">${m.route || ''} | ${m.travelers || ''}</div>
      </div>

      <table style="margin:16px 0;" cellpadding="8">
        <tr style="background:#f0f4ff;">
          <td style="text-align:center;"><strong>全程里程</strong><br>${s.totalDistance || '-'} km</td>
          <td style="text-align:center;"><strong>驾驶时长</strong><br>${s.totalDriving || '-'}</td>
          <td style="text-align:center;"><strong>过路费</strong><br>${s.tollFees || 0} 元</td>
          <td style="text-align:center;"><strong>油费</strong><br>${s.fuelCost || 0} 元</td>
        </tr>
      </table>

      <div style="background:#f8fafc;padding:10px 14px;border-radius:6px;margin-bottom:8px;">
        <strong>预算合计：</strong>${(budget.range && budget.range[0]) || 0} – ${(budget.range && budget.range[1]) || 0} 元
        ${budget.includes ? `<span style="color:#888;margin-left:8px;">(${budget.includes})</span>` : ''}
      </div>

      <table style="margin-bottom:20px;" cellpadding="4">
        <tr>
          <td style="border:none;">📅 ${schedule.departure || '-'}</td>
          <td style="border:none;">📍 ${schedule.midpoint || '-'}</td>
          <td style="border:none;">🏠 ${schedule.return || '-'}</td>
        </tr>
      </table>
    `;

    // ======= 每日行程 =======
    (d.days || []).forEach((day, i) => {
      const weather = day.weather || {};
      const driving = day.driving || {};
      const hotel = day.hotel || {};

      // 每天分页（第一天除外）
      html += `<div class="${i > 0 ? 'pdf-page-break' : ''}">`;

      // 日期头
      html += `
          <div style="background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;margin-top:${i === 0 ? '12px' : '0'};">
            <span style="font-size:18px;font-weight:700;margin-right:8px;">D${day.day || (i + 1)}</span>
            <span>${day.date || ''} (${day.weekday || ''})</span>
            <span style="float:right;font-size:12px;opacity:0.9;">${day.theme || ''}</span>
          </div>
      `;

      // 概览信息
      html += `
          <table style="font-size:12px;" cellpadding="6">
            <tr style="background:#f7f9fc;">
              <td>🌤️ ${weather.condition || '-'}，${weather.low || '?'}℃～${weather.high || '?'}℃</td>
              <td>⏰ 出发 ${day.departure || '-'}</td>
              <td>🏨 ${hotel.name || '未定'}</td>
              <td>🚗 ${driving.distance || '-'}km / ${driving.duration || '-'}</td>
            </tr>
          </table>
      `;

      // 时间轴
      const timeline = day.timeline || [];
      if (timeline.length) {
        html += `<div style="margin:10px 0 4px;font-weight:700;font-size:13px;">📋 时间轴</div>`;
        html += `<table style="font-size:12px;" cellpadding="4">`;
        timeline.forEach(item => {
          html += `<tr>
            <td style="width:70px;color:#2563eb;font-weight:600;border:none;border-bottom:1px solid #f0f0f0;">${item.time || ''}</td>
            <td style="border:none;border-bottom:1px solid #f0f0f0;">${item.event || ''}</td>
          </tr>`;
        });
        html += `</table>`;
      }

      // 景点
      const attractions = day.attractions || [];
      if (attractions.length) {
        html += `<div style="margin:12px 0 6px;font-weight:700;font-size:13px;">🏞️ 景点攻略</div>`;
        attractions.forEach(a => {
          html += `
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:8px;">
              <div style="font-weight:600;font-size:13px;">${a.name || '景点'} <span style="color:#888;font-weight:normal;font-size:11px;">${a.level || ''}</span></div>
              <div style="font-size:11px;color:#666;margin-top:2px;">🎫 ${a.ticket || '未知'}</div>
              ${a.intro ? `<div style="margin-top:4px;font-size:12px;">📝 ${a.intro}</div>` : ''}
              ${a.tips ? `<div style="margin-top:2px;font-size:12px;">💡 ${a.tips}</div>` : ''}
              ${a.pitfalls ? `<div style="margin-top:2px;font-size:12px;color:#b45309;">⚠️ ${a.pitfalls}</div>` : ''}
              ${a.childTips ? `<div style="margin-top:2px;font-size:12px;color:#7c3aed;">👶 ${a.childTips}</div>` : ''}
            </div>
          `;
        });
      }

      // 用餐
      const meals = day.meals || [];
      if (meals.length) {
        html += `<div style="margin:12px 0 6px;font-weight:700;font-size:13px;">🍽️ 用餐建议</div>`;
        html += `<table style="font-size:12px;" cellpadding="5">`;
        meals.forEach(ml => {
          html += `<tr>
            <td style="width:60px;font-weight:600;">${ml.type || ''}</td>
            <td>${ml.suggestion || ''}</td>
            <td style="width:60px;text-align:right;">¥${ml.budget || '?'}</td>
          </tr>`;
        });
        html += `</table>`;
      }

      // 费用
      const cb = day.costBreakdown;
      if (cb) {
        html += `<div style="margin:12px 0 6px;font-weight:700;font-size:13px;">💰 当日费用</div>`;

        if (cb.routes && cb.routes.length) {
          html += `<table style="font-size:12px;" cellpadding="5">
            <thead><tr style="background:#f0f4ff;"><th style="text-align:left;">路段</th><th style="text-align:right;">距离</th><th style="text-align:right;">过路费</th><th style="text-align:right;">油费</th></tr></thead><tbody>`;
          cb.routes.forEach(r => {
            html += `<tr><td>${r.segment || ''}</td><td style="text-align:right;">${r.distance || 0}km</td><td style="text-align:right;">${r.toll || 0}元</td><td style="text-align:right;">${r.fuel || 0}元</td></tr>`;
          });
          html += `</tbody></table>`;
        }

        if (cb.budget) {
          const entries = Object.entries(cb.budget);
          if (entries.length) {
            html += `<table style="font-size:11px;margin-top:6px;" cellpadding="3"><tr>`;
            entries.forEach(([k, v]) => {
              html += `<td style="background:#f1f5f9;border-radius:4px;">${k}：${v === 0 ? '—' : v + '元'}</td>`;
            });
            html += `</tr></table>`;
          }
        }

        if (cb.totalRange) {
          html += `<div style="margin-top:6px;font-weight:600;font-size:13px;color:#2563eb;">当日合计：${cb.totalRange[0] || 0} – ${cb.totalRange[1] || 0} 元</div>`;
        }
      }

      html += `</div>`; // close day container
    });

    // ======= 页脚 =======
    html += `
      <div style="text-align:center;margin-top:24px;padding:12px 0;border-top:1px solid #ddd;font-size:11px;color:#999;">
        AI 旅游规划助手 · 由 AI 生成 · 导出时间：${new Date().toLocaleString('zh-CN')}
      </div>
    `;

    return html;
  }

  /* ==================== 导出 ==================== */
  return { exportPDF };

})();
