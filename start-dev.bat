@echo off
echo 日本名作文学読解ゲーム - 開発サーバー起動
echo ==========================================
echo.

REM Pythonがインストールされているか確認
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Pythonで開発サーバーを起動します...
    echo URL: http://localhost:8000
    echo.
    echo 終了するには Ctrl+C を押してください
    python -m http.server 8000
) else (
    REM Node.jsがインストールされているか確認
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Node.jsで開発サーバーを起動します...
        echo URL: http://localhost:8000
        echo.
        echo 終了するには Ctrl+C を押してください
        npx http-server -p 8000
    ) else (
        echo エラー: PythonまたはNode.jsがインストールされていません
        echo.
        echo 以下のいずれかをインストールしてください：
        echo - Python: https://www.python.org/downloads/
        echo - Node.js: https://nodejs.org/
        pause
    )
)