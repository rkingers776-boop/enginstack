/* 卷尺计算器页面逻辑。依赖 dimensions.js（精确分数引擎）。 */
(function () {
    'use strict';
    var D = window.EnginDimensions;
    if (!D) return;

    var exprEl = document.getElementById('fx-expr');
    var defEl = document.getElementById('fx-default');
    var denEl = document.getElementById('fx-denom');
    var outEl = document.getElementById('fx-out');
    var errEl = document.getElementById('fx-error');
    var mainEl = document.getElementById('fx-main');
    var subEl = document.getElementById('fx-sub');
    var gridEl = document.getElementById('fx-grid');

    var SHOW = ['mm', 'cm', 'm', 'in', 'ft'];

    function render() {
        var text = (exprEl.value || '').trim();
        errEl.hidden = true;
        if (!text) {
            mainEl.textContent = '—';
            subEl.textContent = '';
            gridEl.innerHTML = '';
            return;
        }
        var r = D.parse(text, defEl.value);
        if (r.error) {
            errEl.textContent = r.error;
            errEl.hidden = false;
            mainEl.textContent = '—';
            subEl.textContent = '';
            gridEl.innerHTML = '';
            return;
        }

        var denom = parseInt(denEl.value, 10) || 16;
        var ftin = D.fmtFtIn(r.value, denom);

        mainEl.textContent = ftin;
        // 小数形式放在副标题，方便复制
        subEl.textContent = 'Decimal: ' + D.fmtIn(r.value, 'in', 6) + ' in  ·  '
            + D.fmtIn(r.value, 'mm', 4) + ' mm';

        var html = '';
        SHOW.forEach(function (k) {
            var u = D.unitByKey(k);
            html += '<dl class="tool-cell"><dt>' + u.short + '</dt><dd>'
                + D.fmtIn(r.value, k, 6) + '</dd></dl>';
        });
        gridEl.innerHTML = html;
    }

    exprEl.addEventListener('input', render);
    defEl.addEventListener('change', render);
    denEl.addEventListener('change', render);

    Array.prototype.forEach.call(document.querySelectorAll('[data-example]'), function (b) {
        b.addEventListener('click', function () {
            exprEl.value = b.getAttribute('data-example');
            render();
            exprEl.focus();
        });
    });

    render();
}());
