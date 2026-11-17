/* 批量换算页面逻辑。依赖 dimensions.js。
   所有计算在本页完成，不发任何请求 —— 这是这个工具存在的理由。 */
(function () {
    'use strict';
    var D = window.EnginDimensions;
    if (!D) return;

    var srcEl = document.getElementById('bc-src');
    var tgtEl = document.getElementById('bc-target');
    var tbody = document.getElementById('bc-body');
    var emptyEl = document.getElementById('bc-empty');
    var wrapEl = document.getElementById('bc-tablewrap');
    var statEl = document.getElementById('bc-stat');
    var csvBtn = document.getElementById('bc-csv');
    var MAXLINES = 5000;
    var TOL = 0.0005;           // 两条换算结果相对差在 0.05% 内即视为同一个值
    var RATIO = 25.4;           // in ↔ mm，用来判断那对是不是「同一尺寸两种写法」

    var lastRows = [];

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* 取原文开头的那个数，用来判断两行是不是「数值差 25.4 倍」的 in/mm 写法。
       只取开头，是因为 5 ft 10 in 这种复合量没有单一的「数值部分」。 */
    function firstNum(raw) {
        var m = /^\s*(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+)/.exec(raw);
        if (!m) return null;
        var s = m[1].replace(',', '.');
        if (s.indexOf('/') >= 0) {
            var q = s.split('/'), d = parseFloat(q[1]);
            return d ? parseFloat(q[0]) / d : null;
        }
        return parseFloat(s);
    }

    function lines() {
        return srcEl.value.split(/\r?\n/).map(function (l) { return l.trim(); })
            .filter(function (l) { return l && l.charAt(0) !== '#'; });
    }

    function run() {
        var raw = lines();
        var target = tgtEl.value;
        var rows = [], truncated = raw.length > MAXLINES;

        raw.slice(0, MAXLINES).forEach(function (line, i) {
            var r = D.parse(line, target);
            if (r.error) {
                rows.push({ idx: i + 1, raw: line, ok: false, note: r.error });
            } else {
                rows.push({
                    idx: i + 1, raw: line, ok: true, value: r.value,
                    note: '', warn: false
                });
            }
        });

        // 两行换算后落在同一个值上：可能是同一尺寸的两种单位写法，也可能是重复录入。
        // 注意不能按「原值相差 25.4 倍」来判 —— 换算到同一基准后那对值是相等的，
        // 比值恒为 1，按倍数判永远抓不到。
        var okRows = rows.filter(function (r) { return r.ok; });
        for (var a = 0; a < okRows.length; a++) {
            var va = D.toNumber(okRows[a].value);
            if (!va) continue;
            for (var b = 0; b < okRows.length; b++) {
                if (a === b) continue;
                var vb = D.toNumber(okRows[b].value);
                if (!vb) continue;
                var denom = Math.max(Math.abs(va), Math.abs(vb));
                if (Math.abs(va - vb) / denom > TOL) continue;

                var note = 'same value as line ' + okRows[b].idx;
                var na = firstNum(okRows[a].raw), nb = firstNum(okRows[b].raw);
                if (na && nb) {
                    var q = Math.max(na, nb) / Math.min(na, nb);
                    if (Math.abs(q / RATIO - 1) <= 0.005) note += ' — written in inches and millimeters';
                }
                okRows[a].warn = true;
                if (!okRows[a].note) okRows[a].note = note;
                else if (okRows[a].note.indexOf('line ' + okRows[b].idx) < 0) {
                    okRows[a].note += '; also line ' + okRows[b].idx;
                }
            }
        }

        render(rows, target, truncated);
        lastRows = rows;
    }

    function render(rows, target, truncated) {
        var ok = 0, bad = 0, warn = 0;
        var html = '';

        rows.forEach(function (r) {
            if (!r.ok) {
                bad++;
                html += '<tr><td>' + r.idx + '</td><td class="num">' + esc(r.raw) + '</td>'
                    + '<td><span class="tool-badge bad">unreadable</span></td>'
                    + '<td>—</td><td>' + esc(r.note) + '</td></tr>';
                return;
            }
            ok++;
            if (r.warn) warn++;
            html += '<tr' + (r.warn ? ' class="warn"' : '') + '>'
                + '<td>' + r.idx + '</td>'
                + '<td class="num">' + esc(r.raw) + '</td>'
                + '<td><span class="tool-badge' + (r.warn ? ' warn' : '') + '">'
                + (r.warn ? 'check' : 'ok') + '</span></td>'
                + '<td class="num">' + esc(D.fmtIn(r.value, target, 6)) + '</td>'
                + '<td>' + esc(r.note) + '</td></tr>';
        });

        tbody.innerHTML = html;

        var thRes = document.getElementById('bc-th-result');
        if (thRes) thRes.textContent = 'Result (' + target + ')';

        var has = rows.length > 0;
        wrapEl.hidden = !has;
        emptyEl.hidden = has;
        csvBtn.disabled = ok === 0;

        var stat = '<span>Lines read <b>' + rows.length + '</b></span>'
            + '<span>Converted <b>' + ok + '</b></span>'
            + '<span>Unreadable <b>' + bad + '</b></span>'
            + '<span>To check <b>' + warn + '</b></span>'
            + '<span>Target unit <b>' + target + '</b></span>';
        if (truncated) stat += '<span><b>' + MAXLINES + '</b> line limit reached — the rest was not read</span>';
        statEl.innerHTML = stat;
        statEl.hidden = !has;
    }

    function toCsv() {
        var target = tgtEl.value;
        var out = ['line,input,status,value_' + target + ',note'];
        lastRows.forEach(function (r) {
            var cells = [
                String(r.idx),
                r.raw,
                r.ok ? (r.warn ? 'check' : 'ok') : 'unreadable',
                r.ok ? D.fmtIn(r.value, target, 6) : '',
                r.note || ''
            ].map(function (c) {
                c = String(c);
                return /[",\r\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
            });
            out.push(cells.join(','));
        });
        var blob = new Blob([out.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'converted-' + target + '.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            URL.revokeObjectURL(a.href);
            a.remove();
        }, 0);
    }

    srcEl.addEventListener('input', run);
    tgtEl.addEventListener('change', run);
    csvBtn.addEventListener('click', toCsv);

    Array.prototype.forEach.call(document.querySelectorAll('[data-sample]'), function (b) {
        b.addEventListener('click', function () {
            srcEl.value = b.getAttribute('data-sample').replace(/\\n/g, '\n');
            run();
        });
    });

    var clearBtn = document.getElementById('bc-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            srcEl.value = '';
            run();
            srcEl.focus();
        });
    }

    run();
}());
