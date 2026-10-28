# さかなへんクイズ

魚へんの漢字を当てる 4 択クイズ（全 20 問）。正解数とタイムを競います。

- 前半 8 問：お馴染みの魚。本物の漢字を、そっくりな**ニセ漢字**3つの中から選ぶ
- 後半 12 問：難読の魚へん漢字。読みに合う**実在の漢字**を 4 つから選ぶ
- 順位は「正解数 → タイム」で決定（ランキングはブラウザ内に保存）
- 収録 177 字（お馴染み 40 字＋難読 137 字）。タイトル画面の「漢字図鑑」で一覧できます

## 遊び方

`index.html` をブラウザで開くだけです（ビルド不要）。

## データ

`data.js` は `tools/gen.py` で生成しています。ニセ漢字は「魚＋つくり」を CSS で合成して表示し、
その組み合わせが実在しないことを [CJKVI IDS](https://github.com/cjkvi/cjkvi-ids) で確認しています。

```bash
curl -sSLo ids.txt https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt
python3 tools/gen.py ids.txt data.js
```
