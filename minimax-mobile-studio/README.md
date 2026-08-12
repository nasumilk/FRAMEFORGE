# MiniMax H3 Mobile Studio

MiniMax H3を、iPhone・iPad・PCから操作するためのモバイル優先Webアプリです。

画面操作はMobile Studio、動画生成処理はWindows上のComfyUIが担当します。ComfyUIは外部公開せず、ローカルの生成エンジンとして利用します。

## 次にやること

公式MiniMax H3 T2V WorkflowのAPI形式ファイルを登録済みです。T2VのPrompt、Seed、秒数、縦横比、解像度規模をMobile Studioから変更できます。

T2Vの実生成、ジョブ監視、完成MP4の取得まで確認済みです。History画面では動画、Prompt、Seed、秒数を確認でき、`Use settings`から生成画面へ設定を戻せます。履歴を削除してもComfyUI側の動画ファイルは残ります。

画像・動画アップロードAPIも実装済みです。次はComfyUI公式のMiniMax H3 I2V WorkflowをAPI形式で登録し、画像入力のMappingを作成します。I2VのNode IDや入力名は推測せず、実際に動作しているWorkflowから取得します。

### 別のWorkflowへ差し替える場合の操作手順

1. PCでComfyUIを開きます。
2. 普段T2V生成に使っているMiniMax H3 Workflowを開きます。
3. ComfyUIの設定画面（歯車アイコン）を開きます。
4. `Enable Dev mode Options`（開発者モードのオプション）を有効にします。
5. Workflowメニューに追加された `Save (API Format)` を選びます。
6. JSONファイルを保存します。ファイル名は変更しなくて構いません。
7. 保存したJSONファイルをこのCodexチャットに添付してください。

ここまでできれば大丈夫です。Node IDの調査、ファイル名変更、Mapping作成、アプリへの組み込み、実際のT2V生成テストはCodex側で行います。

注意：通常の `Save` で保存したJSONではなく、必ず `Save (API Format)` を使用してください。正しいAPI形式は、JSONの先頭付近がノードIDをキーにした構造になっています。通常形式のようなトップレベルの `nodes` 配列はありません。

## 現在のアクセス先

- iPhone・iPad・別PC（Tailscale接続中）：`https://daichinopc.tail9ad2a3.ts.net:8444`
- このWindows PC：`http://127.0.0.1:3300`
- FRAMEFORGE：`https://frameforge-h3-studio.nasumilk.chatgpt.site`

FRAMEFORGEのプロンプト表示欄にある「H3 Studioで開く」ボタンを押すと、生成したプロンプトをMobile Studioへ引き渡せます。

## 現在できていること

- iPhone、iPad、PC向けのPWA画面
- FRAMEFORGEからのプロンプト受け渡し
- ComfyUIのオンライン状態確認
- T2V入力画面
- FastAPIによる生成・ジョブ・キャンセル・Workflow状態API
- SQLiteによる生成履歴・ジョブ・メディア管理の基礎
- ComfyUI公式Server APIへの接続
- Workflow Template＋Mapping方式
- Workflowの形式・Node ID・入力名の検証
- Workflow解析補助スクリプト
- LoRA検索補助スクリプト
- Windowsログイン後の自動起動
- Tailscale HTTPS接続

T2Vの「GENERATE VIDEO」ボタンは使用可能です。I2VやReference系のボタンは、それぞれの正常動作するAPI形式WorkflowとMappingが登録されるまで意図的に無効化されます。Node IDを推測して誤ったWorkflowをGPUへ投入しないためです。

18歳未満を示す性的・裸体PromptはBackendで拒否されます。Workflowファイルに保存されていたPromptもテンプレート登録時に成人の安全なプレースホルダーへ置換しています。

## 必要環境

- Windows 11
- Node.js 22以上
- Python 3.11以上
- `127.0.0.1:8188`で稼働するComfyUI
- モバイル接続用のTailscale
- ComfyUIからAPI形式で保存したMiniMax H3 Workflow

## Workflowの組み込み方法

通常はCodex側で作業するため、ユーザーが以下のコマンドを操作する必要はありません。

API形式Workflowは次の名前で`workflows`フォルダに配置します。

- T2V：`h3_t2v.json`
- I2V：`h3_i2v.json`
- Reference Image：`h3_reference_image.json`
- Reference Video：`h3_reference_video.json`

Workflowを解析するコマンド：

```powershell
backend\.venv\Scripts\python.exe scripts\inspect_workflow.py workflows\h3_t2v.json
```

Mapping検証コマンド：

```powershell
backend\.venv\Scripts\python.exe scripts\validate_workflows.py
```

Node IDはPythonやReactのコードに書かず、`workflows/mappings`内のYAMLだけで管理します。ComfyUI側でWorkflowを編集してNode IDが変わった場合も、Mappingだけ更新できます。

## 起動方法

Windowsへのログイン時に自動起動するよう設定済みです。通常は手動操作不要です。

手動で起動する場合：

```powershell
powershell -ExecutionPolicy Bypass -File C:\Promptmaker\minimax-mobile-studio\scripts\run_mobile_studio.ps1
```

使用ポート：

- Mobile Studio画面：`127.0.0.1:3300`
- FastAPI：`127.0.0.1:8000`
- ComfyUI：`127.0.0.1:8188`

ブラウザはFastAPIやComfyUIへ直接接続しません。Mobile StudioからFastAPIを経由し、FastAPIだけがComfyUIへ接続します。

## Tailscale接続

Mobile Studioは次のアドレスでtailnet内だけに公開されています。

```text
https://daichinopc.tail9ad2a3.ts.net:8444
```

iPhoneまたはiPadを同じTailscaleへ接続し、Safariで開いてください。Safariの共有メニューから「ホーム画面に追加」を選ぶと、通常のアプリに近い形で起動できます。

Tailscale Funnelは使用しません。インターネットへ一般公開せず、ComfyUIのポートも直接公開しません。

## FRAMEFORGEとの連携

FRAMEFORGEの「H3 Studioで開く」を押すと、現在のH3プロンプトがMobile StudioのPrompt欄へ入ります。

プロンプトはURLのフラグメント（`#frameforge_prompt=...`）で渡します。この部分はWebサーバーへ送信されず、Mobile Studioへ取り込んだ直後にアドレス欄から削除されます。

## LoRA一覧の作成

ComfyUIのLoRAフォルダを検索し、編集用メタデータの下書きを作るコマンドです。

```powershell
backend\.venv\Scripts\python.exe scripts\scan_loras.py C:\ComfyUI\models\loras
```

自動生成された内容を確認してから、正式なLoRAマスターへ反映します。

## テスト

Backend：

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests -q
```

Frontend：

```powershell
cd frontend
npm run lint
npm run build
```

## 困ったとき

- `Engine offline`：Windows上でComfyUIが起動しているか確認してください。
- `Workflow setup required`：API形式WorkflowとMappingがまだ登録されていません。
- `Workflow invalid`またはトップレベルに`nodes`がある：通常形式のJSONです。`Save (API Format)`で保存し直してください。
- `Mapping error`：ComfyUIでWorkflowを編集したためNode IDまたは入力名が変わっています。再解析してMappingを更新します。
- iPhoneから画面を開けない：iPhoneのTailscale接続を確認してください。
- Historyは見えるがGenerateできない：ComfyUIが停止中、または選択モードのWorkflowが未登録です。

## 参照している公式仕様

- [ComfyUI OpenAPI仕様](https://github.com/Comfy-Org/ComfyUI/blob/master/openapi.yaml)
- [ComfyUI公式WebSocket APIサンプル](https://github.com/Comfy-Org/ComfyUI/blob/master/script_examples/websockets_api_example.py)
- [ComfyUI公式MiniMax Hailuoノード仕様](https://docs.comfy.org/built-in-nodes/MinimaxHailuoVideoNode)
- [API形式Workflowの公式説明](https://docs.comfy.org/development/cloud/overview)
