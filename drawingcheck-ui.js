/* 图纸校验工具的共用界面层。
   五个页面共用这一个文件：body[data-tool] 决定调哪个校验器、表头长什么样。
   校验逻辑全在 drawingcheck.js，这里只负责取值、渲染、导出。 */
(function () {
    'use strict';

    var C = window.DrawingCheck;
    var D = window.EnginDimensions;
    if (!C || !D) return;

    var tool = document.body.getAttribute('data-tool') || '';
    var $ = function (id) { return document.getElementById(id); };
    var E_IN = $('dc-in'), E_UNIT = $('dc-unit'), E_DP = $('dc-dp'), E_TO = $('dc-to');
    var E_TARGET = $('dc-target'), E_TPLUS = $('dc-target-plus'), E_TMINUS = $('dc-target-minus');
    var E_RUN = $('dc-run'), E_CSV = $('dc-csv'), E_ERR = $('dc-err'), E_OUT = $('dc-out');
    if (!E_IN || !E_OUT) return;

    var HEADERS = {
        'tolerance-table': ['Row', 'Nominal', 'Tolerance', 'Actual', 'Lower', 'Upper', 'Margin', 'Verdict'],
        'dual-unit': ['Row', 'Input', 'Nominal', 'Lower', 'Upper', 'Band change', 'Verdict'],
        'round-trip': ['Row', 'Input', 'Read as', 'Converted', 'Round-trip', 'Min dp', 'Verdict'],
        'unit-mix': null,              // 列数由输入决定
        'chain-closure': ['Row', 'Input', 'Nominal', 'Upper', 'Lower', 'Verdict']
    };

    var LABEL = {
        pass: 'PASS', fail: 'FAIL', limit: 'AT LIMIT', ok: 'OK',
        clearance: 'CLEARANCE', interference: 'INTERFERENCE', marginal: 'MARGINAL'
    };
    var CLS = { pass: 'pass', fail: 'fail', limit: 'warn', ok: '', clearance: 'pass', interference: 'fail', marginal: 'warn' };

    function esc(s) {
        return String(s === undefined || s === null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function num(v) { return v === undefined || v === null ? '' : String(v); }

    var lastResult = null;

    function run() {
        var text = E_IN.value;
        var unit = E_UNIT ? E_UNIT.value : 'in';
        var dp = E_DP ? parseInt(E_DP.value, 10) : 3;
        var to = E_TO ? E_TO.value : 'mm';
        var res;

        try {
            if (tool === 'tolerance-table') {
                res = C.checkToleranceTable(text, { unit: unit, dp: dp });
            } else if (tool === 'dual-unit') {
                res = C.convertDualUnit(text, { from: unit, to: to, dp: dp });
            } else if (tool === 'round-trip') {
                res = C.checkRoundTrip(text, { from: unit, to: to, dp: dp });
            } else if (tool === 'unit-mix') {
                res = C.scanUnitMix(text, {});
            } else if (tool === 'chain-closure') {
                res = C.checkChainClosure(text, {
                    unit: unit, dp: dp,
                    target: E_TARGET ? E_TARGET.value : '',
                    targetPlus: E_TPLUS ? E_TPLUS.value : '0',
                    targetMinus: E_TMINUS ? E_TMINUS.value : '0'
                });
            }
        } catch (e) {
            showError('Check failed: ' + e.message);
            return;
        }
        if (!res) return;
        lastResult = res;
        render(res);
    }

    function showError(msg) {
        E_ERR.textContent = msg;
        E_ERR.hidden = false;
        E_OUT.innerHTML = '';
        lastResult = null;
    }

    function statsHtml(res) {
        var s = res.summary || {};
        var cells = [];
        function add(label, value, cls) {
            if (value === undefined || value === null || value === '') return;
            cells.push('<div class="tool-stat"><b' + (cls ? ' class="' + cls + '"' : '') + '>' +
                esc(value) + '</b><span>' + esc(label) + '</span></div>');
        }
        if (tool === 'tolerance-table') {
            add('rows', s.total); add('pass', s.pass); add('at limit', s.limit); add('fail', s.fail);
        } else if (tool === 'dual-unit') {
            add('rows', s.total); add('band widened', s.widened); add('band narrowed', s.narrowed); add('broken', s.broken);
        } else if (tool === 'round-trip') {
            add('rows', s.total); add('closed', s.closed); add('lossy', s.lossy);
        } else if (tool === 'unit-mix') {
            add('rows', s.total); add('columns', s.columns); add('wrong unit', s.mixed); add('no unit', s.bare);
        } else if (tool === 'chain-closure') {
            add('segments', s.total); add('sum', s.sum);
            add('worst high', s.upper); add('worst low', s.lower);
            if (s.verdict && s.verdict !== 'no-target') {
                add('verdict', LABEL[s.verdict] || s.verdict);
            }
            if (s.clearanceMin !== undefined) { add('clearance min', s.clearanceMin); add('clearance max', s.clearanceMax); }
        }
        if (s.skipped) add('skipped', s.skipped);
        return cells.length ? '<div class="tool-stats">' + cells.join('') + '</div>' : '';
    }

    function render(res) {
        E_ERR.hidden = true;
        var parts = [];

        // 尺寸链的结论要显眼：唯一一处「一句话判定」
        if (tool === 'chain-closure' && res.summary && res.summary.note) {
            parts.push('<p class="tool-result-sub" style="margin-top:0"><strong>' +
                esc(res.summary.note) + '</strong></p>');
        }

        parts.push(statsHtml(res));

        var rows = res.rows || [];
        if (!rows.length) {
            parts.push('<p class="tool-hint">No rows read. Put one measurement per line, columns separated by commas or tabs.</p>');
        } else {
            var head = HEADERS[tool] || (function () {
                // 混用扫描：列数由输入决定，表头按实际列数生成
                var n = rows[0].cols.length - 1;
                var h = ['Row'];
                for (var i = 0; i < n; i++) h.push('Col ' + (i + 1));
                h.push('Verdict');
                return h;
            })();

            var body = rows.map(function (r) {
                var tds = r.cols.map(function (c, i) {
                    return '<td' + (i === 0 ? ' class="raw"' : '') + '>' + esc(num(c)) + '</td>';
                }).join('');
                return '<tr class="' + (CLS[r.verdict] || '') + '">' +
                    '<td class="num">' + esc(r.no) + '</td>' + tds +
                    '<td><span class="tool-badge ' + (CLS[r.verdict] || '') + '">' +
                    esc(LABEL[r.verdict] || r.verdict) + '</span>' +
                    (r.note ? '<br><span class="tool-hint">' + esc(r.note) + '</span>' : '') +
                    '</td></tr>';
            }).join('');

            parts.push('<div class="tool-tablewrap"><table class="tool-table"><thead><tr>' +
                head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
                '</tr></thead><tbody>' + body + '</tbody></table></div>');
        }

        var errs = res.errors || [];
        if (errs.length) {
            parts.push('<div class="tool-note"><strong>' + errs.length + ' line' +
                (errs.length > 1 ? 's' : '') + ' could not be read</strong><ul>' +
                errs.slice(0, 12).map(function (e) {
                    return '<li>Line ' + esc(e.no) + ': ' + esc(e.reason) + '</li>';
                }).join('') + '</ul></div>');
        }

        E_OUT.innerHTML = parts.join('');
        if (E_CSV) E_CSV.disabled = !rows.length;
    }

    function download() {
        if (!lastResult || !lastResult.rows || !lastResult.rows.length) return;
        var head = HEADERS[tool];
        if (!head) {
            var n = lastResult.rows[0].cols.length - 1;
            head = ['Row'];
            for (var i = 0; i < n; i++) head.push('Col ' + (i + 1));
            head.push('Verdict');
        }
        var csv = C.toCSV(lastResult, head.concat(['Verdict', 'Note']));
        var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'drawing-check-' + (tool || 'result') + '.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    }

    var timer = null;
    function schedule() {
        clearTimeout(timer);
        timer = setTimeout(run, 180);
    }

    [E_IN, E_UNIT, E_DP, E_TO, E_TARGET, E_TPLUS, E_TMINUS].forEach(function (el) {
        if (!el) return;
        el.addEventListener('input', schedule);
        el.addEventListener('change', schedule);
    });
    if (E_RUN) E_RUN.addEventListener('click', run);
    if (E_CSV) E_CSV.addEventListener('click', download);

    run();
}());
