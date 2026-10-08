/* ═══════════════════════════════════════════════════════════
   EnginStack — Core Calculation Engine v3
   Real-time conversion, swap units, URL params, zero dependencies
   ═══════════════════════════════════════════════════════════ */

// ── Theme Manager ──────────────────────────────────────────
var THEME_KEY = 'enginstack-theme';

function getTheme() {
    // 1. Manual preference from localStorage
    try {
        var saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) { /* localStorage unavailable */ }
    // 2. OS preference via media query
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    // 3. Default dark
    return 'dark';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
    updateThemeIcon(theme);
}

function toggleTheme() {
    var current = getTheme();
    var next = (current === 'dark') ? 'light' : 'dark';
    applyTheme(next);
}

function updateThemeIcon(theme) {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    if (theme === 'light') {
        btn.classList.add('light');
    } else {
        btn.classList.remove('light');
    }
}

// Apply theme immediately (before DOMContentLoaded) to minimize flash
(function() {
    var theme = getTheme();
    document.documentElement.setAttribute('data-theme', theme);
})();

// ── Shared Site Header Injection ──────────────────────────
var SITE_HEADER_HTML =
    '<header class="site-header">' +
        '<div class="site-header-inner">' +
            '<a href="/" class="logo">' +
                '<svg class="logo-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">' +
                    '<defs>' +
                        '<linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">' +
                            '<stop offset="0%" stop-color="#fbbf24"/>' +
                            '<stop offset="100%" stop-color="#f59e0b"/>' +
                        '</linearGradient>' +
                    '</defs>' +
                    '<rect width="32" height="32" rx="7" fill="url(#logoGrad)"/>' +
                    '<text x="16" y="22.5" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="700" fill="#0f1117" letter-spacing="-0.02em">ES</text>' +
                '</svg>' +
                '<span>EnginStack</span>' +
            '</a>' +
            '<nav class="header-nav" aria-label="Main navigation">' +
                '<a href="/" class="nav-link">Home</a>' +
                '<div class="nav-dropdown">' +
                    '<button class="nav-link nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">Tools <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>' +
                    '<div class="nav-dropdown-menu" role="menu">' +
                        '<div class="nav-dropdown-grid">' +
                            '<a href="/length/" class="nav-dropdown-item" role="menuitem">Length &amp; Distance</a>' +
                            '<a href="/weight/" class="nav-dropdown-item" role="menuitem">Weight &amp; Mass</a>' +
                            '<a href="/temperature/" class="nav-dropdown-item" role="menuitem">Temperature</a>' +
                            '<a href="/speed/" class="nav-dropdown-item" role="menuitem">Speed</a>' +
                            '<a href="/pressure/" class="nav-dropdown-item" role="menuitem">Pressure</a>' +
                            '<a href="/area/" class="nav-dropdown-item" role="menuitem">Area</a>' +
                            '<a href="/volume/" class="nav-dropdown-item" role="menuitem">Volume</a>' +
                            '<a href="/time/" class="nav-dropdown-item" role="menuitem">Time</a>' +
                            '<a href="/torque/" class="nav-dropdown-item" role="menuitem">Torque</a>' +
                            '<a href="/data-storage/" class="nav-dropdown-item" role="menuitem">Data Storage</a>' +
                            '<a href="/energy/" class="nav-dropdown-item" role="menuitem">Energy &amp; Power</a>' +
                            '<a href="/angle/" class="nav-dropdown-item" role="menuitem">Angle</a>' +
                            '<a href="/fuel-economy/" class="nav-dropdown-item" role="menuitem">Fuel Economy</a>' +
                            '<a href="/force/" class="nav-dropdown-item" role="menuitem">Force</a>' +
                            '<a href="/frequency/" class="nav-dropdown-item" role="menuitem">Frequency</a>' +
                            '<a href="/density/" class="nav-dropdown-item" role="menuitem">Density</a>' +
                            '<a href="/flow-rate/" class="nav-dropdown-item" role="menuitem">Flow Rate</a>' +
                            '<a href="/electric/" class="nav-dropdown-item" role="menuitem">Electric</a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<a href="/guides/" class="nav-link">Guides</a>' +
                '<a href="/about" class="nav-link">About</a>' +
            '</nav>' +
            '<button class="theme-toggle" aria-label="Toggle light/dark theme" title="Toggle theme">' +
                '<svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<circle cx="12" cy="12" r="5"/>' +
                    '<line x1="12" y1="1" x2="12" y2="3"/>' +
                    '<line x1="12" y1="21" x2="12" y2="23"/>' +
                    '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
                    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
                    '<line x1="1" y1="12" x2="3" y2="12"/>' +
                    '<line x1="21" y1="12" x2="23" y2="12"/>' +
                    '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
                    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
                '</svg>' +
                '<svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
                '</svg>' +
            '</button>' +
            '<div class="header-search">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<circle cx="11" cy="11" r="8"/>' +
                    '<path d="m21 21-4.35-4.35"/>' +
                '</svg>' +
                '<input type="text" id="header-search-input" placeholder="Search converters…" autocomplete="off">' +
            '</div>' +
        '</div>' +
    '</header>';

function injectHeader() {
    var el = document.getElementById('site-header');
    if (el) el.outerHTML = SITE_HEADER_HTML;
}

// ── Precision number formatter ────────────────────────────
// Thousands separators, for the input value echoed in the identity line
// (100000000 -> "100,000,000", matching how the static HTML writes it).
var grpNum = function(n) {
    return (Number.isInteger(n) && Math.abs(n) < 1e21)
        ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : String(n);
};

// ── Grammatical number for unit labels ────────────────────
// A unit label must agree with the number written immediately to its left
// ("1 acre = 4,046.8564224 square meters", "24 hours = 1 day"). Only full
// English words are inflected, and only through this explicit pair table:
// abbreviations must never be touched — stripping a trailing "s" off "Gbps"
// yielded "Gbp", and off "ms" (milliseconds) would have yielded "m" (metres).
var UNIT_PAIRS = [
    ['acre', 'acres'], ['amp', 'amps'], ['atmosphere', 'atmospheres'],
    ['cup (US)', 'cups (US)'], ['day', 'days'], ['degree', 'degrees'],
    ['degree (°)', 'degrees (°)'], ['dyne', 'dynes'], ['foot', 'feet'],
    ['gallon', 'gallons'], ['gradian', 'gradians'],
    ['gradian (gon)', 'gradians (gon)'], ['hectare', 'hectares'],
    ['hour', 'hours'], ['inch', 'inches'], ['knot', 'knots'],
    ['liter', 'liters'], ['meter', 'meters'], ['mile', 'miles'],
    ['milliwatt', 'milliwatts'], ['minute', 'minutes'], ['month', 'months'],
    ['newton', 'newtons'], ['ohm', 'ohms'], ['pascal', 'pascals'],
    ['radian', 'radians'], ['second', 'seconds'], ['ton', 'tons'],
    ['volt', 'volts'], ['watt', 'watts'], ['week', 'weeks'], ['yard', 'yards'],
    ['US gallon', 'US gallons'], ['cubic meter', 'cubic meters'],
    ['square meter', 'square meters'], ['square foot', 'square feet'],
    ['cubic foot', 'cubic feet'], ['watt-hour', 'watt-hours'],
    ['liter per minute', 'liters per minute'],
    ['liter per second', 'liters per second'],
    ['cubic meter per hour', 'cubic meters per hour'],
    ['US gallon per minute', 'US gallons per minute']
];
// 符号归一：pill 上有写 lbs、有写 lb，但恒等式（句子）里一律用标准符号 lb——
// 页面原文 8 处全都是这么写的。lb/oz/g/t 这类符号本身不参与变格。
var UNIT_ALIAS = { 'lbs': 'lb' };

var UNIT_ONE = {}, UNIT_MANY = {};
(function () {
    for (var i = 0; i < UNIT_PAIRS.length; i++) {
        var sg = UNIT_PAIRS[i][0], pl = UNIT_PAIRS[i][1];
        UNIT_ONE[pl] = sg;  UNIT_ONE[sg] = sg;
        UNIT_MANY[sg] = pl; UNIT_MANY[pl] = pl;
    }
})();

// qtyText is the number the reader sees next to the label, already formatted
// ("1", "24", "4,046.8564224"), so agreement is judged on the rendered line.
// Labels outside the table — ha, km, kPa, ms, Gbps, ft³, °C, m/s — pass through.
var unitAgree = function(label, qtyText) {
    if (typeof label !== 'string') return label;
    if (UNIT_ALIAS[label]) label = UNIT_ALIAS[label];
    var m = (String(qtyText) === '1') ? UNIT_ONE : UNIT_MANY;
    return Object.prototype.hasOwnProperty.call(m, label) ? m[label] : label;
};

var fmt = function(v) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    // toFixed(8) fixes *decimal places*, so below 1e-6 it eats every significant
    // digit (6.6845871e-9 -> "0.00000001", off by 33%). Use scientific notation
    // for that range so the value stays truthful.
    if (a !== 0 && a < 1e-6) {
        return v.toExponential(8).replace(/\.?0+e/, 'e');
    }
    var fixed = parseFloat(v.toFixed(8));
    if (Number.isInteger(fixed) && Math.abs(fixed) < 1000000) {
        return fixed.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return fixed.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

// ── Find calculator card from any descendant element ─────
function findCard(el) {
    if (!el) return null;
    return el.closest ? el.closest('.calculator-card') : null;
}

// ── Core: universal unit conversion (real-time) ──────────
function universalEnginStack(el) {
    var card = findCard(el);
    if (!card) return;

    var inputEl = card.querySelector('.unit-input');
    if (!inputEl) return;

    var raw = inputEl.value;
    if (raw === '' || raw === '-') return;

    var inputVal = parseFloat(raw);
    var conversionType = card.getAttribute('data-conversion-type') || 'multiply';
    var unitFrom = card.getAttribute('data-unit-from');
    var unitTo   = card.getAttribute('data-unit-to');

    var allowNeg = (conversionType === 'temperature');
    if (isNaN(inputVal)) return;
    if (!allowNeg && inputVal < 0) return;

    var outputTo, outputFromInverse;

    if (conversionType === 'temperature') {
        var pair = unitFrom + '→' + unitTo;
        switch (pair) {
            case '°C→°F':
                outputTo = fmt(inputVal * 9 / 5 + 32);
                outputFromInverse = fmt((inputVal - 32) * 5 / 9);
                break;
            case '°F→°C':
                outputTo = fmt((inputVal - 32) * 5 / 9);
                outputFromInverse = fmt(inputVal * 9 / 5 + 32);
                break;
            case '°C→K':
                outputTo = fmt(inputVal + 273.15);
                outputFromInverse = fmt(inputVal - 273.15);
                break;
            case 'K→°C':
                outputTo = fmt(inputVal - 273.15);
                outputFromInverse = fmt(inputVal + 273.15);
                break;
            case '°F→K':
                outputTo = fmt((inputVal + 459.67) * 5 / 9);
                outputFromInverse = fmt(inputVal * 9 / 5 - 459.67);
                break;
            case 'K→°F':
                outputTo = fmt(inputVal * 9 / 5 - 459.67);
                outputFromInverse = fmt((inputVal + 459.67) * 5 / 9);
                break;
            default:
                outputTo = fmt(inputVal * 9 / 5 + 32);
                outputFromInverse = fmt((inputVal - 32) * 5 / 9);
        }
    } else if (conversionType === 'inverse') {
        var coeff = parseFloat(card.getAttribute('data-coefficient'));
        if (isNaN(coeff) || inputVal === 0) return;
        outputTo = fmt(coeff / inputVal);
        outputFromInverse = fmt(coeff / inputVal);
    } else {
        var coeff = parseFloat(card.getAttribute('data-coefficient'));
        if (isNaN(coeff)) return;
        outputTo = fmt(inputVal * coeff);
        outputFromInverse = fmt(inputVal / coeff);
    }

    var resultEl = card.querySelector('.result-value');
    if (resultEl) resultEl.textContent = outputTo;

    // 恒等式里的单位词用页面 pill 的实际文本（pill 是编辑性短标签，如 ha / ft³ / hour），
    // 而不是 data-unit-* 的内部标签（hectares / ft³ (cubic feet) / hours）—— 否则同一条
    // 恒等式会与紧挨着它的单位 pill 自相矛盾（14 个页面命中）。
    // 每个标签的数与它左侧那个数字绑定，两侧各自独立判断。
    var pillFromEl = card.querySelector('.unit-pill-from');
    var pillToEl   = card.querySelector('.unit-pill-to');
    var labelFrom  = pillFromEl ? pillFromEl.textContent : unitFrom;
    var labelTo    = pillToEl   ? pillToEl.textContent   : unitTo;
    var nstr       = grpNum(inputVal);

    var fwdEl = card.querySelector('.forward-res');
    if (fwdEl) fwdEl.textContent = nstr + ' ' + unitAgree(labelFrom, nstr)
                                 + ' = ' + outputTo + ' ' + unitAgree(labelTo, outputTo);

    var revEl = card.querySelector('.reverse-res');
    if (revEl) revEl.textContent = nstr + ' ' + unitAgree(labelTo, nstr)
                                 + ' = ' + outputFromInverse + ' ' + unitAgree(labelFrom, outputFromInverse);

    updateUrlParam(inputVal);
}

// ── URL parameter support ─────────────────────────────────
function updateUrlParam(value) {
    try {
        var url = new URL(window.location);
        url.searchParams.set('value', String(value));
        window.history.replaceState({ value: value }, '', url);
    } catch (e) { /* Silently fail */ }
}

function applyUrlValue() {
    try {
        var params = new URLSearchParams(window.location.search);
        var val = params.get('value');
        if (val !== null) {
            var cards = document.querySelectorAll('.calculator-card');
            for (var i = 0; i < cards.length; i++) {
                var input = cards[i].querySelector('.unit-input');
                if (input) {
                    input.value = val;
                    universalEnginStack(input);
                }
            }
        }
    } catch (e) { /* Silently fail */ }
}

// ── Swap units direction ─────────────────────────────────
function swapUnits(card) {
    if (!card) return;

    var type = card.getAttribute('data-conversion-type') || 'multiply';
    var from = card.getAttribute('data-unit-from');
    var to   = card.getAttribute('data-unit-to');
    var coeff = card.getAttribute('data-coefficient');

    card.setAttribute('data-unit-from', to);
    card.setAttribute('data-unit-to', from);

    if (type !== 'temperature' && type !== 'inverse' && coeff !== null) {
        var c = parseFloat(coeff);
        if (c !== 0 && !isNaN(c)) {
            card.setAttribute('data-coefficient', String(1 / c));
        }
    }

    var pillFrom = card.querySelector('.unit-pill-from');
    var pillTo   = card.querySelector('.unit-pill-to');
    if (pillFrom) pillFrom.textContent = to;
    if (pillTo)   pillTo.textContent   = from;

    var inputEl = card.querySelector('.unit-input');
    if (inputEl) universalEnginStack(inputEl);
}

// ── Init: prime all calculator cards ─────────────────────
function initCalculators() {
    applyUrlValue();

    var cards = document.querySelectorAll('.calculator-card');
    for (var i = 0; i < cards.length; i++) {
        var input = cards[i].querySelector('.unit-input');
        if (input) universalEnginStack(input);
    }
}

// ── Event delegation ──────────────────────────────────────
function initDelegation() {
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('unit-input')) {
            universalEnginStack(e.target);
        }
    });

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn-swap');
        if (btn) {
            swapUnits(btn.closest('.calculator-card'));
        }
    });
}

// ── Theme toggle handler ──────────────────────────────────
function initThemeToggle() {
    // Sync icon state with current theme
    updateThemeIcon(getTheme());

    // Listen for OS theme changes (don't save — only manual toggle saves)
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
            try {
                var saved = localStorage.getItem(THEME_KEY);
                if (!saved) {
                    var theme = e.matches ? 'light' : 'dark';
                    document.documentElement.setAttribute('data-theme', theme);
                    updateThemeIcon(theme);
                }
            } catch (ex) {
                var theme = e.matches ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                updateThemeIcon(theme);
            }
        });
    }

    // Click handler
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.theme-toggle');
        if (btn) {
            toggleTheme();
        }
    });
}

// ── Global search (homepage) ──────────────────────────────
function initSearch() {
    var input = document.querySelector('.header-search input');
    if (!input) return;

    var cards = document.querySelectorAll('.category-card');

    input.addEventListener('input', function() {
        var q = this.value.toLowerCase().trim();
        if (cards.length > 0) {
            for (var i = 0; i < cards.length; i++) {
                var txt = (cards[i].textContent || '').toLowerCase();
                cards[i].style.display = (q === '' || txt.indexOf(q) !== -1) ? '' : 'none';
            }
        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        var q = this.value.toLowerCase().trim();
        if (!q) return;

        if (cards.length > 0) {
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].style.display === 'none') continue;
                var links = cards[i].querySelectorAll('.category-pills a');
                for (var j = 0; j < links.length; j++) {
                    var linkText = (links[j].textContent || '').toLowerCase();
                    if (linkText.indexOf(q) !== -1) {
                        window.location.href = links[j].getAttribute('href');
                        return;
                    }
                }
            }
        }
    });
}

// ── Register Service Worker ───────────────────────────────
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function() {
            // Silently fail — SW is a progressive enhancement
        });
    }
}

// ── Guides toggle (homepage) ────────────────────────────────
function initGuidesToggle() {
    var toggle = document.getElementById('guides-toggle');
    var more   = document.getElementById('guides-more');
    if (!toggle || !more) return;

    toggle.addEventListener('click', function() {
        var expanded = more.classList.toggle('expanded');
        toggle.classList.toggle('expanded');
        toggle.querySelector('.guides-toggle-text').textContent = expanded ? 'Show fewer guides' : 'Show more guides';
        toggle.setAttribute('aria-expanded', String(expanded));
    });
}

// ── Bootstrap ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    injectHeader();
    initDelegation();
    initCalculators();
    initSearch();
    initThemeToggle();
    initGuidesToggle();
    registerSW();
});
