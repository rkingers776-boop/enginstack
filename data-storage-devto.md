<!--
  ═══════════════════════════════════════════════════════════
  dev.to 发布前必做（30 秒，防止"重复内容"害了原站）：
  1. 发布后在文章编辑页拉到最底部，找到「Canonical URL」字段
  2. 填入：https://enginstack.com/guides/data-storage-conversion-guide
  3. 保存。这样 Google 会把原创权重归给 enginstack 原页，dev.to 只带流量。
  ═══════════════════════════════════════════════════════════
  dev.to 发布参数：
  - 封面图（Cover image）：可用 https://enginstack.com/og-image.png
  - 标签 Tags（最多 4 个）：computerscience, hardware, programming, storage
  - 系列 Series：可不填
  ═══════════════════════════════════════════════════════════
-->

# Why your 1 TB drive shows 931 GB — and a lawsuit couldn't change it

In 2004, a man named Orin Safier bought an 80 GB hard drive. His computer reported 74.5 GB. He wanted the missing 5.5 GB back — or his money.

The case, *Safier v. Western Digital*, became the legal test for a question that has annoyed every computer buyer since the 1980s: **why does the operating system always report less storage than the box promises?**

Western Digital's defense was simple, and it was legally correct. The drive contained exactly 80,000,000,000 bytes. Western Digital defined "gigabyte" as **one billion bytes (10⁹)**. Microsoft Windows defined "gigabyte" as **1,073,741,824 bytes (2³⁰)**.

The drive wasn't lying. The operating system wasn't lying. They were just speaking two different languages — and Safier lost the case.

But the confusion never went away. Today, every person who plugs in a 1 TB drive and sees 931 GB is seeing the exact same problem, still unfixed, twenty years later.

---

## Why your computer can't count to 1,000

Computers count in binary. That means everything is powers of 2, not powers of 10.

A programmer needs a "big" number that's close to 1,000, and the nearest power of 2 is:

```
2¹⁰ = 1,024
```

Close enough to 1,000 that early engineers just called it a "kilobyte" and moved on. The error was 2.4% — invisible on a 1980s floppy disk.

Then the prefixes stacked, and the error compounded:

| Unit | Decimal (marketing) | Binary (what Windows shows) | Gap |
|---|---|---|---|
| KB | 1,000 | 1,024 | 2.4% |
| MB | 1,000,000 | 1,048,576 | 4.9% |
| GB | 1,000,000,000 | 1,073,741,824 | **7.4%** |
| TB | 1,000,000,000,000 | 1,099,511,627,776 | **9.95%** |

That's the whole mystery in one table. A "1 TB" drive is 1,000,000,000,000 bytes (the decimal definition, which is what drive makers print). Windows divides by 1,099,511,627,776 (the binary definition), and the result is:

```
1,000,000,000,000 ÷ 1,099,511,627,776 = 0.9094 TB ≈ 931 GB
```

Nothing is broken. The box is honest. Windows is honest. The 9.95% is the distance between "counting like a human" and "counting like a transistor."

---

## 1998: the year someone tried to fix it (and everyone ignored them)

This isn't a new problem, and it isn't an unsolved one. In 1998, the International Electrotechnical Commission (IEC) proposed a clean split:

- **KB, MB, GB, TB** → always decimal (powers of 1,000)
- **KiB, MiB, GiB, TiB** → always binary (powers of 1,024)

So a hard drive should be labeled "1 TB" (1 trillion bytes), and Windows should report "931 GiB" (the binary amount). Problem solved. Everyone's right, no one's confused.

That was 27 years ago. Almost nobody uses KiB/MiB/GiB.

Why? Because the new units sound faintly ridiculous out loud — "gibibyte" — and because drive makers, software vendors, and marketing departments all benefit from the ambiguity. If you're selling storage, "1 TB" sounds bigger than "931 GB." If you're an operating system, showing "GiB" would confuse users who have never heard the term. The mess is *stable*. Every party has a reason to keep their own definition.

---

## Three operating systems, three interpretations of the same bytes

If you've ever moved a file between Windows and a Mac, you've seen the same file "change size":

- **Windows** → binary. Reports 1,000,000,000 bytes as "931 GB."
- **macOS** (since Snow Leopard, 10.6) → decimal. Reports the same bytes as "1 GB." Apple quietly switched in 2009.
- **Linux** → it depends. Most desktop tools now use decimal, but `df`, `ls`, and many CLI utilities still use binary (KiB/MiB/GiB), which is why the command line and the GUI can disagree.

The file never changed. Only the label did. When your Mac says "1.5 GB" and your Linux terminal says "1.4 GiB," the bytes are identical — you're just watching two conventions argue.

---

## Where the 7% stops being pedantic and starts costing money

For a 1 TB home drive, the gap is a curiosity. For anyone who buys or sells storage at scale, it's a line item.

**Cloud billing.** Most cloud providers bill in GiB (binary) while advertising in GB (decimal), or mix the two across different services. A 10 TB backup quoted one way and billed the other is a ~1 TB surprise on the invoice.

**NAS and RAID.** You buy "10 TB" drives, build a RAID, and the array reports 9.09 TiB. The usable capacity you planned around is 9% smaller than the marketing number — before RAID overhead even starts.

**The petabyte problem.** At PB scale, the gap widens to 12.6%. A "1 PB" storage pool is 1,125,899,906,842,624 binary bytes — the difference between the two definitions is now ~126 TB, which is itself a small data center.

This is the part people miss: **the confusion isn't shrinking with scale, it's growing.** A KB error is a rounding footnote; a PB error is a procurement decision.

---

## What to actually do with this

1. **Buying a drive** → multiply the box number by 0.93 to get what Windows will show. 1 TB → 931 GB. 2 TB → 1.86 TB.
2. **Seeing different numbers on Windows vs. Mac** → nothing is broken. It's decimal vs. binary labeling.
3. **Writing docs, specs, or contracts** → always state the definition. "GB" in a storage contract is a lawsuit waiting to happen; write "GB (10⁹)" or "GiB (2³⁰)" and remove the ambiguity.
4. **Estimating capacity at scale** → the compounding cheat: KB 2.4%, MB 4.9%, GB 7.4%, TB 9.95%, PB 12.6%. Round up as you go up.

---

*This is an excerpt from a longer technical reference on [EnginStack](https://enginstack.com/guides/data-storage-conversion-guide), an engineering unit-conversion site that traces every constant to NIST and international standards. If you found the binary-vs-decimal breakdown useful, you may also want:*

- [Data storage converters](https://enginstack.com/data-storage/) — KB↔MB↔GB↔TB in both definitions
- [Why America still doesn't use the metric system](https://enginstack.com/guides/why-america-doesnt-use-metric-system) — the same "two definitions" problem, applied to an entire country
