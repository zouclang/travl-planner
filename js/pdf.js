/**
 * 旅游规划助手 — PDF 导出模块
 *
 * 使用 html2pdf.js 将行程数据渲染为可下载的 PDF
 * 备用方案：浏览器打印（Ctrl+P / Cmd+P 另存为 PDF）
 */

const TripPDF = (() => {

  async function exportPDF(tripData) {
    if (!tripData) return alert('暂无行程数据');

    if (typeof html2pdf === 'undefined') {
      _fallbackPrint(tripData);
      return;
    }

    // 1. 隐藏当前页面内容
    const appContainer = document.querySelector('.app-container');
    const fab = document.getElementById('fab-back');
    const originalAppDisplay = appContainer.style.display;
    const originalFabDisplay = fab ? fab.style.display : '';
    appContainer.style.display = 'none';
    if (fab) fab.style.display = 'none';

    // 2. 创建渲染容器 — 正常文档流，宽度 595px (A4 at 72dpi)
    const container = document.createElement('div');
    container.id = 'pdf-render-container';
    container.innerHTML = `
            <style>
                #pdf-render-container {
                    width: 595px;
                    margin: 0 auto;
                    background: #fff;
                    font-family: "PingFang SC","Microsoft YaHei","Helvetica Neue",system-ui,sans-serif;
                    color: #222;
                    font-size: 12px;
                    line-height: 1.65;
                    padding: 12px;
                    box-sizing: border-box;
                }
                #pdf-render-container * {
                    box-sizing: border-box;
                    max-width: 100%;
                }
                #pdf-render-container table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                #pdf-render-container td,
                #pdf-render-container th {
                    border: 1px solid #ddd;
                    padding: 5px 6px;
                    vertical-align: top;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                .pdf-title {
                    text-align: center;
                    padding: 30px 0 16px;
                    border-bottom: 3px solid #2563eb;
                    margin-bottom: 12px;
                }
                .pdf-title h1 { font-size: 22px; margin: 0; color: #0c1d3a; }
                .pdf-title p { font-size: 12px; color: #888; margin: 4px 0 0; }
                .pdf-stats td { text-align: center; background: #f0f4ff; font-size: 11px; }
                .pdf-budget { background: #f8fafc; padding: 8px 10px; border-radius: 4px; margin: 8px 0; font-size: 12px; }
                .pdf-schedule { font-size: 11px; color: #666; margin-bottom: 16px; }
                .pdf-day-header {
                    background: linear-gradient(135deg, #2563eb, #0ea5e9);
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 6px 6px 0 0;
                    font-size: 14px;
                }
                .pdf-day-header .day-num { font-size: 16px; font-weight: 700; margin-right: 6px; }
                .pdf-day-header .day-theme { float: right; font-size: 11px; opacity: 0.9; }
                .pdf-info-row td { font-size: 11px; background: #f7f9fc; }
                .pdf-section-title { font-weight: 700; font-size: 12px; margin: 8px 0 4px; }
                .pdf-timeline td { border: none; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
                .pdf-timeline .time-col { width: 55px; color: #2563eb; font-weight: 600; }
                .pdf-attraction {
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    padding: 7px 8px;
                    margin-bottom: 6px;
                    font-size: 11px;
                }
                .pdf-attraction .att-name { font-weight: 600; font-size: 12px; }
                .pdf-attraction .att-level { color: #888; font-weight: normal; font-size: 10px; }
                .pdf-meals td { font-size: 11px; }
                .pdf-cost td, .pdf-cost th { font-size: 11px; }
                .pdf-cost th { background: #f0f4ff; text-align: left; }
                .pdf-day-total { font-weight: 600; font-size: 12px; color: #2563eb; margin: 4px 0 16px; }
                .pdf-page-break { page-break-before: always; }
                .pdf-footer { text-align: center; margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 10px; color: #aaa; }
            </style>
            ${_buildPrintHTML(tripData)}
        `;
    document.body.appendChild(container);

    // 3. 进度提示
    const progress = document.createElement('div');
    progress.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#2563eb;color:#fff;text-align:center;padding:10px;font-size:14px;z-index:99999;';
    progress.textContent = '📄 正在生成 PDF，请勿操作…';
    document.body.appendChild(progress);

    // 4. 等待渲染
    await _wait(600);
    window.scrollTo(0, 0);
    await _wait(200);

    try {
      const filename = `${(tripData.meta?.title || '行程规划').replace(/[\\/:*?"<>|]/g, '_')}.pdf`;

      await html2pdf().set({
        margin: [6, 6, 6, 6],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 595,
          windowWidth: 595,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'], before: '.pdf-page-break' },
      }).from(container).save();

      progress.textContent = '✅ PDF 已保存！';
      progress.style.background = '#16a34a';
      setTimeout(() => progress.remove(), 2000);
    } catch (err) {
      console.error('PDF export error:', err);
      progress.textContent = '❌ 导出失败，正在尝试备用方案…';
      progress.style.background = '#dc2626';
      setTimeout(() => { progress.remove(); _fallbackPrint(tripData); }, 1500);
    } finally {
      container.remove();
      appContainer.style.display = originalAppDisplay;
      if (fab) fab.style.display = originalFabDisplay;
    }
  }

  /* ==================== 备用：浏览器打印 ==================== */

  function _fallbackPrint(tripData) {
    const win = window.open('', '_blank');
    if (!win) return alert('弹窗被拦截，请允许弹窗后重试');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${tripData.meta?.title || '行程规划'}</title>
<style>
body{font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:#222;font-size:12px;line-height:1.65;padding:16px;max-width:700px;margin:0 auto;}
table{width:100%;border-collapse:collapse;table-layout:fixed;}
td,th{border:1px solid #ddd;padding:5px 6px;word-wrap:break-word;}
.pdf-page-break{page-break-before:always;}
@media print{body{padding:0;}}
</style></head><body>${_buildPrintHTML(tripData)}
<script>setTimeout(function(){window.print();},500)<\/script></body></html>`);
    win.document.close();
  }

  /* ==================== 构建打印 HTML ==================== */

  function _buildPrintHTML(d) {
    const m = d.meta || {};
    const s = m.stats || {};
    const budget = m.budget || {};
    const schedule = m.schedule || {};
    let h = '';

    // 封面
    h += `<div class="pdf-title">
            <h1>${m.title || '行程规划'}</h1>
            <p>${m.subtitle || ''}</p>
            <p>${m.route || ''} | ${m.travelers || ''}</p>
        </div>`;

    // 统计
    h += `<table class="pdf-stats"><tr>
            <td><strong>全程里程</strong><br>${s.totalDistance || '-'} km</td>
            <td><strong>驾驶时长</strong><br>${s.totalDriving || '-'}</td>
            <td><strong>过路费</strong><br>${s.tollFees || 0} 元</td>
            <td><strong>油费</strong><br>${s.fuelCost || 0} 元</td>
        </tr></table>`;

    // 预算
    h += `<div class="pdf-budget">
            <strong>预算合计：</strong>${(budget.range?.[0]) || 0} – ${(budget.range?.[1]) || 0} 元
            ${budget.includes ? ` (${budget.includes})` : ''}
        </div>`;

    // 日程
    h += `<div class="pdf-schedule">
            📅 ${schedule.departure || '-'} &nbsp;|&nbsp; 📍 ${schedule.midpoint || '-'} &nbsp;|&nbsp; 🏠 ${schedule.return || '-'}
        </div>`;

    // 每日行程
    (d.days || []).forEach((day, i) => {
      const w = day.weather || {};
      const dr = day.driving || {};
      const ht = day.hotel || {};

      if (i > 0) h += `<div class="pdf-page-break"></div>`;

      h += `<div class="pdf-day-header">
                <span class="day-num">D${day.day || (i + 1)}</span>
                ${day.date || ''} (${day.weekday || ''})
                <span class="day-theme">${day.theme || ''}</span>
            </div>`;

      h += `<table class="pdf-info-row"><tr>
                <td style="width:25%;">🌤️ ${w.condition || '-'} ${w.low || '?'}~${w.high || '?'}℃</td>
                <td style="width:25%;">⏰ ${day.departure || '-'}</td>
                <td style="width:25%;">🏨 ${ht.name || '未定'}</td>
                <td style="width:25%;">🚗 ${dr.distance || '-'}km ${dr.duration || ''}</td>
            </tr></table>`;

      // 时间轴
      const tl = day.timeline || [];
      if (tl.length) {
        h += `<div class="pdf-section-title">📋 时间轴</div>`;
        h += `<table class="pdf-timeline">`;
        tl.forEach(t => {
          h += `<tr><td class="time-col">${t.time || ''}</td><td>${t.event || ''}</td></tr>`;
        });
        h += `</table>`;
      }

      // 景点
      const att = day.attractions || [];
      if (att.length) {
        h += `<div class="pdf-section-title">🏞️ 景点攻略</div>`;
        att.forEach(a => {
          h += `<div class="pdf-attraction">
                        <div><span class="att-name">${a.name || ''}</span> <span class="att-level">${a.level || ''}</span> · 🎫 ${a.ticket || '未知'}</div>
                        ${a.intro ? `<div>📝 ${a.intro}</div>` : ''}
                        ${a.tips ? `<div>💡 ${a.tips}</div>` : ''}
                        ${a.pitfalls ? `<div style="color:#b45309;">⚠️ ${a.pitfalls}</div>` : ''}
                        ${a.childTips ? `<div style="color:#7c3aed;">👶 ${a.childTips}</div>` : ''}
                    </div>`;
        });
      }

      // 用餐
      const meals = day.meals || [];
      if (meals.length) {
        h += `<div class="pdf-section-title">🍽️ 用餐建议</div>`;
        h += `<table class="pdf-meals">`;
        meals.forEach(ml => {
          h += `<tr>
                        <td style="width:15%;font-weight:600;">${ml.type || ''}</td>
                        <td>${ml.suggestion || ''}</td>
                        <td style="width:15%;text-align:right;">¥${ml.budget || '?'}</td>
                    </tr>`;
        });
        h += `</table>`;
      }

      // 费用
      const cb = day.costBreakdown;
      if (cb) {
        h += `<div class="pdf-section-title">💰 当日费用</div>`;
        if (cb.routes?.length) {
          h += `<table class="pdf-cost">
                        <thead><tr><th>路段</th><th style="width:18%;text-align:right;">距离</th><th style="width:18%;text-align:right;">过路费</th><th style="width:18%;text-align:right;">油费</th></tr></thead><tbody>`;
          cb.routes.forEach(r => {
            h += `<tr><td>${r.segment || ''}</td><td style="text-align:right;">${r.distance || 0}km</td><td style="text-align:right;">${r.toll || 0}元</td><td style="text-align:right;">${r.fuel || 0}元</td></tr>`;
          });
          h += `</tbody></table>`;
        }
        if (cb.budget) {
          const entries = Object.entries(cb.budget);
          if (entries.length) {
            h += `<div style="margin-top:4px;font-size:11px;">`;
            h += entries.map(([k, v]) => `${k}：${v === 0 ? '—' : v + '元'}`).join(' · ');
            h += `</div>`;
          }
        }
        if (cb.totalRange) {
          h += `<div class="pdf-day-total">当日合计：${cb.totalRange[0] || 0} – ${cb.totalRange[1] || 0} 元</div>`;
        }
      }
    });

    // 页脚
    h += `<div class="pdf-footer">AI 旅游规划助手 · 由 AI 生成 · ${new Date().toLocaleString('zh-CN')}</div>`;
    return h;
  }

  function _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  return { exportPDF };
})();
