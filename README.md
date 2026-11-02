# さかなへんクイズ

魚へんの漢字を当てる 4 択クイズ（全 20 問）。正解数とタイムを競います。

- 前半 8 問：お馴染みの魚。本物の漢字を、そっくりな**ニセ漢字**3つの中から選ぶ
- 後半 12 問：難読の魚へん漢字を見て、正しい**読み**を 4 つから選ぶ（ほかの選択肢も実在の魚・生き物の名前）
- 順位は「正解数 → タイム」で決定（ランキングはブラウザ内に保存）
- BGM・効果音つき（右上の 🔊 でオン・オフ）
- 遊び方・ランキング・漢字図鑑はタイトル画面のボタンから開く別ページ
- 日本語／英語に対応（タイトル画面左上のボタンで切り替え。初回はブラウザの言語に合わせる）。英語では難読問題の選択肢が英語の魚名になる
- 収録 177 字（お馴染み 40 字＋難読 137 字）。タイトル画面の「漢字図鑑」で一覧できます

## 遊び方

`index.html` をブラウザで開くだけです（Web 版はビルド不要）。Android アプリ版もあります（下記）。

## Android アプリ

[Capacitor](https://capacitorjs.com/) でゲームのファイルをアプリに同梱し、Android アプリにしています（オフラインで遊べます）。
構成は techgymjp/jet-fighter の `docs/ANDROID_PORTING.md`、techgymjp/jackal と同じです。

- パッケージ名: `jp.techgym.sakanahen`
- 縦画面固定・全画面・プレイ中は画面を消さない
- 戻るボタン: 出題中は一時停止（一時停止中なら再開）、あそびかたはタイトルへ、タイトル・結果画面ではアプリを終了
- 別アプリに切り替えると自動で一時停止して音を止める（一時停止中は問題を隠し、タイムも止まる）
- シェアは Android の共有メニュー
- 広告（AdMob）
  - バナー: タイトル・あそびかた・一時停止・結果画面の下中央（出題中は選択肢と重なるので出さない）
  - 全画面広告（インタースティシャル）: 「スタート」（タイトル・あそびかたから）、「タイトルへ」（あそびかた・一時停止・結果から）、一時停止からの「再開」、結果画面の「もう一度」のたびに毎回
  - リワード広告（チート）: 問題をまちがえたら「広告を見てこの問題をやり直す」（1 ゲーム 3 回まで。正解を読めるよう 2 秒後に出し、5 秒で自動的に次の問題へ）。
    見終わるとその問題の結果とかかった時間を取り消して、同じ問題（同じ選択肢・同じ並び）をもう一度。使ったことは結果画面とシェア文に「やり直し N 回」と出る
  - EU など同意が必要な地域ではタイトル画面に「広告の設定」
- タイトル画面にバージョン（ビルド番号）とプライバシーポリシーへのリンク

ビルドは GitHub Actions（`.github/workflows/android.yml`）で行います。

1. `npm ci` → `npm run build`（`www/` に Web ファイルをコピーし、`ads-config.js` と `build-info.js` を生成）→ `npx cap sync android` → `./gradlew assembleDebug`
2. 既定ブランチなら、Release `android-latest` の `sakanahen.apk` を差し替え（動作確認用・テスト広告）
   - リリース画面: https://github.com/techgymjp/sakanahen/releases/tag/android-latest （QR コード: `docs/apk-qr.png`）
   - APK 直接: https://github.com/techgymjp/sakanahen/releases/latest/download/sakanahen.apk

   ![APK のリリース画面の QR コード](docs/apk-qr.png)
3. GitHub Secrets に署名鍵（`ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD`）があれば、本番広告で署名付き AAB を作り Artifact に上げる

AdMob のアプリ ID は `android/app/src/main/res/values/strings.xml` の `admob_app_id`（今は Google 公式のテスト用）、本番の広告ユニット ID は `ads.js` の `UNITS.android.production` にあります（まだ空）。
動作確認用 APK はどれもテスト広告、Google Play 用の AAB は本番の広告です（広告ユニット ID が空の種類は出さない）。

手元で試すとき: `npm install` → `npm run android:sync` → `npm run android:open`（Android Studio が必要）。
アイコンと起動画面は `assets/` の元画像から `npx @capacitor/assets generate --android` で生成しています。

## データ

`data.js` は `tools/gen.py` で生成しています。ニセ漢字は「魚＋つくり」を CSS で合成して表示し、
その組み合わせが実在しないことを [CJKVI IDS](https://github.com/cjkvi/cjkvi-ids) で確認しています。

```bash
curl -sSLo ids.txt https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt
python3 tools/gen.py ids.txt data.js
```

## ライセンス

著作権はテックジム株式会社に帰属します（All rights reserved）。許可なく複製・改変・再配布すること、Web サイトやアプリ（Google Play・App Store など）として公開・販売すること、名前・アイコン・画像を使うことを禁止します。
テックジムの受講生が学習目的で複製・改変することは許可しますが、アプリストアでの公開・広告の掲載・販売などの商用利用は禁止し、著作権表示を残してください。詳しくは `LICENSE` を見てください。

