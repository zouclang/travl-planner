#!/bin/bash
# 旅游规划助手 — 本地启动脚本
PORT=8090
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "未检测到")
echo "🗺️  旅游规划助手已启动"
echo "👉 本机访问: http://localhost:$PORT"
echo "👉 局域网访问: http://$LOCAL_IP:$PORT"
echo "按 Ctrl+C 停止服务"
echo ""
cd "$(dirname "$0")" && python3 -m http.server $PORT --bind 0.0.0.0
