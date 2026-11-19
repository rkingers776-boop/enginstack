/* ═══════════════════════════════════════════════════════════════════════
   EnginDrawingCheck — table-level dimension checks for drawing and BOM text
   Extracted from https://enginstack.com
   License: MIT
   ═══════════════════════════════════════════════════════════════════════

   Why this is not a calculator
   ────────────────────────────
   Every other dimension tool on the web converts one number. The failures
   that actually reach a machine shop are table-shaped: one row in forty
   carries a millimetre value in an inch column, or a tolerance whose
   lower limit crossed above its upper after rounding. Checking those by
   eye is how the errors survive.

   So each checker below takes a pasted table, works row by row, and
   returns a verdict per row. Nothing is uploaded — the text never leaves
   the page. Values are carried as exact BigInt fractions from
   dimensions.js, so a limit comparison is never decided by float noise.

   ── API ──────────────────────────────────────────────────────────────
     checkToleranceTable(text, opts)  → { rows, summary, errors }
     convertDualUnit(text, opts)      → { rows, summary, errors }
     checkRoundTrip(text, opts)       → { rows, summary, errors }
     scanUnitMix(text, opts)          → { rows, summary, columns, errors }
     checkChainClosure(text, opts)    → { rows, summary, errors }
     toCSV(result)                    → string
   ═══════════════════════════════════════════════════════════════════════ */

;(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(require('./dimensions.js'));
    else root.DrawingCheck = factory(root.EnginDimensions);
}(typeof self !== 'undefined' ? self : this, function (D) {
    'use strict';

    var VERSION = '1.0.0';
    var ZERO = D.F(0);

    // ── 分数比较 ─────────────────────────────────────────────────────

    function cmp(a, b) {
        var l = a.n * b.d, r = b.n * a.d;
        return l < r ? -1 : (l > r ? 1 : 0);
    }
    function eq(a, b) { return cmp(a, b) === 0; }
    function lt(a, b) { return cmp(a, b) < 0; }
    function gt(a, b) { return cmp(a, b) > 0; }
    function absF(a) { return a.n < 0n ? D.neg(a) : a; }
    function minF(a, b) { return lt(a, b) ? a : b; }
    function unitF(key) {
        var u = D.unitByKey(key);
        return u ? u.F : null;
    }

    // ── 文本 → 行 ────────────────────────────────────────────────────

    /**
     * 按行切表。制表符优先，其次逗号、分号。
     * 空行与 # 开头的注释行跳过 —— 从 Excel 粘过来的区域常带表头注释。
     */
    function splitRows(text) {
        var out = [];
        var lines = String(text === undefined || text === null ? '' : text).split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (/^\s*$/.test(line)) continue;
            if (/^\s*#/.test(line)) continue;
            var sep = line.indexOf('\t') >= 0 ? '\t' : (line.indexOf(';') >= 0 && line.indexOf(',') < 0 ? ';' : ',');
            var cells = line.split(sep);
            for (var j = 0; j < cells.length; j++) cells[j] = cells[j].trim();
            out.push({ no: i + 1, cells: cells });
        }
        return out;
    }

    /** 单值单元格 → 米基准的分数。允许带单位，允许分数写法。 */
    function parseVal(cell, def) {
        var r = D.parse(String(cell), def);
        if (r.error) return { error: r.error };
        return { v: r.value };
    }

    /**
     * 偏差单元格 → 带符号的分数（仍是该单位的数值，未乘单位系数）。
     * "+0.005" / "-0.000" / "±0.002" / "0.005" 都要吃得下。
     */
    function parseDev(cell, def) {
        var s = String(cell === undefined || cell === null ? '' : cell).trim();
        if (s === '') return { v: ZERO };
        var sym = s.indexOf('\u00b1') >= 0 || s.indexOf('+-') >= 0 || s.indexOf('+/-') >= 0;
        var negative = !sym && s.charAt(0) === '-';
        var body = s.replace(/^[\u00b1+-]+\s*/, '').replace(/^[+-]\s*/, '');
        var r = D.parse(body, def);
        if (r.error) return { error: r.error };
        return { v: negative ? D.neg(r.value) : r.value };
    }

    /** 单元格里显式写出的单位（用来判断混用）；没写返回 null。 */
    var RX_UNIT = /(?:^|[\s\d)])(mm|cm|km|m|in|inch|inches|ft|foot|feet|yd|mi|"|\u2033|\u201d|'|\u2032|\u2019)\s*$/i;
    function unitToken(cell) {
        var s = String(cell === undefined || cell === null ? '' : cell).trim();
        // 负号与数字之外的尾巴才是单位；"0.750 in" 命中 in，"0.750" 命中 null
        var m = RX_UNIT.exec(s);
        if (!m) return null;
        var t = m[1].toLowerCase();
        if (t === '"' || t === '\u2033' || t === '\u201d') return 'in';
        if (t === "'" || t === '\u2032' || t === '\u2019') return 'ft';
        if (t === 'inch' || t === 'inches') return 'in';
        if (t === 'foot' || t === 'feet') return 'ft';
        return t;
    }

    // ── 格式化 ───────────────────────────────────────────────────────

    function fmtV(vMeters, unit, dp) {
        var f = unitF(unit);
        if (!f) return '?';
        return D.toFixed(D.div(vMeters, f), dp, 'half-up');
    }

    function dpOf(opts, dflt) {
        var d = opts && opts.dp;
        return (d === undefined || d === null) ? dflt : d;
    }

    // ══════════════════════════════════════════════════════════════════
    // 1. 公差表判定
    // ══════════════════════════════════════════════════════════════════

    /**
     * cols: 4 列 → 标称, 上偏差, 下偏差, 实测
     *       3 列 → 标称, 公差(单格，可写 ±0.005), 实测
     * verdict: pass / limit / fail
     */
    function checkToleranceTable(text, opts) {
        opts = opts || {};
        var unit = opts.unit || 'in', dp = dpOf(opts, 4);
        var rows = splitRows(text), out = [], errors = [];
        var nPass = 0, nLimit = 0, nFail = 0;

        for (var i = 0; i < rows.length; i++) {
            var r = rows[i], c = r.cells;
            if (c.length < 3) {
                errors.push({ no: r.no, reason: 'need at least 3 columns, got ' + c.length });
                continue;
            }
            var nominal = parseVal(c[0], unit);
            if (nominal.error) { errors.push({ no: r.no, reason: 'nominal: ' + nominal.error }); continue; }

            var plus, minus, actual;
            if (c.length >= 4) {
                plus = parseDev(c[1], unit);
                minus = parseDev(c[2], unit);
                actual = parseVal(c[3], unit);
            } else {
                var t = D.parseTolerance(c[1]);
                if (t.error) { errors.push({ no: r.no, reason: 'tolerance: ' + t.error }); continue; }
                var f = unitF(unit);
                plus = { v: D.mul(t.plus, f) };
                minus = { v: D.mul(t.minus, f) };
                actual = parseVal(c[2], unit);
            }
            if (plus.error) { errors.push({ no: r.no, reason: 'upper: ' + plus.error }); continue; }
            if (minus.error) { errors.push({ no: r.no, reason: 'lower: ' + minus.error }); continue; }
            if (actual.error) { errors.push({ no: r.no, reason: 'actual: ' + actual.error }); continue; }

            // 下偏差必须 ≤ 0 ≤ 上偏差，否则公差带本身是坏的
            var inverted = false;
            if (gt(plus.v, ZERO) && gt(minus.v, ZERO)) inverted = true;
            if (lt(plus.v, ZERO) && lt(minus.v, ZERO)) inverted = true;
            if (gt(minus.v, plus.v)) inverted = true;

            var nom = nominal.v;
            var hi = D.add(nom, plus.v), lo = D.add(nom, minus.v);
            var v = actual.v;
            var verdict, note;
            if (inverted) {
                verdict = 'fail'; note = 'tolerance band inverted';
            } else if (lt(v, lo)) {
                verdict = 'fail'; note = 'below lower limit';
            } else if (gt(v, hi)) {
                verdict = 'fail'; note = 'above upper limit';
            } else if (eq(v, lo) || eq(v, hi)) {
                verdict = 'limit'; note = 'exactly at limit';
            } else {
                verdict = 'pass'; note = '';
            }
            if (verdict === 'pass') nPass++;
            else if (verdict === 'limit') nLimit++;
            else nFail++;

            out.push({
                no: r.no, raw: c, verdict: verdict, note: note,
                cols: [c[0], c[1] + (c.length >= 4 ? ' ' + c[2] : ''), c[c.length - 1],
                       fmtV(lo, unit, dp), fmtV(hi, unit, dp),
                       fmtV(minF(D.sub(v, lo), D.sub(hi, v)), unit, dp)],
                lower: lo, upper: hi, value: v
            });
        }

        return {
            rows: out, errors: errors,
            summary: { total: out.length, pass: nPass, limit: nLimit, fail: nFail,
                       unit: unit, dp: dp, skipped: errors.length }
        };
    }

    // ══════════════════════════════════════════════════════════════════
    // 2. 双单位换算（公差随动）
    // ══════════════════════════════════════════════════════════════════

    /**
     * cols: 2 列 → 标称, 对称公差
     *       3 列 → 标称, 上偏差, 下偏差
     * 输出的公差带按目标单位取整后，带宽会变 —— 这里把变化量算出来。
     */
    function convertDualUnit(text, opts) {
        opts = opts || {};
        var from = opts.from || 'in', to = opts.to || 'mm', dp = dpOf(opts, 3);
        var rows = splitRows(text), out = [], errors = [];
        var nWidened = 0, nNarrowed = 0, nInvalid = 0;

        for (var i = 0; i < rows.length; i++) {
            var r = rows[i], c = r.cells;
            if (c.length < 1) continue;
            var nominal = parseVal(c[0], from);
            if (nominal.error) { errors.push({ no: r.no, reason: 'nominal: ' + nominal.error }); continue; }

            var ff = unitF(from), tf = unitF(to);
            var plusM, minusM;
            if (c.length >= 3) {
                // parseDev 返回的已经是米基准，不能再乘单位系数
                var pd = parseDev(c[1], from), md = parseDev(c[2], from);
                if (pd.error) { errors.push({ no: r.no, reason: 'upper: ' + pd.error }); continue; }
                if (md.error) { errors.push({ no: r.no, reason: 'lower: ' + md.error }); continue; }
                plusM = pd.v; minusM = md.v;
            } else if (c.length === 2) {
                // parseTolerance 返回的是该单位下的裸数，必须乘系数才到米
                var t = D.parseTolerance(c[1]);
                if (t.error) { errors.push({ no: r.no, reason: 'tolerance: ' + t.error }); continue; }
                plusM = D.mul(t.plus, ff); minusM = D.mul(t.minus, ff);
            } else {
                plusM = ZERO; minusM = ZERO;
            }

            var nomM = nominal.v;
            var hiM = D.add(nomM, plusM);
            var loM = D.add(nomM, minusM);

            // 换算到目标单位并取整
            var nomT = D.div(nomM, tf), hiT = D.div(hiM, tf), loT = D.div(loM, tf);
            var nomR = roundTo(nomT, dp), hiR = roundTo(hiT, dp), loR = roundTo(loT, dp);

            var bandExact = D.sub(hiT, loT);
            var bandRounded = D.sub(hiR, loR);
            var delta = D.sub(bandRounded, bandExact);

            var flag = 'same';
            if (!eq(delta, ZERO)) flag = gt(delta, ZERO) ? 'widened' : 'narrowed';
            if (flag === 'widened') nWidened++;
            if (flag === 'narrowed') nNarrowed++;

            // 取整后上限掉到标称以下 = 公差带被取整毁掉
            var broken = gt(nomR, hiR) || lt(nomR, loR);
            if (broken) { flag = 'broken'; nInvalid++; }

            var fdp = dpOf(opts, 3);
            out.push({
                no: r.no, raw: c, verdict: broken ? 'fail' : (flag === 'same' ? 'pass' : 'limit'),
                note: broken ? 'rounding collapsed the band'
                    : (flag === 'same' ? '' : 'band ' + flag + ' by ' + fmtV(D.mul(absF(delta), tf), to, dp + 1)),
                cols: [c[0], D.toFixed(nomR, fdp), D.toFixed(loR, fdp), D.toFixed(hiR, fdp),
                       (gt(delta, ZERO) ? '+' : '') + fmtV(D.mul(delta, tf), to, dp + 1)],
                nominal: nomR, lower: loR, upper: hiR, delta: delta
            });
        }

        return {
            rows: out, errors: errors,
            summary: { total: out.length, widened: nWidened, narrowed: nNarrowed,
                       broken: nInvalid, from: from, to: to, dp: dp, skipped: errors.length }
        };
    }

    /** 分数按 dp 位小数取整，返回分数（仍是精确值，只是刻度变了）。 */
    function roundTo(a, dp) {
        var scale = D.pow10(dp);
        return D.F(D.snapMode(a, scale, 'half-up'), scale);
    }

    // ══════════════════════════════════════════════════════════════════
    // 3. 往返闭合校验
    // ══════════════════════════════════════════════════════════════════

    /**
     * 一列值（各自带单位或统一用 opts.from）→ 换成 target → 再换回来。
     * 判定是否能回到原值；回不去的给出「最少需要几位小数」。
     * 这正是不同换算网站给出不同答案的机制：中间值被取整了。
     */
    function checkRoundTrip(text, opts) {
        opts = opts || {};
        var from = opts.from || 'in', to = opts.to || 'mm', dp = dpOf(opts, 3);
        var rows = splitRows(text), out = [], errors = [];
        var nClosed = 0, nLossy = 0;

        for (var i = 0; i < rows.length; i++) {
            var r = rows[i], c = r.cells;
            var cell = c[0];
            if (cell === undefined || cell === '') continue;
            var src = unitToken(cell) || from;
            var val = parseVal(cell, src);
            if (val.error) { errors.push({ no: r.no, reason: cell + ': ' + val.error }); continue; }

            var v = val.v;                           // 米基准
            var outStr = fmtV(v, to, dp);
            var back = D.parse(outStr + ' ' + to, 'm');
            var loss = back.error ? null : D.sub(back.value, v);
            var closed = loss !== null && eq(loss, ZERO);

            // 最小能闭合的小数位（0..12）
            var needDp = -1;
            for (var k = 0; k <= 12; k++) {
                var s2 = fmtV(v, to, k);
                var b2 = D.parse(s2 + ' ' + to, 'm');
                if (!b2.error && eq(b2.value, v)) { needDp = k; break; }
            }
            if (closed) nClosed++; else nLossy++;

            out.push({
                no: r.no, raw: c,
                verdict: closed ? 'pass' : 'fail',
                note: closed ? '' : ('lost ' + (loss === null ? '?' : fmtV(absF(loss), to, 12)) + ' ' + to
                                    + (needDp >= 0 ? ' · closes at ' + needDp + ' dp' : ' · never closes at any dp')),
                cols: [cell, src, outStr, closed ? 'closed' : 'lossy',
                       needDp >= 0 ? String(needDp) : 'n/a'],
                loss: loss, needDp: needDp
            });
        }

        return {
            rows: out, errors: errors,
            summary: { total: out.length, closed: nClosed, lossy: nLossy,
                       from: from, to: to, dp: dp, skipped: errors.length }
        };
    }

    // ══════════════════════════════════════════════════════════════════
    // 4. 单位混用扫描
    // ══════════════════════════════════════════════════════════════════

    /**
     * 逐列统计单位token，找出「同一列里单位不一致」和「该写单位却没写」的行。
     * 图纸/清单里最贵的错误不是算错，是有人把 mm 填进了 inch 那一列。
     */
    function scanUnitMix(text, opts) {
        opts = opts || {};
        var rows = splitRows(text), errors = [];
        if (!rows.length) return { rows: [], columns: [], errors: errors,
                                   summary: { total: 0, columns: 0, mixed: 0, bare: 0 } };

        var nCols = 0;
        for (var i = 0; i < rows.length; i++) nCols = Math.max(nCols, rows[i].cells.length);

        // 每列的单位直方图
        var hist = [];
        for (var k = 0; k < nCols; k++) hist.push({});
        var tokens = [];
        for (var j = 0; j < rows.length; j++) {
            var row = [];
            for (var m = 0; m < nCols; m++) {
                var t = unitToken(rows[j].cells[m]);
                row.push(t);
                if (t) hist[m][t] = (hist[m][t] || 0) + 1;
            }
            tokens.push(row);
        }

        // 每列的主单位。平局时置 null —— 一列里 mm 和 in 各占一半，
        // 说「主单位是 mm」是编出来的，此时不该给任何行下结论。
        var dominant = [];
        for (var d = 0; d < nCols; d++) {
            var best = null, bestN = 0, tie = false;
            for (var u in hist[d]) {
                if (!hist[d].hasOwnProperty(u)) continue;
                if (hist[d][u] > bestN) { best = u; bestN = hist[d][u]; tie = false; }
                else if (hist[d][u] === bestN) { tie = true; }
            }
            dominant.push(tie ? null : best);
        }

        var out = [], nMixed = 0, nBare = 0;
        for (var p = 0; p < rows.length; p++) {
            var flags = [], verdicts = [];
            for (var q = 0; q < nCols; q++) {
                var tok = tokens[p][q], dom = dominant[q];
                var cell = rows[p].cells[q];
                if (cell === undefined || cell === '') { verdicts.push('empty'); continue; }
                if (!dom) { verdicts.push('ok'); continue; }          // 整列都没有单位
                if (tok === null) { verdicts.push('bare'); flags.push('col ' + (q + 1) + ' has no unit'); continue; }
                if (tok !== dom) { verdicts.push('mixed'); flags.push('col ' + (q + 1) + ' reads ' + tok + ', column is ' + dom); continue; }
                verdicts.push('ok');
            }
            var v = 'ok';
            if (flags.some(function (f) { return /reads/.test(f); })) { v = 'fail'; nMixed++; }
            else if (flags.length) { v = 'limit'; nBare++; }
            out.push({ no: rows[p].no, raw: rows[p].cells, verdict: v,
                       note: flags.join('; '), cols: rows[p].cells.concat([verdicts.join(' ')]) });
        }

        var columns = [];
        for (var z = 0; z < nCols; z++) columns.push({ index: z + 1, dominant: dominant[z], hist: hist[z] });

        return {
            rows: out, columns: columns, errors: errors,
            summary: { total: out.length, columns: nCols, mixed: nMixed, bare: nBare }
        };
    }

    // ══════════════════════════════════════════════════════════════════
    // 5. 尺寸链闭合
    // ══════════════════════════════════════════════════════════════════

    /**
     * cols: 2 列 → 长度, 对称公差；3 列 → 长度, 上偏差, 下偏差
     * opts.target / targetPlus / targetMinus：总长与总长公差（同单位）
     * 最坏情况：各段取极值，比较总长与目标，给出余隙区间。
     */
    function checkChainClosure(text, opts) {
        opts = opts || {};
        var unit = opts.unit || 'in', dp = dpOf(opts, 4);
        var rows = splitRows(text), out = [], errors = [];

        var sumNom = ZERO, sumUp = ZERO, sumLo = ZERO;
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i], c = r.cells;
            if (c.length < 1 || c[0] === '') continue;
            var len = parseVal(c[0], unit);
            if (len.error) { errors.push({ no: r.no, reason: 'length: ' + len.error }); continue; }

            var plus, minus;
            if (c.length >= 3) { plus = parseDev(c[1], unit); minus = parseDev(c[2], unit); }
            else if (c.length === 2) {
                var t = D.parseTolerance(c[1]);
                if (t.error) { errors.push({ no: r.no, reason: 'tolerance: ' + t.error }); continue; }
                var f = unitF(unit);
                plus = { v: D.mul(t.plus, f) }; minus = { v: D.mul(t.minus, f) };
            } else { plus = { v: ZERO }; minus = { v: ZERO }; }
            if (plus.error) { errors.push({ no: r.no, reason: 'upper: ' + plus.error }); continue; }
            if (minus.error) { errors.push({ no: r.no, reason: 'lower: ' + minus.error }); continue; }

            sumNom = D.add(sumNom, len.v);
            if (gt(plus.v, ZERO)) sumUp = D.add(sumUp, plus.v);
            if (lt(minus.v, ZERO)) sumLo = D.add(sumLo, minus.v);

            out.push({
                no: r.no, raw: c, verdict: 'ok', note: '',
                cols: [c[0], fmtV(len.v, unit, dp),
                       fmtV(D.add(len.v, plus.v), unit, dp), fmtV(D.add(len.v, minus.v), unit, dp)],
                value: len.v
            });
        }

        // 目标尺寸
        var hasTarget = opts.target !== undefined && opts.target !== null && String(opts.target) !== '';
        if (!hasTarget) {
            return { rows: out, errors: errors,
                     summary: { total: out.length, sum: fmtV(sumNom, unit, dp),
                                upper: fmtV(D.add(sumNom, sumUp), unit, dp),
                                lower: fmtV(D.add(sumNom, sumLo), unit, dp),
                                verdict: 'no-target', unit: unit, dp: dp } };
        }
        var tgt = parseVal(opts.target, unit);
        if (tgt.error) {
            errors.push({ no: 0, reason: 'target: ' + tgt.error });
            return { rows: out, errors: errors, summary: { total: out.length, verdict: 'bad-target' } };
        }
        var f2 = unitF(unit);
        var tp = D.parseTolerance(opts.targetPlus === undefined ? '0' : String(opts.targetPlus));
        var tm = D.parseTolerance(opts.targetMinus === undefined ? '0' : String(opts.targetMinus));
        var tUp = tp.error ? ZERO : D.mul(tp.plus, f2);
        var tLo = tm.error ? ZERO : D.mul(tm.minus, f2);

        // 余隙 = 目标 - 实际；两端口都要考虑
        var clrMax = D.sub(D.add(tgt.v, tUp), D.add(sumNom, sumLo));
        var clrMin = D.sub(D.add(tgt.v, tLo), D.add(sumNom, sumUp));

        var verdict, note;
        if (gt(clrMax, ZERO) && gt(clrMin, ZERO)) { verdict = 'clearance'; note = 'always fits'; }
        else if (lt(clrMax, ZERO) && lt(clrMin, ZERO)) { verdict = 'interference'; note = 'never fits — always too long'; }
        else if (lt(clrMin, ZERO)) { verdict = 'marginal'; note = 'can interfere at worst case'; }
        else { verdict = 'marginal'; note = 'may leave a gap at worst case'; }

        return {
            rows: out, errors: errors,
            summary: { total: out.length, sum: fmtV(sumNom, unit, dp),
                       upper: fmtV(D.add(sumNom, sumUp), unit, dp),
                       lower: fmtV(D.add(sumNom, sumLo), unit, dp),
                       target: fmtV(tgt.v, unit, dp),
                       clearanceMin: fmtV(clrMin, unit, dp),
                       clearanceMax: fmtV(clrMax, unit, dp),
                       verdict: verdict, note: note, unit: unit, dp: dp }
        };
    }

    // ── CSV 导出 ─────────────────────────────────────────────────────

    function esc(s) {
        s = String(s === undefined || s === null ? '' : s);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }

    /** 通用导出：表头 + 每行的 cols，外加结论列。 */
    function toCSV(result, header) {
        var lines = [];
        if (header && header.length) lines.push(header.map(esc).join(','));
        var rows = (result && result.rows) || [];
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var cells = [String(r.no)].concat(r.cols || []);
            cells.push(r.verdict || '');
            cells.push(r.note || '');
            lines.push(cells.map(esc).join(','));
        }
        return lines.join('\r\n');
    }

    return {
        VERSION: VERSION,
        SOURCE: 'https://enginstack.com',
        LICENSE: 'MIT',
        splitRows: splitRows,
        unitToken: unitToken,
        checkToleranceTable: checkToleranceTable,
        convertDualUnit: convertDualUnit,
        checkRoundTrip: checkRoundTrip,
        scanUnitMix: scanUnitMix,
        checkChainClosure: checkChainClosure,
        toCSV: toCSV
    };
}));
