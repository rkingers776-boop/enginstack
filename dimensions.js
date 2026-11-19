/* ═══════════════════════════════════════════════════════════════════════
   EnginDimensions — exact-fraction mixed-unit parsing for length
   Extracted from https://enginstack.com
   License: MIT
   ═══════════════════════════════════════════════════════════════════════

   Why fractions and not floats
   ────────────────────────────
   A shop calculator has to add 3/8 + 5/16 + 1/64 and get exactly 45/64.
   In binary floating point that sum lands on 0.7031249999999999 and then
   prints as 45/64 only if you round hard enough. Every value here is a
   BigInt fraction over a metre base, so the arithmetic is closed: no value
   is ever approximated until the moment it is formatted for display.

   Everything is derived from the same exact definitions the site's
   converters use (1959 International Yard and Pound Agreement):
       1 in = 127/5000 m   1 ft = 381/1250 m   1 mi = 201168/125 m
   The factor table below is generated from _prec_defs.EX by
   _tools_model.py — do not edit it by hand.

   ── API ──────────────────────────────────────────────────────────────
     parse(str, defaultUnit)   → { value: F, parts: [...] } | { error }
     evalExpr(str, defaultUnit) → { value: F } | { error }
     fmtIn(value_m, unit, dp)  → "12.7"           decimal string
     fmtFtIn(value_m, denom)   → "5 ft 10 1/2 in" tape-measure form
     units()                   → [unit keys]
   ═══════════════════════════════════════════════════════════════════════ */

;(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.EnginDimensions = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ==== DATA-BEGIN (由 _tools_model.py --emit 生成，勿手改) ==== */
    var UNITS = [
        { key: 'mm', label: 'millimeter', short: 'mm', factor: '1/1000', aliases: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'] },
        { key: 'cm', label: 'centimeter', short: 'cm', factor: '1/100', aliases: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'] },
        { key: 'm', label: 'meter', short: 'm', factor: '1/1', aliases: ['m', 'meter', 'meters', 'metre', 'metres'] },
        { key: 'km', label: 'kilometer', short: 'km', factor: '1000/1', aliases: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'] },
        { key: 'in', label: 'inch', short: 'in', factor: '127/5000', aliases: ['in', 'inch', 'inches', '"', '”', '″'] },
        { key: 'ft', label: 'foot', short: 'ft', factor: '381/1250', aliases: ['ft', 'foot', 'feet', "'", '’', '′'] },
        { key: 'yd', label: 'yard', short: 'yd', factor: '1143/1250', aliases: ['yd', 'yard', 'yards'] },
        { key: 'mi', label: 'mile', short: 'mi', factor: '201168/125', aliases: ['mi', 'mile', 'miles'] }
    ];
    /* ==== DATA-END ==== */

    // ── BigInt fractions ─────────────────────────────────────────────

    function abs(a) { return a < 0n ? -a : a; }

    function gcd(a, b) {
        a = abs(a); b = abs(b);
        while (b) { var t = a % b; a = b; b = t; }
        return a || 1n;
    }

    function F(n, d) {
        n = BigInt(n);
        d = (d === undefined) ? 1n : BigInt(d);
        if (d === 0n) throw new Error('zero denominator');
        if (d < 0n) { n = -n; d = -d; }
        var g = gcd(n, d);
        return { n: n / g, d: d / g };
    }

    var ZERO = F(0), ONE = F(1);

    function add(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
    function sub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
    function mul(a, b) { return F(a.n * b.n, a.d * b.d); }
    function div(a, b) {
        if (b.n === 0n) throw new Error('division by zero');
        return F(a.n * b.d, a.d * b.n);
    }
    function isNeg(a) { return a.n < 0n; }
    function neg(a) { return { n: -a.n, d: a.d }; }
    function toNumber(a) { return Number(a.n) / Number(a.d); }

    // ── Unit table ───────────────────────────────────────────────────

    var BY_KEY = {}, ALIAS = {}, MAX_ALIAS = 0;
    UNITS.forEach(function (u) {
        var p = u.factor.split('/');
        u.F = F(BigInt(p[0]), BigInt(p[1]));
        BY_KEY[u.key] = u;
        u.aliases.forEach(function (a) {
            var k = a.toLowerCase();
            ALIAS[k] = u.key;
            if (k.length > MAX_ALIAS) MAX_ALIAS = k.length;
        });
    });

    // ' 与 " 的解释随上下文变：5' 10" 里 ' 是英尺，但在 5 ft 10' 里 ' 仍是英尺。
    // 单独出现时按符号本身判定，所以不参与上面的歧义合并。

    function units() { return UNITS.map(function (u) { return u.key; }); }
    function unitByKey(k) { return BY_KEY[k] || null; }

    // ── Decimal string → fraction ────────────────────────────────────

    function decToF(s) {
        s = String(s).trim();
        var neg_ = false;
        if (s.charAt(0) === '-') { neg_ = true; s = s.slice(1); }
        var dot = s.indexOf('.');
        if (dot < 0) return neg_ ? neg(F(BigInt(s))) : F(BigInt(s));
        var ip = s.slice(0, dot) || '0';
        var fp = s.slice(dot + 1);
        var den = 1n;
        for (var i = 0; i < fp.length; i++) den *= 10n;
        var v = F(BigInt(ip) * den + BigInt(fp || '0'), den);
        return neg_ ? neg(v) : v;
    }

    // ── Tokenizer ────────────────────────────────────────────────────
    // 输出 token: {t:'num', v:F} | {t:'unit', k:'ft'} | {t:'op', v:'+'} | {t:'lp'} | {t:'rp'}

    function tokenize(str) {
        var out = [], i = 0, s = String(str);
        var RX_NUM = /^\d+\s*\/\s*\d+|^\d+(?:[.,]\d+)?/;
        while (i < s.length) {
            var c = s.charAt(i);
            if (/\s/.test(c)) { i++; continue; }
            if (c === '+' || c === '-' || c === '*' || c === '/') {
                // '/' 紧跟数字且前面是数字 → 已由 RX_NUM 吃掉，不会走到这
                out.push({ t: 'op', v: c }); i++; continue;
            }
            if (c === '(') { out.push({ t: 'lp' }); i++; continue; }
            if (c === ')') { out.push({ t: 'rp' }); i++; continue; }
            if (c === '×' || c === '·') { out.push({ t: 'op', v: '*' }); i++; continue; }
            if (c === '÷') { out.push({ t: 'op', v: '/' }); i++; continue; }
            if (c === '"' || c === '”' || c === '″') { out.push({ t: 'unit', k: 'in' }); i++; continue; }
            if (c === "'" || c === '’' || c === '′') { out.push({ t: 'unit', k: 'ft' }); i++; continue; }

            // 单位词：最长匹配，且必须是完整词（后面不能紧跟字母）
            var rest = s.slice(i).toLowerCase(), hit = null;
            for (var len = Math.min(MAX_ALIAS, rest.length); len >= 1; len--) {
                var w = rest.slice(0, len);
                if (ALIAS[w]) {
                    var next = rest.charAt(len);
                    if (!next || !/[a-z]/.test(next)) { hit = ALIAS[w]; i += len; break; }
                }
            }
            if (hit) { out.push({ t: 'unit', k: hit }); continue; }

            var m = RX_NUM.exec(s.slice(i));
            if (m) {
                var raw = m[0].replace(/\s/g, '');
                i += m[0].length;
                if (raw.indexOf('/') >= 0) {
                    var q = raw.split('/');
                    var den = BigInt(q[1]);
                    if (den === 0n) return { error: 'zero denominator in fraction "' + raw + '"' };
                    out.push({ t: 'num', v: F(BigInt(q[0]), den), frac: true });
                } else {
                    out.push({ t: 'num', v: decToF(raw.replace(',', '.')) });
                }
                continue;
            }
            return { error: 'unexpected character "' + c + '" at position ' + (i + 1) };
        }
        return { tokens: out };
    }

    // ── Term → value ─────────────────────────────────────────────────
    // 一个 term 是「12 ft 3 1/2 in」这样的复合量，或「3/8 in」，或裸数字。

    function termValue(tokens, defaultUnit) {
        if (!tokens.length) return { error: 'empty measurement' };

        // 纯数字（含 3 1/2 这样的混合数）不乘单位系数，交由上层按上下文解释：
        // 单独出现时用默认单位，出现在乘法里则是标量，出现在加法里继承左侧单位。
        var hasUnitTok = false;
        for (var k = 0; k < tokens.length; k++) if (tokens[k].t === 'unit') { hasUnitTok = true; break; }

        if (!hasUnitTok) {
            var acc = ZERO, j = 0;
            while (j < tokens.length) {
                if (tokens[j].t !== 'num') return { error: 'expected a number' };
                acc = add(acc, tokens[j].v);
                j++;
            }
            return { raw: acc, hadUnit: false, value: mul(acc, BY_KEY[defaultUnit].F) };
        }

        var i = 0, total = ZERO, implied = null;
        while (i < tokens.length) {
            if (tokens[i].t !== 'num') return { error: 'expected a number' };
            var v = tokens[i].v;
            i++;

            // 混合数：3 1/2 —— 整数后紧跟一个分数，且分数 < 1
            while (i < tokens.length && tokens[i].t === 'num' && tokens[i].frac &&
                   Math.abs(toNumber(tokens[i].v)) < 1 && v.d === 1n) {
                v = add(v, tokens[i].v);
                i++;
            }

            var unitKey = null;
            if (i < tokens.length && tokens[i].t === 'unit') { unitKey = tokens[i].k; i++; }
            if (!unitKey) unitKey = implied || defaultUnit;
            else if (!implied) implied = unitKey;

            if (!BY_KEY[unitKey]) return { error: 'unknown unit "' + unitKey + '"' };
            total = add(total, mul(v, BY_KEY[unitKey].F));
        }
        return { raw: null, hadUnit: true, value: total };
    }

    // ── Recursive-descent expression parser ──────────────────────────
    // 支持 + - * / 与括号。乘法/除法必须在两个尺寸之间，结果带单位。

    function parse(s, defaultUnit) {
        defaultUnit = defaultUnit || 'mm';
        if (!BY_KEY[defaultUnit]) return { error: 'unknown default unit' };
        var tk = tokenize(s);
        if (tk.error) return { error: tk.error };
        var t = tk.tokens;
        if (!t.length) return { error: 'nothing to convert' };

        var pos = 0;

        function peek() { return t[pos] || null; }

        function parsePrimary() {
            var cur = peek();
            if (!cur) return { error: 'unexpected end of expression' };
            if (cur.t === 'lp') {
                pos++;
                var inner = parseSum();
                if (inner.error) return inner;
                if (!peek() || peek().t !== 'rp') return { error: 'missing closing bracket' };
                pos++;
                return inner;
            }
            if (cur.t === 'op' && (cur.v === '-' || cur.v === '+')) {
                pos++;
                var u = parsePrimary();
                if (u.error) return u;
                return cur.v === '-' ? { value: neg(u.value), hadUnit: u.hadUnit, raw: u.raw === null ? null : neg(u.raw) } : u;
            }
            // 收集连续的 num/unit token 作为一个 term
            var start = pos;
            while (pos < t.length && (t[pos].t === 'num' || t[pos].t === 'unit')) pos++;
            if (pos === start) return { error: 'expected a measurement' };
            var tv = termValue(t.slice(start, pos), defaultUnit);
            return tv.error ? tv : { value: tv.value, hadUnit: tv.hadUnit, raw: tv.raw };
        }

        function parseProduct() {
            var left = parsePrimary();
            if (left.error) return left;
            while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/')) {
                var op = t[pos++].v;
                var right = parsePrimary();
                if (right.error) return right;
                if (op === '*') {
                    // 尺寸 × 标量 合法；尺寸 × 尺寸 没有物理意义，明确拒绝而不是给出错单位
                    if (left.hadUnit && !right.hadUnit) {
                        left = { value: mul(left.value, right.raw), hadUnit: true, raw: null };
                    } else if (right.hadUnit && !left.hadUnit) {
                        left = { value: mul(right.value, left.raw), hadUnit: true, raw: null };
                    } else if (!left.hadUnit && !right.hadUnit) {
                        left = { value: mul(left.value, right.value), hadUnit: false, raw: mul(left.raw, right.raw) };
                    } else {
                        return { error: 'cannot multiply two measurements' };
                    }
                } else {
                    if (!left.hadUnit && !right.hadUnit) {
                        if (right.raw.n === 0n) return { error: 'division by zero' };
                        left = { value: div(left.value, right.value), hadUnit: false, raw: div(left.raw, right.raw) };
                    } else if (left.hadUnit && !right.hadUnit) {
                        if (right.raw.n === 0n) return { error: 'division by zero' };
                        left = { value: div(left.value, right.raw), hadUnit: true, raw: null };
                    } else {
                        return { error: 'cannot divide by a measurement' };
                    }
                }
            }
            return left;
        }

        function parseSum() {
            var left = parseProduct();
            if (left.error) return left;
            while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
                var op = t[pos++].v;
                var right = parseProduct();
                if (right.error) return right;
                // 相加时两边的裸数字都已按 defaultUnit 计过，所以单位一致，可直接加减。
                left = { value: op === '+' ? add(left.value, right.value) : sub(left.value, right.value),
                         hadUnit: left.hadUnit || right.hadUnit, raw: null };
            }
            return left;
        }

        var res = parseSum();
        if (res.error) return res;
        if (pos < t.length) return { error: 'unexpected "' + (t[pos].v || t[pos].k || '?') + '" at position ' + (pos + 1) };
        return { value: res.value };
    }

    // ── Formatting ───────────────────────────────────────────────────

    /**
     * Snap a fraction to the nearest 1/denom tick, half away from zero.
     * 只有这一份半进实现 —— fmtDecimal 与 fmtFtIn 都走它。
     * 之前两处各写一遍，改一处另一处不跟着动，属于必然漂移的结构。
     */
    function snapTicks(a, denom) {
        var scaled = mul(a, F(BigInt(denom)));
        var n = scaled.n, d = scaled.d;
        var q = n / d, r = n % d;
        if (abs(r) * 2n >= d) q += (n < 0n ? -1n : 1n);
        return q;
    }

    function pow10(k) {
        var s = 1n;
        for (var i = 0; i < k; i++) s *= 10n;
        return s;
    }

    /**
     * 按指定模式把分数吸到 1/scale 刻度上，返回刻度数（BigInt）。
     * half-up 必须委托给 snapTicks —— 半进只有那一份实现。
     */
    function snapMode(a, scale, mode) {
        if (!mode || mode === 'half-up') return snapTicks(a, scale);
        var s = mul(a, F(scale));
        var n = s.n, d = s.d;            // F 保证 d > 0
        var q = n / d, r = n % d;        // BigInt 除法向零取整
        if (mode === 'trunc') return q;
        if (mode === 'floor') return r < 0n ? q - 1n : q;
        if (mode === 'ceil') return r > 0n ? q + 1n : q;
        if (mode === 'half-even') {
            var two = abs(r) * 2n;
            if (two < d) return q;
            if (two > d) return q + (n < 0n ? -1n : 1n);
            return (q % 2n === 0n) ? q : q + (n < 0n ? -1n : 1n);
        }
        throw new Error('unknown rounding mode: ' + mode);
    }

    /**
     * 刻度数 → 定点字符串。整条格式化路径只有这一份。
     * keepZeros=true 时保留尾零（有效数字计数需要它，9.999→3 位是 10.0 不是 10）。
     */
    function decString(q, dp, keepZeros) {
        var neg_ = q < 0n;
        if (neg_) q = -q;
        var s = q.toString();
        var out;
        if (dp === 0) out = s;
        else {
            while (s.length <= dp) s = '0' + s;
            out = s.slice(0, s.length - dp) + '.' + s.slice(s.length - dp);
            if (!keepZeros) {
                out = out.replace(/\.?0+$/, '');
                if (out === '' || out === '-') out = '0';
            }
        }
        // 刻意不加千分位：这个字符串要能被复制进别的工具，也要能直接写进 CSV。
        // 带逗号的值粘到表格里会变成两列，导出的 CSV 也会错列。
        return (neg_ ? '-' : '') + out;
    }

    function toFixed(a, dp, mode, keepZeros) {
        dp = (dp === undefined) ? 6 : dp;
        if (dp < 0) dp = 0;
        return decString(snapMode(a, pow10(dp), mode), dp, keepZeros);
    }

    function roundHalfUp(a, dp) {
        var scale = pow10(dp);
        return F(snapTicks(a, scale), scale);
    }

    function fmtDecimal(a, dp) { return toFixed(a, dp, 'half-up'); }

    // ── 有效数字 ─────────────────────────────────────────────────────

    /**
     * 十进制字面量的有效数字位数。
     * 纯整数的尾部 0 不算有效（1200 → 2 位，1200. → 4 位），这是教科书口径。
     */
    function sigfigs(s) {
        s = String(s).trim().replace(/^[+-]/, '').replace(/[eE].*$/, '');
        if (s === '' || !/^\d*\.?\d+$|^\d+\.$/.test(s)) return 0;
        var digits = s.replace('.', '');
        var lead = digits.match(/^0*/)[0].length;
        digits = digits.slice(lead);
        if (digits === '') return 0;                        // 值为 0
        if (s.indexOf('.') === -1) digits = digits.replace(/0+$/, '');
        return digits.length;
    }

    /** floor(log10(|a|))，用整数比较求，不经过浮点（浮点在 10 的幂上会错一位）。 */
    function magExp(a) {
        var n = abs(a.n), d = a.d;
        if (n === 0n) return 0;
        function atLeast(k) {
            return k >= 0 ? n >= d * pow10(k) : n * pow10(-k) >= d;
        }
        var e = n.toString().length - d.toString().length;
        while (!atLeast(e)) e--;
        while (atLeast(e + 1)) e++;
        return e;
    }

    /**
     * 舍入到 n 位有效数字，保留尾零（否则 9.999 → 3 位会显示成 10，只剩 1 位）。
     * 进位跨量级时 dp 要减 1 重算。
     */
    function roundSig(a, n) {
        if (a.n === 0n) return '0';
        var dp = n - 1 - magExp(a);
        if (dp < 0) dp = 0;
        var out = toFixed(a, dp, 'half-up', true);
        if (sigfigs(out) > n && dp > 0) out = toFixed(a, dp - 1, 'half-up', true);
        return out;
    }

    // ── 公差写法 ─────────────────────────────────────────────────────

    /**
     * 解析公差。接受 ±0.005 / +0.005/-0.000 / +.005 -.000 / 0.005。
     * 返回 { plus, minus }：plus 是上偏差（≥0），minus 是下偏差（≤0）。
     * 单个数一律按对称公差理解。
     */
    function parseTolerance(s) {
        s = String(s === undefined || s === null ? '' : s).trim();
        if (s === '') return { error: 'empty tolerance' };
        var sym = s.indexOf('\u00b1') >= 0 || s.indexOf('+-') >= 0 || s.indexOf('+/-') >= 0;
        var nums = s.match(/[+-]?\s*\d*\.?\d+/g) || [];
        if (!nums.length) return { error: 'no number in tolerance: ' + s };
        function toF(t) {
            var neg_ = t.trim().charAt(0) === '-';
            var f = decToF(t.replace(/[\s+-]/g, ''));
            return neg_ ? neg(f) : f;
        }
        if (sym || nums.length === 1) {
            var v = toF(nums[0]);
            if (isNeg(v)) v = neg(v);
            return { plus: v, minus: neg(v) };
        }
        var a = toF(nums[0]), b = toF(nums[1]);
        if (isNeg(a) && !isNeg(b)) { var t = a; a = b; b = t; }
        if (isNeg(a)) a = neg(a);
        if (!isNeg(b)) b = neg(b);
        return { plus: a, minus: b };
    }

    function fmtIn(value_m, unitKey, dp) {
        var u = BY_KEY[unitKey];
        if (!u) return '?';
        return fmtDecimal(div(value_m, u.F), dp === undefined ? 6 : dp);
    }

    /**
     * Tape-measure form: nearest fraction of `denom` inches.
     * 5 ft 10 1/2 in. Negative values keep the sign on the whole string.
     */
    function fmtFtIn(value_m, denom, opts) {
        opts = opts || {};
        denom = denom || 16;
        var neg_ = isNeg(value_m);
        var v = neg_ ? neg(value_m) : value_m;
        var totalIn = div(v, BY_KEY['in'].F);

        // 吸附到 1/denom 英寸
        var q = snapTicks(totalIn, denom);
        // q 现在是「1/denom 英寸」的整数个数
        var ticksPerFoot = BigInt(12 * denom);
        var feet = q / ticksPerFoot;
        var remTicks = q % ticksPerFoot;
        var wholeIn = remTicks / BigInt(denom);
        var fracTicks = remTicks % BigInt(denom);

        // 约分分母
        var g = gcd(fracTicks, BigInt(denom));
        var fn_ = fracTicks / g, fd = BigInt(denom) / g;

        var parts = [];
        if (feet > 0n) parts.push(feet.toString() + ' ft');
        if (wholeIn > 0n || (fracTicks > 0n)) {
            var inStr = '';
            if (wholeIn > 0n) inStr += wholeIn.toString();
            if (fracTicks > 0n) {
                inStr += (wholeIn > 0n ? ' ' : '') + fn_.toString() + '/' + fd.toString();
            }
            parts.push(inStr + ' in');
        }
        if (!parts.length) parts.push('0 in');
        return (neg_ ? '-' : '') + parts.join(' ');
    }

    return {
        VERSION: '1.1.0',
        SOURCE: 'https://enginstack.com',
        LICENSE: 'MIT',
        // fractions
        F: F, add: add, sub: sub, mul: mul, div: div, neg: neg, toNumber: toNumber,
        // parsing
        parse: parse,
        evalExpr: function (s, u) { var r = parse(s, u); return r.error ? r : { value: r.value }; },
        // formatting
        fmtDecimal: fmtDecimal,
        fmtIn: fmtIn,
        fmtFtIn: fmtFtIn,
        // precision
        toFixed: toFixed,
        snapMode: snapMode,
        pow10: pow10,
        sigfigs: sigfigs,
        roundSig: roundSig,
        magExp: magExp,
        parseTolerance: parseTolerance,
        decToF: decToF,
        // table
        units: units,
        unitByKey: unitByKey,
        table: function () { return UNITS.map(function (u) { return { key: u.key, label: u.label, short: u.short, aliases: u.aliases.slice() }; }); }
    };
}));
