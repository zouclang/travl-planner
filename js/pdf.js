/**
 * 旅游规划助手 — PDF 导出模块
 *
 * 使用 html2pdf.js 将行程数据渲染为可下载的 PDF
 */

const TripPDF = (() => {

  /**
   * 生成 PDF 并触发下载
   * @param {Object} tripData — 完整行程数据
   */
  async function exportPDF(tripData) {
    if (!tripData) return alert('暂无行程数据');

    // 显示遮罩 + 提示
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.95);z-index:9997;display:flex;align-items:center;justify-content:center;font-size:16px;color:#333;';
    overlay.innerHTML = '<div style="text-align:center;"><div style="font-size:32px;margin-bottom:12px;">📄</div>正在生成 PDF，请稍候…</div>';
    document.body.appendChild(overlay);

    try {
      // 创建渲染容器 — 必须在可视区域内，html2canvas 才能捕获
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:0;top:0;width:800px;z-index:9998;overflow:auto;background:#fff;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;font-size:13px;line-height:1.6;padding:16px;opacity:0;pointer-events:none;';
      container.innerHTML = _buildPrintHTML(tripData);
      document.body.appendChild(container);

      // 等待 DOM 渲染完成
      await new Promise(r => setTimeout(r, 300));
      // 需要让 html2canvas 看到，临时设为可见
      container.style.opacity = '1';
      await new Promise(r => setTimeout(r, 100));

      const filename = `${(tripData.meta?.title || '行程规划').replace(/\s+/g, '_')}.pdf`;

      const opt = {
        margin: [10, 12, 10, 12],
        filename,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 800 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.no-break'] },
      };

      await html2pdf().set(opt).from(container).save();

      document.body.removeChild(container);
      overlay.innerHTML = '<div style="text-align:center;"><div style="font-size:32px;margin-bottom:12px;">✅</div>PDF 已保存！</div>';
      setTimeout(() => overlay.remove(), 1500);
    } catch (err) {
      console.error('PDF export error:', err);
      overlay.innerHTML = `<div style="text-align:center;"><div style="font-size:32px;margin-bottom:12px;">❌</div>导出失败：${err.message}<br><button onclick="this.parentElement.parentElement.remove()" style="margin-top:12px;padding:8px 20px;border:none;background:#2563eb;color:#fff;border-radius:8px;cursor:pointer;">关闭</button></div>`;
    }
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
      <div style="text-align:center;padding:40px 0 20px;border-bottom:2px solid #2563eb;">
        <div style="font-size:28px;font-weight:700;color:#0c1d3a;">${m.title || '行程规划'}</div>
        <div style="font-size:14px;color:#666;margin-top:6px;">${m.subtitle || ''}</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">${m.route || ''} | ${m.travelers || ''}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;" cellpadding="8">
        <tr style="background:#f0f4ff;">
          <td style="border:1px solid #ddd;text-align:center;"><strong>全程里程</strong><br>${s.totalDistance || '-'} km</td>
          <td style="border:1px solid #ddd;text-align:center;"><strong>驾驶时长</strong><br>${s.totalDriving || '-'}</td>
          <td style="border:1px solid #ddd;text-align:center;"><strong>过路费</strong><br>${s.tollFees || 0} 元</td>
          <td style="border:1px solid #ddd;text-align:center;"><strong>油费</strong><br>${s.fuelCost || 0} 元</td>
        </tr>
      </table>

      <div style="background:#f8fafc;padding:10px 14px;border-radius:6px;margin-bottom:8px;">
        <strong>预算合计：</strong>${(budget.range && budget.range[0]) || 0} – ${(budget.range && budget.range[1]) || 0} 元
        ${budget.includes ? `<span style="color:#888;margin-left:8px;">(${budget.includes})</span>` : ''}
      </div>

      <div style="display:flex;gap:12px;margin-bottom:20px;font-size:12px;">
        <span>📅 ${schedule.departure || '-'}</span>
        <span>📍 ${schedule.midpoint || '-'}</span>
        <span>🏠 ${schedule.return || '-'}</span>
      </div>
    `;

    // ======= 每日行程 =======
    (d.days || []).forEach((day, i) => {
      const weather = day.weather || {};
      const driving = day.driving || {};
      const hotel = day.hotel || {};

      html += `
        <div style="page-break-before:${i > 0 ? 'always' : 'auto'};">
          <div style="background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;padding:12px 16px;border-radius:8px 8px 0 0;margin-top:${i === 0 ? '12px' : '0'};">
            <span style="font-size:18px;font-weight:700;margin-right:8px;">D${day.day}</span>
            <span>${day.date} (${day.weekday})</span>
            <span style="float:right;font-size:12px;opacity:0.9;">${day.theme || ''}</span>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:12px;" cellpadding="6">
            <tr style="background:#f7f9fc;">
              <td style="border:1px solid #e5e7eb;">🌤️ ${weather.condition || '-'}，${weather.low || '?'}℃～${weather.high || '?'}℃</td>
              <td style="border:1px solid #e5e7eb;">⏰ 出发 ${day.departure || '-'}</td>
              <td style="border:1px solid #e5e7eb;">🏨 ${hotel.name || '未定'}</td>
              <td style="border:1px solid #e5e7eb;">🚗 ${driving.distance || '-'}km / ${driving.duration || '-'}</td>
            </tr>
          </table>
      `;

      // 时间轴
      const timeline = day.timeline || [];
      if (timeline.length) {
        html += `<div style="margin:10px 0;"><strong style="font-size:13px;">📋 时间轴</strong></div>`;
        html += `<table style="width:100%;border-collapse:collapse;font-size:12px;" cellpadding="5">`;
        timeline.forEach(item => {
          html += `<tr>
            <td style="border-bottom:1px solid #eee;width:70px;color:#2563eb;font-weight:600;">${item.time}</td>
            <td style="border-bottom:1px solid #eee;">${item.event}</td>
          </tr>`;
        });
        html += `</table>`;
      }

      // 景点
      const attractions = day.attractions || [];
      if (attractions.length) {
        html += `<div style="margin:12px 0 6px;"><strong style="font-size:13px;">🏞️ 景点攻略</strong></div>`;
        attractions.forEach(a => {
          html += `
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:8px;">
              <div style="font-weight:600;font-size:13px;">${a.name} <span style="color:#888;font-weight:normal;font-size:11px;">${a.level || ''}</span></div>
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
        html += `<div style="margin:12px 0 6px;"><strong style="font-size:13px;">🍽️ 用餐建议</strong></div>`;
        html += `<table style="width:100%;border-collapse:collapse;font-size:12px;" cellpadding="5">`;
        meals.forEach(m => {
          html += `<tr>
            <td style="border-bottom:1px solid #eee;width:60px;font-weight:600;">${m.type}</td>
            <td style="border-bottom:1px solid #eee;">${m.suggestion}</td>
            <td style="border-bottom:1px solid #eee;width:60px;text-align:right;">¥${m.budget}</td>
          </tr>`;
        });
        html += `</table>`;
      }

      // 费用
      const cb = day.costBreakdown;
      if (cb) {
        html += `<div style="margin:12px 0 6px;"><strong style="font-size:13px;">💰 当日费用</strong></div>`;

        if (cb.routes && cb.routes.length) {
          html += `<table style="width:100%;border-collapse:collapse;font-size:12px;" cellpadding="5">
            <thead><tr style="background:#f0f4ff;"><th style="text-align:left;border:1px solid #ddd;">路段</th><th style="border:1px solid #ddd;text-align:right;">距离</th><th style="border:1px solid #ddd;text-align:right;">过路费</th><th style="border:1px solid #ddd;text-align:right;">油费</th></tr></thead><tbody>`;
          cb.routes.forEach(r => {
            html += `<tr><td style="border:1px solid #eee;">${r.segment}</td><td style="border:1px solid #eee;text-align:right;">${r.distance}km</td><td style="border:1px solid #eee;text-align:right;">${r.toll}元</td><td style="border:1px solid #eee;text-align:right;">${r.fuel}元</td></tr>`;
          });
          html += `</tbody></table>`;
        }

        if (cb.budget) {
          const entries = Object.entries(cb.budget);
          if (entries.length) {
            html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">`;
            entries.forEach(([k, v]) => {
              html += `<span style="background:#f1f5f9;padding:3px 8px;border-radius:4px;font-size:11px;">${k}：${v === 0 ? '—' : v + '元'}</span>`;
            });
            html += `</div>`;
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

  /* ==================== Toast 提示 ==================== */

  function _createToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.3s;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    return toast;
  }

  function _updateToast(toast, msg) {
    toast.textContent = msg;
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  /* ==================== 导出 ==================== */
  return { exportPDF };

})();
