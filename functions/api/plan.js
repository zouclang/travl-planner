/**
 * Cloudflare Pages Function — AI 行程规划 API
 *
 * POST /api/plan
 * 接收用户输入 → 调用 LLM → 返回 TRIP_DATA JSON
 *
 * 环境变量（Cloudflare Dashboard 设置）：
 *   LLM_API_URL  — OpenAI 兼容 API 端点 (如 https://api.deepseek.com/v1)
 *   LLM_API_KEY  — API 密钥
 *   LLM_MODEL    — 模型名 (如 deepseek-chat)
 */

// ---------- System Prompt ----------

const SYSTEM_PROMPT = `你是一个专业的旅游行程规划师。根据用户提供的出发地、目的地、日期、天数等信息，生成详细的行程规划。

你必须返回一个严格符合以下 JSON Schema 的 JSON 对象（不要返回任何其他文字，只返回 JSON）：

{
  "meta": {
    "title": "行程标题（如：2026 春节自驾 北京→成都）",
    "subtitle": "概要行程预览",
    "route": "路线概要文字描述",
    "travelers": "旅客描述（如：2成人+1名4岁儿童）",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "totalDays": 数字,
    "stats": {
      "totalDistance": 总公里数(数字),
      "totalDriving": "总驾驶时长描述",
      "tollFees": 总过路费(数字),
      "fuelCost": 总油费(数字)
    },
    "budget": {
      "range": [最低预算, 最高预算],
      "includes": "含油费/过路费/餐饮/住宿/门票/停车"
    },
    "schedule": {
      "departure": "出发时间描述",
      "midpoint": "中途节点描述",
      "return": "返回时间描述"
    }
  },
  "routeColors": ["#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0ea5e9", "#ec4899"],
  "keyPoints": [
    { "name": "地名", "coords": [经度, 纬度] }
  ],
  "days": [
    {
      "day": 天数序号(从1开始),
      "date": "YYYY-MM-DD",
      "weekday": "周X",
      "theme": "当日主题描述",
      "tags": ["标签1", "标签2"],
      "weather": { "condition": "天气", "high": 最高温, "low": 最低温 },
      "highlights": ["核心景点1", "核心景点2"],
      "departure": "出发时间",
      "hotel": { "name": "酒店名/区域", "landmark": "参考地标" },
      "driving": { "distance": 公里数, "duration": "时长", "toll": 过路费, "fuel": 油费 },
      "route": {
        "start": { "name": "起点", "coords": [经度, 纬度] },
        "end": { "name": "终点", "coords": [经度, 纬度] },
        "waypoints": [{ "name": "途经点", "coords": [经度, 纬度] }],
        "color": "颜色hex"
      },
      "timeline": [
        { "time": "HH:MM", "event": "事件描述" }
      ],
      "attractions": [
        {
          "name": "景点名",
          "level": "等级（如AAAAA/AAAA/免费）",
          "ticket": "票价描述",
          "intro": "景点详细介绍（100-200字）",
          "tips": "游玩攻略建议（80-150字）",
          "pitfalls": "避坑提醒（50-100字）",
          "childTips": "亲子提醒（如有儿童）或 null"
        }
      ],
      "meals": [
        { "type": "午餐/晚餐", "suggestion": "推荐餐食描述", "budget": 预算数字 }
      ],
      "costBreakdown": {
        "routes": [
          { "segment": "A → B", "distance": 公里数, "toll": 过路费, "fuel": 油费 }
        ],
        "budget": {
          "住宿": 数字,
          "门票": 数字,
          "餐饮": 数字,
          "停车": 数字,
          "油费": 数字,
          "过路费": 数字
        },
        "totalRange": [最低合计, 最高合计]
      }
    }
  ]
}

重要规则：
1. coords 使用高德地图坐标系（GCJ-02），经度在前纬度在后 [lng, lat]
2. 每日的 route.color 按顺序使用 routeColors 数组中的颜色
3. 所有费用用人民币（元），距离用公里
4. timeline 按时间顺序排列，覆盖当日完整安排
5. 每个景点的 intro/tips/pitfalls 要具体有用，不要空泛
6. costBreakdown.totalRange 的差值为 ±50-100 元浮动
7. 如果有儿童，每个景点必须包含 childTips
8. 天气数据用合理的季节性估算
9. 油费按 百公里油耗(L) × 油价(约8元/L) × 距离/100 粗算
10. 只返回纯 JSON，不要 Markdown 代码块标记`;

// ---------- Handler ----------

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const body = await request.json();

        // ---- Build user prompt ----
        const userPrompt = _buildUserPrompt(body);

        // ---- Get LLM config ----
        const apiUrl = env.LLM_API_URL || 'https://api.deepseek.com/v1';
        const apiKey = env.LLM_API_KEY;
        const model = env.LLM_MODEL || 'deepseek-chat';

        if (!apiKey) {
            return new Response(JSON.stringify({
                error: '服务端未配置 LLM API Key，请在 Cloudflare Dashboard 设置 LLM_API_KEY 环境变量'
            }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        // ---- Call LLM ----
        const chatUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';

        const llmResponse = await fetch(chatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 16000,
                response_format: { type: 'json_object' },
            }),
        });

        if (!llmResponse.ok) {
            const errText = await llmResponse.text();
            console.error('LLM API error:', llmResponse.status, errText);
            return new Response(JSON.stringify({
                error: `AI 服务调用失败 (${llmResponse.status})`,
                detail: errText.slice(0, 500),
            }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        const llmData = await llmResponse.json();
        const content = llmData.choices?.[0]?.message?.content;

        if (!content) {
            return new Response(JSON.stringify({ error: 'AI 返回结果为空' }),
                { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        // ---- Parse JSON from content ----
        let tripData;
        try {
            // Strip possible markdown code fences
            let cleaned = content.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }
            tripData = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('JSON parse error:', parseErr.message, content.slice(0, 500));
            return new Response(JSON.stringify({
                error: 'AI 返回的数据格式异常，请重试',
                raw: content.slice(0, 1000),
            }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        return new Response(JSON.stringify(tripData), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

    } catch (err) {
        console.error('Handler error:', err);
        return new Response(JSON.stringify({ error: '服务器内部错误', detail: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

// ---------- Helpers ----------

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

    if (params.preferences?.length) {
        lines.push(`出行偏好：${params.preferences.join('、')}`);
    }

    if (params.transport === 'self-drive') {
        lines.push(`交通方式：自驾`);
        if (params.fuelConsumption) {
            lines.push(`百公里油耗：${params.fuelConsumption}L`);
        }
    } else if (params.transport === 'train') {
        lines.push(`交通方式：高铁+租车`);
    }

    const budgetMap = { economy: '经济型', comfortable: '舒适型', luxury: '高端' };
    if (params.budget) {
        lines.push(`预算水平：${budgetMap[params.budget] || params.budget}`);
    }

    if (params.notes) {
        lines.push(`特别要求：${params.notes}`);
    }

    lines.push('');
    lines.push('请生成完整的行程规划 JSON。');

    return lines.join('\n');
}
