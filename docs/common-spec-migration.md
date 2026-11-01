# ベク取る: 共通仕様と公開移行の記録

2026-10-31。対象は実験場の稼働Supabase `games` で `is_active=true` の `bekutoru`。現在の登録URL https://chameleonjp.codeberg.page/bekutoru/ はHTTP200を確認した。固定予備リストだけを対象根拠にしていない。ランキング詳細は実カードの https://chameleonjp-lab.github.io/chameleonjp_lab/ranking.html?game=bekutoru 。DB登録・公開フラグ・既存記録は変更していない。

## 調査した版と維持するルール

GitHub基点 `add4ce4c464d1236623704fd2fa23b8b2ac92ee7`、公開ブランチ `main`。着手時の関連PRは0件。Pages APIの実URLは https://chameleonjp-lab.github.io/bekutoru/（built / legacy / main / root）。取得HTMLは基点HEADと一致した。Codeberg版と同名・同slug・主要処理を照合したが差分があり、新URLで通常プレイの全機能比較はまだ完了していない。正式URLと共有URLは現登録のCodebergページを維持し、DBリンク切替や強制転送は行わない。

16×22盤面、72本の矢、パンダが頭の前方から端まで空いている矢だけを抜く判定、全矢除去でクリア、誤り+5秒・ヒント+15秒、リタイア非登録を維持した。時間は整数ミリ秒、昇順が良く、ランキングはscale=1000・小数3桁。既存stage-bagの順序/直前盤面回避を保持する。採点・生成・当たり判定など31個の関数/定数を変更前とTypeScript AST印字で照合し一致した。日本語の読み/語順に依存する出題はなく、全言語で同じ空間的判断を行う。難易度の実測同等性までは確認していない。

既存のサーバー参加者は `normalized_name=btrim(name)` の名前キー、記録は `game_scores` のゲーム別集計。これを今回作り直さない。同名別人の分離・名前変更時の本人継続は現行契約では解決できず、過去記録の所有確認や移管を独断で行わない。以下のUUIDは**プレイの再送識別**であり参加者IDへの置換ではない。

## 実装した動作

名前欄をホームに移し、12コードポイントまでの任意入力にした。空白のみもゲストとして遊べ、結果/ランキング/共有を使える。名前と記録が公開される説明を全15言語で表示する。旧 `bekutoru_player_name` localStorageと同名cookieは維持する。localStorageに空文字が保存されていれば古いcookieより優先し、名前消去は双方へ保存する。過去記録は削除しない。Enterや日本語変換の確定だけで開始しない。

開始時に名前/公開意思/UUID/クライアント版を固定する。正常クリアの確定時に整数記録と表示用結果を保存し、そのUUIDで自動送信する。結果表示までの180ms中に再読み込みしても確定結果を復元できる。結果再表示/言語変更ではenqueueし直さない。既に保存した未送信結果だけを起動時・online・手動再試行で送る。後から入力した名前で匿名の過去プレイを公開しない。

`bekutoru:last-result:v1` は直近確定結果、`bekutoru:score-pending:v1:<UUID>` はプレイごとの未送信台帳。新開始では表示用結果だけを消し、以前の未送信記録は保持する。送信待ち/送信中/失敗/送信済み/拒否を分け、8秒timeoutやACK欠損では同じUUIDを再試行する。明示拒否は結果を残して再送を停止する。サーバーACKの名前/整数記録/登録回数/duplicateを確認する。旧submit_scoreへのfallbackはない。端末保存不能時もプレイ/画面内結果は使えるが再読み込み復元を保証しない。

ゲスト・リタイアを含む結果に `get_best_score_ranking(p_game_slug='bekutoru',p_limit=30)` の集計後上位30件を表示する。配列、正整数rank_no、文字列display_name、整数best_scoreを検証し、不正HTTP200は失敗/再試行とする。独自の順位や同点優劣を作らず、同名行を勝手に削らない。通信世代で古い応答を破棄し、登録成功後に再取得する。圏外の本人順位や全人数は推測しない。名前はtextContentで表示する。

ホーム/結果の黒地白字「Xでシェア」はX intentを別タブで開き、利用者が投稿を確定する。ホームは紹介、結果は今回の確定時間と内訳、現正式URLを共有する。名前・未確定順位・推測人数は含めない。開けない場合は本文/URLをコピーでき、コピーが拒否されても選択して手動コピーできる。「投稿完了」とは表示しない。結果/再挑戦/ランキング操作は長い上位30一覧より前に置いた。

## 15言語

基準はサイノメ `79b1e5733e725cd1148b10fa5699ba846e2bf57d` の `js/language-options.js`。ja/en/es/pt-BR/zh-Hans/fr/de/ko/ru/it/zh-Hant/id/tr/vi/th の75表示文を翻訳した。ホーム・説明・パンダの誤りメッセージ・ゲーム中・結果・設定・通信/空/失敗/再試行・共有・コピーを含む。`i18n/source.json` と各配列を `tools/build-locales.py` でHTMLへ埋め込む。CIは全件/placeholder/生成結果一致を検証する。

保存 `bekutoru:language` を優先、未設定は対応ブラウザ言語、対応外は英語。zh-Hans/zh-Hantの明示scriptを地域より優先する。表示と内部stateを分離し、言語変更で盤面/残数/開始時刻/ペナルティ/確定結果/送信回数を変えない。取得済みランキングを再描画し、言語変更だけでは通信しない。母語話者による自然さの確認は未実施。

## 効果音と設定

既存は無音。音源をブラウザで生成し、初回オン・音量0.5とする。保存済みoff/0を有効として保持。`bekutoru:sound` / `bekutoru:volume` は他ゲームと衝突しない。最初のoff操作はAudioContext作成前に反映する。ユーザー操作時にunlockし、suspended/interruptedならresumeのみ試してその古いイベントを破棄する。成功がゲーム開始条件ではない。hidden/pagehide/off/0で停止、終了時disconnect、最大6声/80ms抑制で連打負荷を抑える。

|実イベント|音の役割・条件|重複抑制・実装箇所|
|---|---|---|
|開始|カウントダウン開始の2音|startFromHome、二重開始ガード|
|矢の除去|画面と同じ成功の2音|removeArrowImmediately、80ms、最終矢では終了音のみ|
|抜けない矢の選択|画面と同じ失敗の低い2音|handleWrongArrow、80ms、+5秒条件不変|
|ヒント|ヒントを使った2音|useHint、候補ありの場合のみ、80ms、+15秒条件不変|
|クリア/リタイア|確定終了の3音|finishGameClear/retireGame、playingガード、前音停止|

音だけで事前に正解を知らせない。実際の聴取、iPhone Safari、長時間負荷は未確認。

## 公開前の依存関係と適用順

1. [実験場PR43](https://github.com/chameleonjp-lab/chameleonjp_lab/pull/43) の `docs/chameleonjp-lab/sql/common-score-receipt-v1.sql` をレビューし、既存記録を保ったまま適用する。関数/権限を読み戻して確認する。コードPRのマージだけではSQLを適用しない。**本ゲームの公開前に `submit_score_once_shared_v1` が必要**。
2. マージ前に GitHub Settings → Pages → Build and deployment → Sourceを **GitHub Actions** にする。調査時legacy公開のままだと従来公開が検証を迂回し得る。`github-pages` environmentで既存承認/保護を維持し `main` を許可する。本作業で設定は変更していない。
3. 利用者が本PRをmainへマージする。PRではvalidateのみ、main pushでは同じコミットの検証済み成果物をdeployする。失敗buildを公開せず、concurrency取消とdeploy前HEAD照合で古い実行を拒否する。PagesのSourceもworkflow必須として検査する。
4. Pages実URLで公開版のホーム→開始→正常終了/リタイア→結果/上位30/共有/設定を確認する。本PRのコード・翻訳・音・設定は全てindex.htmlへ含み、公開対象はindex.htmlと.nojekyllだけ。開発資料/秘密情報/テストは含めない。
5. GitHub公開版の実動確認後、正式URL・meta・共有URLの変更PRと実験場DBの `games.game_url` / `share_text` 更新を準備する。旧値を保存し、slugと旧URL条件付きで更新しSELECT読み戻しする。旧ページ案内はさらにその後。現在この切替は未適用。

Codeberg/GitHubは別originのため名前cookie/localStorageは自動移行しない。旧データを残す。移行対象キーは `bekutoru_player_name`（cookieも）、`bekutoru_stage_bag_v9`、`bekutoru_last_stage_key_v9`、新しいlanguage/sound/volume/結果/未送信台帳。次段階でゲーム限定エクスポート/インポートを検証するか、名前・設定の再入力を案内する。未送信台帳は同じUUIDを維持する必要がある。今回「全記録引継ぎ済み」とはしない。

## 確認と戻し方

```sh
python3 tools/build-locales.py --check
python3 tools/check-site.py
node tools/share.test.mjs
node tools/score-queue.test.cjs
node tools/audio.test.mjs
node tools/participation.test.mjs
node tools/ranking-contract.test.mjs
node tools/locales.test.mjs
npm install --no-save --package-lock=false --ignore-scripts playwright@1.62.1
npx --no-install playwright install --with-deps chromium
node tools/browser-smoke.cjs
python3 tools/check-site.py --out _site
```

28 unitシナリオと構文/公開manifest、モックChromiumの全15言語×72矢クリアを確認。空欄/空白/後から名変更/消去/IME、誤り+5秒/ヒント+15秒、失敗ACK→再読み込み→同UUID再送→成功→再読み込みで追加送信なし、確定後180ms表示遷移中の復元、上位30/同点/HTML風名前/競合/不正200/空/再取得、共有/言語変更の状態不変、保存off/0を検証する。ゲーム操作はポインターハンドラによる加速検証を含み、通常速度の人手全プレイとは区別する。402×874/874×402で長い翻訳の横はみ出しなし。本番スコア書込は0件。

iPhone実機では: 初回音オン→音を消して再読み込み→0保存、名前の日本語変換確定で開始しないこと、縦横/ブラウザバー/キーボード、名前なしの終了と上位30、Xをキャンセルして戻って結果と音設定が残ること、再挑戦を確認する。翻訳の自然さ・実音・長時間・本番RPC/自動公開/新URL全機能は未確認。

不具合は直前の安全なコミットへ戻すPRをマージし同じ検証/公開経路で配信する。利用者データやreceipt台帳を削除しない。SQLを戻す場合は先に利用クライアントを止め/戻し、既存台帳は保持する。実験場URLは現在切替前で切戻し不要。次段階のDB切替後は保存旧値をslug/現在URL条件付きで復元しSELECT確認する。

## 共通仕様対応表

|項目|状態|根拠・残件|
|---|---|---|
|1 対象条件|既存で確認済み|稼働DB登録・公開HTTP200を照合|
|2 記録・ルール|今回維持・記録|識別値/保存先/整数ms/昇順/ルール維持。31コア定義一致|
|3 正式ページ/引継ぎ|未確認・未完了|移行準備のみ。実公開機能比較とorigin移行が必要|
|4 15言語|今回実装・確認残あり|75×15本文/動的文/共有。母語話者レビュー未実施|
|5 任意名/自動送信|今回実装・基盤残件|開始名固定/UUIDreceipt/結果復元。SQL適用待ち、name-key本人識別問題は未解決|
|6 ランキング|今回実装・基盤残件|両画面詳細URL/集計30/同点/失敗再試行。現参加者キー制約を継承|
|7 X共有|今回実装・URL切替待ち|15言語のホーム/今回結果/コピー代替。新URL確認前に切替なし|
|8 効果音|今回実装・聴取未確認|実イベント5種、音源生成/抑制/後片付け|
|9 音設定|今回実装・実機未確認|初回on.5、保存off/0、操作時unlock、hidden停止|
|10 文言/画面|今回実装・実機未確認|名前/公開説明/長文折返し/44px/表より前に結果操作。縦横Chromium確認|
|11 自動公開|今回実装・設定/本番待ち|PR検証のみ・main検証成果物deploy。Pages source設定が必要|
|12 検証|今回実施・残件あり|28unit/15言語browser/コア比較。実機/聴取/母語話者/本番未確認|
|13 PR/記録|今回作成|本書、音一覧、テスト、依存/適用順/戻し方|

## 2026-11-02 後続監査・修正

基点はPR2 head `84d6b83f0f0918462b3e7389465d8362549eedaf`（main `add4ce4c464d1236623704fd2fa23b8b2ac92ee7`）。03:32 JSTに現在のCodeberg公開ホーム「ベク取る」、実験場の実カード/登録資料の同URL・slug・昇順ms/小数3桁を照合した。公開ページでのゲーム開始・試験スコア送信は行っていない。以前の確認結果は上記の時点付き記録として残し、以下を今回の差分とする。

- 保存先が満杯/使用不可のとき、未保存receiptをネットへ送らず、この画面内で保持する。回復後は古い未送信と新しい未送信の両方を各UUIDで保存・再送する。表示用結果も保存直後に読み戻し、保存できなければ全15言語で画面を閉じると失われ得る旨を示す。
- 同UUIDで異なるpayload、壊れた保存値、キーと内容のID不一致を見つけた場合は元の保存値を上書き・削除せず送信を止める。他の正常なreceiptは継続できる。結果画面は例外でも保持する。
- 受理済みreceiptは送信済み印を残す。同一結果の再確定や再読込で新たな送信として作り直さない。送信済み印の保存が失敗してもサーバーのUUID照合を使い、再読込後は元のUUIDだけを再送する。端末の台帳を自動間引き・削除しない。
- ACKは受理値だけで成功扱いせず、単一応答、名前、整数記録、正の登録回数、3つのbooleanを確認する。SQLは入力payloadを台帳照合するが応答に今回のスコア・UUIDを返さないため、クライアントによる全payload読み戻し確認とは表現しない。
- 音のoscillator停止/切断失敗がgain切断を妨げないよう個別に後片付けする。iOS等のinterrupted/suspended状態への変化で予約音を停止し、同期的にresumeが完了した場合も復帰契機の古い音を再生しない。
- 自動検証を全単体試験＋Chromium/WebKit両エンジンへ拡張。PRでは配備しない条件、mainマージ後の同一検証成果物、現main/Pages Source確認を維持した。ローカルのブラウザ実行ファイルは利用できず、ブラウザ結果はPR CIの実行結果と区別する。公開用ローカル出力は既存非空ディレクトリを上書き・再帰削除せず停止する。

既存75表示文に保存不能の説明1件を追加し、15言語×76項目を検証する。盤面、72本の矢、除去判定、誤り+5秒、ヒント+15秒、リタイア非登録、開始時の名前、既存stage-bagと名前保存キーは変更しない。

未完了は引き続き、normal receipt SQLの本番適用と確認、name-keyに依存しない参加者識別・厳密な30人集計、Pages Sourceの設定確認/新URL機能比較と移行、母語話者・iPhone Safari実機・実音・長時間確認。CI成功だけでこれらを完了扱いにしない。適用/戻し方は前節の順序を維持する。

03:37 JSTの読取専用定義照合で、現DB `normalize_player_name(text)` は `btrim(coalesce(input_name, ''))` のみ、`submit_score_unverified` の表示名も同じtrimであると確認した（NFKC変換等はない）。クライアントが開始時にtrimした名前と2つの応答名を比較する。応答はPostgRESTの**1行配列**を必須とし、bare object/複数行/列欠損を受理扱いにしない。first/bestは既存SQLのsigned integerを維持し、既存記録の負値をこの改修で書換え・再判定しない。現在の登録もactive/shared・昇順・scale1000/小数3桁・Codeberg URLのまま再確認した。関数を呼び出してのスコア登録試験やDB更新は行っていない。
