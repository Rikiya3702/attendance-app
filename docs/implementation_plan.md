# 勤怠管理Webアプリケーションの実装プラン

Antigravityの機能を体験していただくために、モダンで使いやすい勤怠管理アプリケーションを作成します。

## プロジェクト概要
ユーザーが「出勤」と「退勤」を記録でき、その履歴をブラウザ上で確認できるシンプルなシングルページアプリケーション（SPA）です。

## 技術スタック
- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+)
- **Storage**: Browser LocalStorage (サーバー不要で動作)
- **Aesthetics**: Glassmorphism、滑らかなアニメーション、Google Fonts (Inter) を使用したプレミアムなデザイン

## 提案される変更

### [Component] Attendance App UI/UX (Advanced Features)
勤怠計算の厳格化と、ユーザビリティ向上のためのモーダル編集を導入します。

#### [MODIFY] [history.html](file:///Users/alice/.gemini/antigravity/scratch/attendance-app/history.html)
- 統計表示エリア（出勤日数、合計時間、残業合計）を追加。
- 編集用モーダルのHTML構造を追加。

#### [MODIFY] [style.css](file:///Users/alice/.gemini/antigravity/scratch/attendance-app/style.css)
- 統計エリア、モーダル（オーバーレイ、コンテンツ）のスタイルを追加。
- 履歴テーブルの各列のレイアウト調整。

#### [MODIFY] [history.js](file:///Users/alice/.gemini/antigravity/scratch/attendance-app/history.js)
- **計算ロジック**:
    - 出勤時刻：15分単位で切り上げ（08:01 -> 08:15）。
    - 退勤時刻：15分単位で切り捨て（17:14 -> 17:00）。
    - 休憩時間：実働6h超で45分、8h以上で60分。
    - 残業時間：(実働 - 休憩) - 8h。マイナスなら0（表示は"-"）。
- **モーダル機能**:
    - 編集ボタンクリックでモーダル表示。
    - 保存・閉じるボタンの制御。
- **統計表示**:
    - 選択月の合計値をリアルタイム計算して表示。

## 検証プラン

### 手動検証
1. `history.html` で各日の「実働」「休憩」「残業」が正しく算出されているか確認。
    - 例: 出勤 08:50 (->09:00), 退勤 18:10 (->18:00) の場合。
2. 統計エリアの「出勤日数」「合計勤務時間」「合計残業」が正しいか確認。
3. 編集ボタンを押してモーダルが開き、入力・保存が正しく動作することを確認。
4. カレンダー部分が直接入力ではなくテキスト（および編集ボタン）になっていることを確認。
