#!/bin/bash

# WSL2用の日本名作文学読解ゲーム起動スクリプト

echo "日本名作文学読解ゲームを起動します（WSL2環境）..."

# ポート番号
PORT=8000

# WSL2のIPアドレスを取得
WSL_IP=$(hostname -I | awk '{print $1}')
echo "WSL2 IPアドレス: $WSL_IP"

# HTTPサーバーを起動（すべてのインターフェースでリスン）
echo "HTTPサーバーを起動しています..."
python3 -m http.server $PORT --bind 0.0.0.0 &
SERVER_PID=$!
echo "サーバーPID: $SERVER_PID"

# サーバーが起動するまで待つ
sleep 2

echo ""
echo "=========================================="
echo "以下のURLでアクセスできます："
echo ""
echo "1. WSL2のIPアドレス経由："
echo "   http://$WSL_IP:$PORT"
echo ""
echo "2. localhost経由（動作しない場合があります）："
echo "   http://localhost:$PORT"
echo ""
echo "=========================================="
echo ""

# Windowsのブラウザを開く
if command -v explorer.exe > /dev/null; then
    echo "Windowsのブラウザを開いています..."
    explorer.exe "http://$WSL_IP:$PORT"
fi

echo "終了するには Ctrl+C を押してください。"

# Ctrl+Cのトラップ
trap "kill $SERVER_PID 2>/dev/null; exit" INT

# サーバープロセスが終了するまで待つ
wait $SERVER_PID