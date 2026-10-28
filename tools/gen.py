import sys, re, json
ids_path, out_path = sys.argv[1], sys.argv[2]

# 実在する ⿰魚X の X を収集
real = set()
for l in open(ids_path, encoding='utf-8'):
    if l.startswith('#'): continue
    p = l.rstrip('\n').split('\t')
    if len(p) < 3: continue
    for s in p[2:]:
        s = re.sub(r'\[.*?\]', '', s)
        m = re.fullmatch(r'⿰(?:魚|𩵋)(.+)', s)
        if m: real.add(m.group(1))

# お馴染み: 漢字 よみ つくり 偽つくり候補
EASY = """
鮪 まぐろ 有 右布灰存肴在
鯛 たい 周 用円週凋
鮭 さけ 圭 主生佳土王害奎畦封
鯖 さば 青 清責害表晴素
鰯 いわし 弱 溺弼翌嫋
鯵 あじ 参 惨珍彦衫尽須
鰹 かつお 堅 竪緊賢監臣腎
鰻 うなぎ 曼 漫慢最冒量蔓
鯉 こい 里 黒理重甲野黑
鮎 あゆ 占 点店帖粘
鱈 たら 雪 雷雲霜雨電震
鰤 ぶり 師 帥獅帰飾節追
鮫 さめ 交 校效絞咬
鯨 くじら 京 涼就諒掠
鰈 かれい 枼 葉喋蝶業某栄
鮃 ひらめ 平 坪評苹秤
鰆 さわら 春 椿奏泰秦舂香
鮒 ふな 付 府什竹村附対
鯰 なまず 念 含怠捻稔
鱒 ます 尊 噂遵酋樽導尋
鰐 わに 咢 号罟器骨呈品
鮑 あわび 包 句抱匂旬苞巴
鯱 しゃち 虎 虚慮彪虜處庖
鱚 きす 喜 嘉善吉嬉鼓憙
鮨 すし 旨 指皆昏香召百
鯔 ぼら 甾 留苗番田笛畠
鱸 すずき 盧 慮虜廬爐膚盛
鰊 にしん 柬 東練束凍陳棟
鱗 うろこ 粦 隣憐燐麟磷粼
鰓 えら 思 恩患田惠忠息
鰭 ひれ 耆 嗜箸署緒
鮟 あんこう 安 妥案宴要女晏
鱇 あんこう 康 慶糠慷穅
鰰 はたはた 神 袖伸紳社祖油
鱧 はも 豊 艶曲澧醴
鰍 かじか 秋 秒科私和炊秦
鱶 ふか 養 羨義善着美食
鰌 どじょう 酋 楢遒醜奠
鯏 あさり 利 刹列剃梨和制
𩸽 ほっけ 花 化芘茫芹華苑
"""

# 難読: 漢字 よみ[,別のよみ...]
HARD = """
魛 たちうお
魞 えり
魣 かます,たなご
魨 ふぐ
魪 かれい
魬 はまち,かれい
魭 あおうみがめ
魳 かます,ぶり
魴 ほうぼう,おしきうお,かがみだい
魵 えび
魷 いか
魹 とど
魦 ちちぶ,さめ,はぜ
鮀 なまず
鮄 ほうぼう,さば
鮅 ます
鮆 えつ
鮇 いわな
鮉 たい
鮊 しろうお,みごい
鮋 はや
鮍 かわはぎ
鮏 なまぐさい,さけ
鮐 ふぐ,さば
鮓 すし
鮖 かじか
鮗 このしろ
鮚 はまぐり
鮞 はらご
鮠 はや
鮦 かつお
鮧 なまず
鮩 にごい
鮬 たなご,せいご,からすみ
鮮 あざやか
鮱 ぼら
鮲 こち,まて
鮴 ごり,めばる
鮷 なまず
鮸 にべ,いしもち
鮹 たこ
鮻 ちちぶ,さめ
鮿 ほしうお
鯆 いるか
鯇 そうぎょ,あめのうお
鯈 はや,はえ
鯊 はぜ,さめ
鯎 うぐい
鯐 すばしり
鯑 かずのこ
鯒 こち
鯝 はらわた
鯟 かど,にしん
鯡 にしん
鯢 さんしょううお
鯣 するめ
鯤 はらご
鯥 むつ
鯧 まながつお
鯪 せんざんこう
鯫 みごい
鯯 このしろ
鯲 どじょう
鯳 すけそう
鯷 ひしこ,なまず,すけそう
鯸 ふぐ
鯹 なまぐさい
鯺 ふぐ
鯽 ふな
鯿 おしきうお
鰀 あめのうお
鰂 いか
鰄 おこぜ
鰉 ひがい
鰋 なまず
鰑 するめ,うなぎ
鰒 ふぐ,あわび
鰔 たら,かれい
鰕 えび
鰘 むろあじ
鰙 わかさぎ
鰚 はらか
鰛 いわし
鰜 にしん
鰝 えび
鰞 いか
鰡 ぼら
鰢 うみえび,すばしり
鰣 はす,このしろ
鰥 やもお
鰦 はや
鰧 おこぜ
鰨 かれい
鰩 えい,とびうお
鰪 まながつお
鰮 いわし
鰱 たなご
鰲 おおがめ
鰵 いしもち
鰶 このしろ
鰷 はや
鰺 あじ
鰽 このしろ
鰾 うきぶくろ,にべ
鱁 さめ
鱃 どじょう
鱅 このしろ
鱆 たこ
鱉 すっぽん
鱊 いさざ
鱎 みごい
鱏 えい,かじき
鱐 ほしうお
鱓 うつぼ,ごまめ,うみへび
鱔 うみへび,ごまめ
鱖 さけ
鱘 ちょうざめ,かじき
鱛 えそ
鱝 えい
鱞 やもめ
鱟 かぶとがに
鱠 なます
鱨 ぎぎ
鱩 はたはた
鱪 しいら
鱫 むつ
鱭 えつ
鱮 たなご
鱰 しいら
鱲 からすみ
鱵 さより
鱷 わに
鱺 うなぎ
魥 ひもの,こち
鯘 くさる
鱻 あたらしい
魡 つる
"""

# 難読問題は漢字を見せて読みを選ぶ。選択肢は実在の生き物名にするため分類する
# fish: 魚の名前 / creature: 魚以外の水の生き物 / other: 生き物以外（出題せず図鑑のみ）
CREATURE = set('いか たこ えび うみえび はまぐり あさり あわび とど いるか しゃち くじら わに すっぽん かぶとがに さんしょううお あおうみがめ おおがめ うみへび'.split())
OTHER = set('えり あざやか なまぐさい はらご はらわた かずのこ からすみ すし なます ほしうお ひもの うきぶくろ うろこ えら ひれ やもお やもめ くさる あたらしい つる するめ せんざんこう'.split())

def category(y):
    return 'creature' if y in CREATURE else 'other' if y in OTHER else 'fish'

easy = []
for l in EASY.strip().splitlines():
    k, y, t, cands = l.split()
    assert t in real, (k, t)
    fakes = [c for c in cands if c not in real and c != t]
    assert len(fakes) >= 3, (k, fakes)
    easy.append({"k": k, "y": [y], "t": t, "f": fakes[:3], "c": category(y)})

hard = []
seen = {e["k"] for e in easy}
for l in HARD.strip().splitlines():
    k, ys = l.split()
    assert k not in seen, k
    seen.add(k)
    ys = ys.split(',')
    hard.append({"k": k, "y": ys, "c": category(ys[0])})

print(len(easy), len(hard), len(easy) + len(hard), file=sys.stderr)
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('// さかなへんクイズ 出題データ（gen.py で生成）\n')
    f.write('// EASY: お馴染みの魚。t=つくり, f=偽のつくり（実在しない組み合わせ）\n')
    f.write('// HARD: 難読の魚へん漢字。y=よみ（先頭が出題用）, c=分類（fish/creature/other）\n')
    f.write('const EASY = ' + json.dumps(easy, ensure_ascii=False, indent=0).replace('\n', '') + ';\n')
    f.write('const HARD = ' + json.dumps(hard, ensure_ascii=False, indent=0).replace('\n', '') + ';\n')
