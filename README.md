# EnginStack — Precision Engineering Unit Converters

[EnginStack](https://enginstack.com) is a precision engineering unit-conversion site: **269 converters across 18 categories** plus **32 narrative engineering guides**, with every conversion factor traceable to NIST SP 811, BIPM SI definitions, and the 1959 International Yard & Pound Agreement.

This repository is the full source of the static site (plain HTML/CSS/JS, no build step).

## Why it's different

- **Zero-uncertainty constants** — factors are definitions, not approximations (1 lb = 0.45359237 kg exactly, 1 inch = 2.54 cm exactly).
- **Five JSON-LD types per page** — WebApplication, FAQPage, BreadcrumbList, Organization, DefinedTerm (guide pages swap WebApplication for Article).
- **NIST/ISO source notes** on every page.
- **Client-side math** — no server, no signup, anonymous analytics only.

## The conversion math (core formulas)

```js
// Length — 1 inch = 2.54 cm exactly (1959 definition)
const inchesToCm = v => v * 2.54;

// Temperature — Fahrenheit to Celsius
const fToC = f => (f - 32) * 5 / 9;

// Mass — 1 lb = 0.45359237 kg exactly (1959 definition)
const lbsToKg = v => v * 0.45359237;

// Energy — 1 kWh = 3,600,000 J exactly
const kwhToJoules = v => v * 3600000;

// Pressure — 1 psi = 6,894.757293168 Pa exactly (lbf/in²)
const psiToPa = v => v * 6894.757293168;
```

## Explore the site

- [All 269 converters](https://enginstack.com/)
- [Length](https://enginstack.com/length/) · [Weight](https://enginstack.com/weight/) · [Temperature](https://enginstack.com/temperature/) · [Pressure](https://enginstack.com/pressure/) · [Electric](https://enginstack.com/electric/) · [Energy](https://enginstack.com/energy/)
- [32 engineering guides](https://enginstack.com/guides/) — including the Year 2038 Problem, why a 1 TB drive shows 931 GB, the 8 most expensive unit-conversion mistakes, and case studies of real disasters (Mars Climate Orbiter, Patriot at Dhahran)

## Stack

- Plain HTML/CSS/JS, no framework, no build step
- Conversion math runs client-side (`main.js`, `enginconverter.js`)
- Deploys to Cloudflare Pages
