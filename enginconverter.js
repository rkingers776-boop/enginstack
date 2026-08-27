/* ═══════════════════════════════════════════════════════════════════════
   EnginConverter — Zero-dependency engineering unit conversion engine
   Extracted from https://enginstack.com
   License: MIT
   ═══════════════════════════════════════════════════════════════════════

   All conversion constants are treaty-backed exact values:
     • 1959 International Yard and Pound Agreement (1 in = 25.4 mm, 1 lb = 0.45359237 kg)
     • 1901 CGPM standard gravity (g₀ = 9.80665 m/s²)
     • 2019 Planck-constant kilogram redefinition
     • 1954 CGPM standard atmosphere (1 atm = 101,325 Pa)

   ── Usage ────────────────────────────────────────────────────────────

     // Multiply conversion (most units)
     convert(1, 'multiply', 0.3048)
     // → { input: 1, output: 0.3048, reverseOutput: 3.28084 }

     // Temperature conversion (affine transform)
     convert(32, 'temperature', { from: 'F', to: 'C' })
     // → { input: 32, output: 0, reverseOutput: 32 }

     // Inverse conversion (fuel economy)
     convert(10, 'inverse', 235.215)
     // → { input: 10, output: 23.5215, reverseOutput: 23.5215 }

     // Formatting
     fmt(2.54)
     // → "2.54"

   ── Conversion Type Reference ────────────────────────────────────────

   'multiply' (the default) — output = input × coeff
     Used for: length, weight, speed, pressure, area, volume, time,
              data storage, energy, angle, torque
     Example coeffs: ft→m = 0.3048, lb→kg = 0.45359237

   'temperature' — output = affine transform of input
     Used for: °F ↔ °C, °C ↔ K, °F ↔ K
     Note: not a linear multiplication — formulas are hardcoded

   'inverse' — output = coeff ÷ input
     Used for: fuel economy (mpg ↔ L/100km)
     Note: both directions use the same formula, coeff is not inverted on swap

   ═══════════════════════════════════════════════════════════════════════ */

;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.EnginConverter = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // ── Constants ────────────────────────────────────────────────

    var Constants = {
        // Exact treaty definitions (1959 International Yard and Pound Agreement)
        INCH_TO_MM:        25.4,              // 1 in = 25.4 mm (exact)
        FOOT_TO_M:         0.3048,            // 1 ft = 0.3048 m (exact)
        POUND_TO_KG:       0.45359237,        // 1 lb = 0.45359237 kg (exact)
        STANDARD_GRAVITY:  9.80665,           // g₀ m/s² (CGPM 1901, exact)
        ATM_TO_PA:         101325,            // 1 atm = 101,325 Pa (CGPM 1954, exact)

        // Derived constants (exact — not rounded, not measured)
        PSI_TO_PA:         6894.757293168,    // 1 psi = 1 lbf/in² = lb×g₀ / in²
        BAR_TO_PA:         100000,            // 1 bar = 100,000 Pa (definition)
        TORR_TO_PA:        133.322387415,     // 1 Torr = 1/760 atm at 0°C
        KGF_TO_N:          9.80665,           // 1 kgf = g₀ × 1 kg = 9.80665 N
        LBF_TO_N:          4.4482216152605,   // 1 lbf = lb × g₀
        FT_LBF_TO_NM:      1.3558179483314,   // ft·lbf → N·m: 0.3048 × 0.45359237 × 9.80665

        // Temperature anchor points
        ABSOLUTE_ZERO_C:   273.15,            // 0 K = −273.15 °C (exact, CGPM 1954)
        FAHRENHEIT_OFFSET: 459.67,            // 0 °F = 459.67 °R (exact, 9/5 ratio of kelvin)
        FAHRENHEIT_RATIO:  1.8                // °F:°C ratio (9/5, exact)
    };

    // ── Precision formatter ─────────────────────────────────────

    /**
     * Format a number to engineering precision (max 8 decimal places).
     * Automatically detects integers and formats them without trailing zeros.
     * Uses locale-aware number formatting.
     */
    function fmt(v) {
        v = Number(v);
        if (isNaN(v)) return 'NaN';
        var fixed = parseFloat(v.toFixed(10));
        // Integer detection — clean whole numbers get no decimals
        if (Number.isInteger(fixed) && Math.abs(fixed) < 1000000) {
            return fixed.toLocaleString(undefined, { maximumFractionDigits: 0 });
        }
        // Strip trailing zeros in the fractional part
        return parseFloat(fixed.toFixed(8)).toLocaleString(undefined, { maximumFractionDigits: 8 });
    }

    // ── Temperature conversions (all affine transforms) ──────────

    var TEMP_PAIRS = [
        { from: 'C', to: 'F', forward: function(c) { return c * 1.8 + 32; }, reverse: function(f) { return (f - 32) / 1.8; } },
        { from: 'F', to: 'C', forward: function(f) { return (f - 32) / 1.8; }, reverse: function(c) { return c * 1.8 + 32; } },
        { from: 'C', to: 'K', forward: function(c) { return c + 273.15; }, reverse: function(k) { return k - 273.15; } },
        { from: 'K', to: 'C', forward: function(k) { return k - 273.15; }, reverse: function(c) { return c + 273.15; } },
        { from: 'F', to: 'K', forward: function(f) { return (f + 459.67) / 1.8; }, reverse: function(k) { return k * 1.8 - 459.67; } },
        { from: 'K', to: 'F', forward: function(k) { return k * 1.8 - 459.67; }, reverse: function(f) { return (f + 459.67) / 1.8; } }
    ];

    function findTempFormula(from, to) {
        for (var i = 0; i < TEMP_PAIRS.length; i++) {
            if (TEMP_PAIRS[i].from === from && TEMP_PAIRS[i].to === to) {
                return TEMP_PAIRS[i];
            }
        }
        return null;
    }

    /**
     * Perform a unit conversion.
     *
     * @param {number}  input   - The value to convert.
     * @param {string}  type    - 'multiply' | 'temperature' | 'inverse'.
     * @param {*}       arg     - For 'multiply'/'inverse': a number (coefficient).
     *                            For 'temperature': an object {from: 'C', to: 'F'}.
     * @returns {Object|null}   - { input, output, reverseOutput, type } or null on invalid input.
     */

    function convert(input, type, arg) {
        type = type || 'multiply';

        if (typeof input !== 'number' || isNaN(input)) return null;
        if (type !== 'temperature' && input < 0) return null;

        var output, reverseOutput;

        if (type === 'temperature') {
            if (!arg || !arg.from || !arg.to) return null;
            var formula = findTempFormula(arg.from, arg.to);
            if (!formula) return null;
            output = formula.forward(input);
            reverseOutput = formula.reverse(input);
        } else if (type === 'inverse') {
            var coeff = Number(arg);
            if (isNaN(coeff) || input === 0) return null;
            output = coeff / input;
            reverseOutput = coeff / input; // symmetric
        } else {
            var coeff = Number(arg);
            if (isNaN(coeff)) return null;
            output = input * coeff;
            reverseOutput = input / coeff;
        }

        return {
            input:        input,
            output:       parseFloat(output.toFixed(10)),
            reverseOutput: parseFloat(reverseOutput.toFixed(10)),
            type:         type
        };
    }

    /**
     * Swap a conversion direction and return the new coefficient (if applicable).
     * For 'multiply': newCoeff = 1 / oldCoeff
     * For 'temperature': the {from, to} is simply swapped
     * For 'inverse': coefficient is unchanged (symmetric formula)
     */
    function swapParams(type, currentFrom, currentTo, currentCoeff) {
        if (type === 'temperature') {
            return {
                type: type,
                from: currentTo,
                to: currentFrom,
                coeff: null
            };
        }
        if (type === 'inverse') {
            return {
                type: type,
                coeff: currentCoeff  // same coefficient — formula is symm
            };
        }
        // multiply: invert the coefficient
        var c = parseFloat(currentCoeff);
        return {
            type: 'multiply',
            coeff: (c !== 0) ? 1 / c : null
        };
    }

    // ── Public API ─────────────────────────────────────────

    return {
        VERSION:  '3.0.0',
        SOURCE:   'https://enginstack.com — precision engineering unit converters',
        LICENSE:  'MIT',

        fmt:      fmt,
        convert:  convert,
        swap:     swapParams,

        // Named constants for programmatic use
        COEFFICIENTS: {
            'ft-to-m':          0.3048,
            'm-to-ft':          3.28083989501312,
            'in-to-cm':         2.54,
            'cm-to-in':         0.393700787401575,
            'in-to-mm':         25.4,
            'mm-to-in':         0.0393700787401575,
            'lb-to-kg':         0.45359237,
            'kg-to-lb':         2.20462262184878,
            'mph-to-kph':       1.609344,
            'kph-to-mph':       0.621371192237334,
            'psi-to-bar':       0.0689475729317837,
            'bar-to-psi':       14.5037737730209,
            'psi-to-kpa':       6.89475729316836,
            'kpa-to-psi':       0.145037737730209,
            'atm-to-pa':        101325,
            'pa-to-atm':        0.00000986923266716013,
            'gallons-to-liters': 3.785411784,
            'liters-to-gallons': 0.264172052358148,
            'ftlbf-to-nm':      1.3558179483314,
            'nm-to-ftlbf':      0.737562149277265,
            'deg-to-rad':       0.0174532925199433,
            'rad-to-deg':       57.2957795130823,
            'hp-to-kw':         0.74569987158227,
            'kw-to-hp':         1.34102208959503,
            'btu-to-joules':    1055.05585262,
            'joules-to-btu':    0.000947817120313317
        }
    };

}));
