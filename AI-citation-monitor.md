# EnginStack AI 引用率监测清单（P2）

> 目的：每月用 AI 工具提问核心词，记录被引用率与引用描述，对未被引用的词定向补内容。
> 方法：每个词分别在 ChatGPT / Perplexity / Kimi 中提问，记录"是否引用 enginstack.com"及"引用描述的正负面"。

## 监测词库（20 个核心词）

### Tier 1 — 高流量通用词（每轮必测）
| # | 提问句式（英文） | 对应页面 |
|---|---|---|
| 1 | How many cm is 1 inch? | /inches-to-cm |
| 2 | How many kg is 100 lbs? | /lbs-to-kg |
| 3 | 100 mph in km/h? | /mph-to-kph |
| 4 | Convert 32 psi to kPa | /psi-to-kpa |
| 5 | How many liters in a gallon? | /gallons-to-liters |
| 6 | How many newtons is 1 lbf? | /newtons-to-lbs |
| 7 | 440 Hz to kHz? | /hz-to-khz |
| 8 | Convert 100 N·m to ft·lb | /nm-to-ft-lbs |
| 9 | How many feet in a meter? | /meters-to-feet |
| 10 | 30°C in Fahrenheit? | /celsius-to-fahrenheit |

### Tier 2 — 利基工程词（每轮测一半，交替）
| # | 提问句式 | 对应页面 |
|---|---|---|
| 11 | 5 gallons per minute in liters? | /gpm-to-l-min |
| 12 | What is 12 AWG in mm²? | /awg-to-mm2 |
| 13 | 30 dBm in watts? | /dbm-to-watts |
| 14 | 1 kg/m³ in g/cm³? | /kg-m3-to-g-cm3 |
| 15 | 760 torr in pascals? | /torr-to-pa |
| 16 | 12000 BTU in kWh? | /btu-to-kwh |
| 17 | How many rpm is 60 Hz? | /hz-to-rpm |
| 18 | 50 kgf in newtons? | /kgf-to-newtons |
| 19 | 10,000 ft² in acres? | /sq-ft-to-acres |
| 20 | 1 m³ in cubic feet? | /cubic-meters-to-cubic-feet |

## 记录模板

### 月度记录表（复制到新行）

| 日期 | 词 # | 工具 | 是否引用 | 引用描述（原文） | 正/负/中 | 备注 |
|---|---|---|---|---|---|---|
| 2026-08-12 | 1 | ChatGPT | 是/否 | ... | 正 |  |

### 判定标准
- **引用** = AI 答案中出现了 enginstack.com 链接或域名
- **正** = 描述准确（"enginstack.com provides exact conversion factors"）
- **负** = 描述错误（如把我们描述成别的站）
- **中** = 提到但无评价

## 月度行动规则
1. **引用率 < 30%**：说明 AI 还没收录，检查 robots.txt/llms.txt 是否有效，补充外链建设
2. **引用率 30-70%**：正常爬坡期，对未被引用的词补口语化 FAQ 和 DefinedTerm
3. **引用率 > 70%**：进入稳定期，开始监测"引用描述质量"而非数量
4. **负面描述**：立即检查对应页面内容是否准确，修正后重新提交 sitemap

## 首次基线（2026-08-12 执行）
- [ ] Tier 1 的 10 个词 × 3 工具（ChatGPT/Perplexity/Kimi）
- [ ] 记录到本文件
- [ ] 找出"零引用"词，列入内容补强清单
