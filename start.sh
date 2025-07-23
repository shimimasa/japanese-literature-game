#!/bin/bash

# 日本名作文学読解ゲーム起動スクリプト

echo "日本名作文学読解ゲームを起動します..."

# ポート番号
PORT=8000

# すでに使用されているポートかチェック
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "ポート $PORT は既に使用されています。"
    echo "既存のサーバーを使用するか、別のポートを指定してください。"
else
    # HTTPサーバーを起動
    echo "HTTPサーバーを起動しています (ポート: $PORT)..."
    python3 -m http.server $PORT &
    SERVER_PID=$!
    echo "サーバーPID: $SERVER_PID"
    
    # サーバーが起動するまで少し待つ
    sleep 2
fi

# URLを表示
URL="http://localhost:$PORT"
echo ""
echo "ブラウザで以下のURLを開いてください："
echo "$URL"
echo ""

# OSを判定してブラウザを開く
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        echo "ブラウザを開いています..."
        xdg-open $URL
    else
        echo "xdg-openが見つかりません。手動でブラウザを開いてください。"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open $URL
elif [[ -n "$WSL_DISTRO_NAME" ]] || [[ -n "$WSLENV" ]]; then
    # WSL
    echo "WSL環境を検出しました。Windowsのブラウザを開いています..."
    if command -v explorer.exe > /dev/null; then
        explorer.exe $URL
    else
        echo "explorer.exeが見つかりません。手動でブラウザを開いてください。"
    fi
fi

echo ""
echo "終了するには Ctrl+C を押してください。"

# サーバープロセスが終了するまで待つ
if [ ! -z "$SERVER_PID" ]; then
    wait $SERVER_PID
fi