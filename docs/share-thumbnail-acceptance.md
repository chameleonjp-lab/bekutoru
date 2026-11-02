# 固定SNSサムネイル・共有表示受入（2026-11-02）

## 素材と設定
- 実装基点: main 6153d7cc31ea0df7421c057b1c4ac5fdc688e26e。既存ゲームルール、スコア、識別値、音、保存契約は変更しない。
- 素材: capture commit cc7ec7bd89f037b712a45f48be1ce70d4584dd06 / Actions 41423657778。通常の匿名開始・seed19、実Canvas72本の矢・未除去0。ブラウザ全通信をfulfill/abortし外部0、実スコア送信なし。
- 実Canvas素材768×1056 SHA-256 `e1c86b1fedb68cdd018e220889d005e0c75e92692ec610bba959d0aaed84e570`。盤面自体は描き足し/切抜き改変せず、等比縮小、実CSS白背景と題字・規則に沿う説明を組版。実ゲームスクリーンショットそのものではなく、実盤面素材による固定紹介画像。個別結果カードではない。
- SNS PNG1200×630、118932bytes、SHA-256 `0439f3739a14f0764083140e19516491889be668a7287736a44311ea0afc9e15`。
- OG/Twitterは既正式Codeberg URLのassets/social-card.png。GitHub PRのmergeだけでCodebergへ反映されたとは扱わない。公開URL切替・Pages設定変更・DB更新なし。
- 正式タグは全言語共通 `#ベク取る #ゲーム制作`。翻訳後に追加し、名前非露出・今回の確定値を保持。
- 独立copyボタンは元から無い。旧関数copyShareText等は実際にXを開くので保持。Xが開けない場合だけコピーdialogを出す。

## 検証境界
- social-card testは画像/OG/2タグ不足でREDを確認後、最小実装でGREEN。
- 現ローカル58 tests PASS、15言語76文生成一致、HTML5script構文/queue埋込一致、staging exact画像bytes確認。
- 新share-visualは15locale×2縦横×home/clear/retire×Chromium/WebKit。44px/viewport/祖先opacity・clip/中心hit・textfit、黒白X、実popup intent1回、popupblocked fallback、結果・ID・名前不変、送信0。実行結果はCI終端/画像実見まで未確認。
- fixturesは既存restoreResultの合法匿名結果(raw12340+wrong5000+hint15000=final32340)。製品にテストhook追加なし。
- test-only material/visualは全HTTPを直接fulfillまたはabort、WebSocket遮断、SW無効化。未知requestは失敗。旧smokeもlocal直接fulfill境界を追加し、既RPCmock契約テストは維持。
- branch pushは検証のみ。upload-pages/deployはmain pushだけ、既permissions/runner/timeout不変、branch別concurrency。本番配備・iPhone実機・Xキャッシュ受入は未実施。

## 復元
本差分は独立branch/PR。旧mainと素材receiptを保持。元正常版を削除せず、必要なら本人がPR変更だけをrevertする。自動merge/公開操作はしない。
