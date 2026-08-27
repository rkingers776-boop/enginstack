# Engine Displacement Conversion Guide — Cubic Inches to Liters, Bore × Stroke Math, and the Rounding Decisions That Made the Ford 5.0 a Legend

Every internal combustion engine ever built has exactly two displacement numbers. One is what the math says. The other is what the badge says. The difference between them — sometimes a rounding convenience, sometimes a marketing decision, sometimes a tax dodge — is the story of how the cubic inch died as the world's engine unit, and how the liter took its place without anyone at the auto parts store noticing.

**1 cubic inch = 0.016387064 liters** exactly. That single number, derived from the 1959 inch definition, is the bridge between the Chevy 350 and the 5.7, between the Ford 302 and the "5.0," between the Dodge Viper's 488 cubic inches and the only clean 8.0-liter badge in automotive history.

This guide covers the constant, the math, the marketing, and every engine that ever wore two displacement numbers. Every conversion factor below is traceable to NIST metrology standards — no approximations, no hand-waving, just the numbers and the stories behind them.

---

## 1. The 0.016387064 Constant: Where It Comes From and Why Every Digit Matters

No measurement ever produced the cubic-inch-to-liter conversion factor. It was **computed** — derived from the inch-meter relationship fixed by international treaty in 1959.

The inch is exactly 2.54 centimeters. The centimeter is exactly 10 millimeters. A cubic inch is a cube 2.54 cm on each side:

```
(2.54)³ = 16.387064 cubic centimeters — exactly
```

Because the 12th General Conference on Weights and Measures (1964) confirmed 1 cm³ = 1 mL, a cubic inch is 16.387064 milliliters. Divide by 1,000 to get liters: **0.016387064**.

This number has **zero measurement uncertainty**. Every decimal place is meaningful. The conversion is as exact as the treaty that fixed the inch — and that treaty was signed by the United States, the United Kingdom, Canada, Australia, New Zealand, and South Africa. The factor 0.016387064 is not a physical constant. It's a legal one. It has the same authority as the speed of light defining the meter — it's just less famous.

Before 1959, the inch varied subtly between countries. The US survey inch was 2.54000508 cm. The British imperial inch was 2.53999779 cm. The difference — about 3 parts per million — was invisible on a ruler but material when converting the displacement of a Rolls-Royce Merlin V12 (1,649 cubic inches, or 27.0 liters) to metric for a Packard-built version bound for a Spitfire airframe assembled in Canada from British drawings and American tooling. The 1959 treaty ended the ambiguity.

> **The key formulas:**
>
> `Liters = cubic inches × 0.016387064`
>
> `Cubic inches = liters × 61.0237441`
>
> **Mental shortcut:** Divide cubic inches by 61 for liters (0.04% error). Multiply liters by 61 for cubic inches.

---

## 2. Bore × Stroke: How an Engine Gets Its Displacement Number

Engine displacement is the swept volume of all cylinders — the total volume displaced by the pistons as they move from top dead center to bottom dead center. The formula is elegant and universal:

```
Displacement = (π × bore² / 4) × stroke × number of cylinders
```

For a four-cylinder engine with an 86.0 mm bore and 86.0 mm stroke — the most common "square" configuration in modern engines — the math runs:

```
π × (86.0/2)² × 86.0 × 4 = 1,998,229 mm³
÷ 1,000 = 1,998 cm³
```

That's the Honda K20, the Volkswagen EA888, the Toyota 8AR-FTS. All are "2.0-liter" engines. None is exactly 2,000 cm³. The 1,998-to-2,000 rounding is 0.1% — smaller than the carbon buildup on a piston crown after 10,000 miles.

The same engine computed in inches: 86.0 mm = 3.386 inches. π × (3.386/2)² × 3.386 × 4 = **121.9 cubic inches**. Every 2.0T sedan on the road displaces 122 cubic inches — a number that, two generations ago, would have been laughably small for a family car. A 1964 Ford Mustang straight-six displaced 170 cubic inches. The 2024 Honda Accord 2.0T displaces 122 cubic inches and produces 252 horsepower — more than double the Mustang's 101 horsepower from 40% less displacement. Displacement shrunk. Technology filled the gap.

The bore and stroke dimensions are the engine's DNA:

- **Square** (bore = stroke): compromise between torque and revvability — the Honda K20
- **Oversquare** (bore > stroke): high RPM breathing — Ferrari 458 (94.0 mm × 81.0 mm)
- **Undersquare** (stroke > bore): low-end torque for trucks — Chrysler Slant Six (3.40 in × 4.125 in)

### Worked Example: The Chevy 350 Small-Block

The most-produced V8 in history: 4.000-inch bore, 3.480-inch stroke, 8 cylinders.

```
π × (4.000/2)² × 3.480 × 8
= π × 4.000 × 3.480 × 8
= π × 111.36
= 349.85 cubic inches → rounded to 350

349.85 × 0.016387064 = 5.735 liters → badge reads "5.7"
```

The 4.000-inch bore was not an accident. It was chosen because a round number of inches produces a round-number displacement in cubic inches after multiplying by π, stroke, and cylinder count. The displacement was the design target. The bore and stroke were reverse-engineered from a round number. The 0.01639 constant was the last step — computed after the displacement was finalized, only when the engine needed a metric badge for the export market.

---

## 3. The American V8 Displacement Table: Every Iconic Engine in Both Units

Below is every major American V8 engine, sorted by cubic inches, with exact liter equivalents and badge numbers. The "Badge" column is what appeared on the fender — not necessarily what the math says.

| Engine | Years | Bore × Stroke (in) | Cu In | Exact L | Badge | Rounding Story |
|--------|-------|---------------------|-------|---------|-------|----------------|
| Ford Flathead V8 | 1932–1953 | 3.062 × 3.750 | 221 | 3.62 | — | Launched hot-rodding. Never badged in liters — the era hadn't started. |
| Chevy Small-Block 265 | 1955–1957 | 3.750 × 3.000 | 265 | 4.34 | — | First small-block Chevy. Bore/stroke chosen to land on 265. |
| Chevy Small-Block 283 | 1957–1967 | 3.875 × 3.000 | 283 | 4.64 | 4.6 | First fuel-injected American V8. "1 hp/cu in" — 283 hp from 283 ci. |
| Ford 289 | 1963–1968 | 4.000 × 2.870 | 289 | 4.74 | 4.7 | Mustang GT, Shelby GT350. Clean round; nobody noticed. |
| Chevy 302 (DZ) | 1967–1969 | 4.000 × 3.000 | 302 | 4.95 | 5.0 | Trans-Am Z/28 Camaro. Same 302 as the Ford — Chevy's own 5.0 a decade earlier. Chevy never badged it 5.0. |
| Ford 302 "5.0" | 1968–2001 | 4.000 × 3.000 | 302 | 4.95 | 5.0 | 4.949 L → 5.0. The 4.9 badge was on the 300 ci inline-six. Best marketing decision in Ford history. |
| Chevy 327 | 1962–1969 | 4.000 × 3.250 | 327 | 5.36 | 5.4 | Corvette, Chevelle, Impala. Unremarkable 0.7% up-round. |
| Ford 351 Windsor | 1969–2001 | 4.000 × 3.500 | 351 | 5.75 | 5.8 | Workhorse V8. Clean round; nobody debated it. |
| Chevy 350 | 1967–2003 | 4.000 × 3.480 | 350 | 5.74 | 5.7 | **100+ million produced.** The most-recognized displacement translation on Earth. |
| Chrysler Hemi 426 | 1964–1971 | 4.250 × 3.750 | 426 | 6.98 | 7.0 | "Elephant engine." Tightest round in the table: 0.27% error. NASCAR banned it. |
| Ford 460 | 1968–1997 | 4.360 × 3.850 | 460 | 7.54 | 7.5 | Lincoln Continental, F-250. Uncontroversial. |
| Pontiac 455 | 1970–1976 | 4.152 × 4.210 | 455 | 7.46 | 7.5 | GTO, Firebird Trans Am. Last of the big-block Pontiacs. |
| Cadillac 500 | 1970–1976 | 4.300 × 4.304 | 500 | 8.19 | 8.2 | Eldorado. Largest post-war American passenger-car V8. |
| Dodge Viper V10 | 1992–2017 | 4.000 × 3.960 | 488 | 8.00 | 8.0 | **Cleanest displacement-badge match ever.** 7.996 L → 8.0. The badge wrote itself. |
| Ford Coyote 5.0 | 2011–now | 92.2 × 92.7 mm | 302 | 4.95 | 5.0 | Metric engine, still 302 ci / 4.951 L. Still badged 5.0. The rounding outlasted the engine generation. |

The pattern is consistent: **no engine in this table matches its badge exactly**. The closest is the Hemi 426 at 0.27% error. The furthest is the Ford 302 at 1.0% error. All are within rounding conventions. All were accepted by consumers, regulators, and competitors. Engine displacement badges are not false advertising — they are a convention that everyone agrees to follow because the alternative (printing "4.951 L" on a Mustang fender in 32-point type) is worse than the rounding.

---

## 4. The Ford 302 That Became the "5.0" — a 1% Rounding That Sold Millions of Cars

Ford's 302 cubic-inch V8 was introduced in 1968. Its displacement:

```
4.000-inch bore × 3.000-inch stroke × 8 cylinders = 301.6 cubic inches → rounded to 302
× 0.016387 = 4.949 liters
Round to nearest tenth: 4.9
```

Ford badged it **5.0**.

The reason was not marketing genius — not at first. It was bureaucratic coincidence. Ford's **300 cubic-inch inline-six** — the truck engine in every F-150 and Econoline van — displaced 4.915 liters. Rounded to the nearest tenth: **4.9**. The 300 inline-six was already wearing the "4.9" badge on grilles, tailgates, and sales brochures. Two completely different engines could not share the same metric badge. The inline-six owned 4.9. The V8 got 5.0.

The difference between 4.95 and 5.0 is 1%. The difference in customer perception between a "4.9 Mustang" and a "5.0 Mustang" is unmeasurable in dollars but so vast that the badge **became the car's name**. The Fox-body Mustang GT was not "the 302." It was "the five-oh." Vanilla Ice did not rap about a "four-point-nine." The 5.0 badge transcended the engine's actual displacement and became a cultural signifier — the sound of a pushrod V8 through Flowmaster mufflers, the silhouette of a three-door hatchback in a high-school parking lot, the number that launched a thousand drag-strip time slips. All from a 1% rounding decision made because a different engine already owned 4.9.

### The second life of the 5.0 badge

In 2011, Ford introduced the Coyote — an all-new DOHC V8 with twin independent variable cam timing, a die-cast aluminum block, and exactly **zero parts shared** with the 1968 Windsor. Its bore and stroke are specified in millimeters: 92.2 mm × 92.7 mm.

```
π × (92.2/2)² × 92.7 × 8 = 4,951 cm³ = 4.951 liters
```

Still not 5.0. The Coyote is a metric engine designed by metric engineers on metric CAD workstations, and yet its displacement still lands within 1% of the same round number as the pushrod engine it replaced. Ford badged it 5.0 again. The engine exists to fill the badge, not the other way around.

---

## 5. The Reverse Conversion: When the Liter Is the Design Target and Cubic Inches Are an Afterthought

Since the 1990s, virtually every new engine in the world has been designed in metric. Bore diameters and stroke lengths are chosen in millimeters. Combustion chamber volumes are computed in cubic centimeters. The engine's displacement target — 2.0 liters, 3.5 liters — is specified in liters from the first day of the program. The cubic-inch number is computed at the end, for the US-market spec sheet, by a junior engineer running the ×61.024 conversion in a spreadsheet cell that nobody checks because nobody cares.

The last engine designed in cubic inches was probably the GM LS-series (1997), whose 346-cubic-inch displacement was a legacy of the small-block Chevy's 4.000-inch bore center spacing — an imperial dimension carried forward from 1955. Every GM engine since — the LT-series, the HFV6, the L3B turbo-four — has been metric-native.

**Modern engine families and their cubic-inch equivalents:**

| Engine Family | Displacement (L) | Bore × Stroke (mm) | Cubic Inches | Vehicles |
|---------------|------------------|--------------------|--------------|----------|
| VW EA211 1.0 TSI | 0.999 | 74.5 × 76.4 | 61.0 | Golf, Polo (Europe) |
| GM L3B 2.7T | 2.727 | 92.3 × 102.0 | 166.4 | Chevy Silverado 1500 |
| Honda L15B 1.5T | 1.498 | 73.0 × 89.5 | 91.4 | Civic, CR-V, Accord |
| BMW B48 2.0T | 1.998 | 82.0 × 94.6 | 121.9 | 3 Series, X3, MINI Cooper S |
| Toyota A25A 2.5 | 2.487 | 87.5 × 103.4 | 151.8 | Camry, RAV4 |
| Ford EcoBoost 3.5 | 3.497 | 92.5 × 86.7 | 213.4 | F-150, Explorer, Transit |
| BMW B58 3.0T | 2.998 | 82.0 × 94.6 | 183.0 | M340i, Supra, Z4 |
| Stellantis Hemi 6.4 | 6.417 | 103.9 × 94.6 | 391.6 | Challenger Scat Pack (392 ci — the "392" badge is the old cubic-inch number!) |

The Dodge Challenger Scat Pack is the exception that proves the rule. Its 6.4-liter Hemi displaces 392 cubic inches — and Dodge badges it **"392"** on the fender, in the old cubic-inch convention, even though the engine's metric displacement (6.4 L) is also on the car. The Challenger wears two displacement badges in two different units on the same vehicle. It is the only car in production that does this.

---

## 6. Tax Brackets, Insurance Tiers, and the Displacement Numbers That Were Chosen by Accountants

In much of the world, engine displacement determines taxation. The tax bracket creates a hard target — and engineers design the engine to land just under the cutoff. The result is a displacement number chosen not by combustion efficiency or NVH optimization but by a **finance-department spreadsheet**.

### Japan: The 2 cc Margin Worth Thousands of Dollars

The kei car regulation limits engine displacement to 660 cc (0.66 L) for vehicles qualifying for lower tax rates and exemption from parking-space certification. Every kei car engine — the Suzuki R06A, Honda S07A, Daihatsu KF — displaces exactly **658 cc**. Not 660. The 2 cc margin is the safety buffer against manufacturing tolerance. A kei car engine that displaces 661 cc on the type-certification dyno is not a kei car. The owner's tax bill triples.

### China: The Most Expensive 2 cc in the Automotive Industry

China's displacement tax brackets (since 2008):

| Displacement | Tax Rate | Example Engines |
|-------------|----------|-----------------|
| ≤ 1.0 L | 1% | VW EA211 1.0 TSI (999 cc — 1 cc under) |
| 1.0–1.5 L | 3% | Honda L15B (1,498 cc), Toyota M15A (1,490 cc) — both 2 cc under |
| 1.5–2.0 L | 5% | VW EA888 2.0T (1,984 cc — 16 cc under) |
| 2.0–2.5 L | 9% | Toyota A25A (2,487 cc) |
| 2.5–3.0 L | 12% | BMW B48 tuned to 2,498 cc (2 cc under) for China-market 730Li |
| 3.0–4.0 L | 25% | Avoided entirely by mass-market vehicles |
| > 4.0 L | 40% | Effectively bans engines over 4.0 L |

Every engine on this list was designed to a tax bracket, not to a round number. The 1,498 cc Honda engine is not 1,500 cc because 1,500 cc is in the higher 3% bracket. The 2 cc margin — roughly the volume of a thimble across four cylinders — saves the buyer 2% of the vehicle's purchase price in annual tax. Multiplied over 10 million Civics sold in China, the 2 cc margin has saved Chinese consumers something on the order of **$2 billion** in cumulative tax.

Two cubic centimeters. Two billion dollars. The most expensive pair of cubic centimeters in the automotive industry.

### Europe: The Insurance Database vs. the Badge

In Europe, CO₂-based taxation has largely replaced displacement-based taxation, but the legacy persists in insurance tiers. An engine badged "2.0" that displaces 1,998 cc is in a lower insurance group than one displacing 2,050 cc and badged "2.0" with a straight face. The 2,050 cc engine is a 2.1-liter engine for insurance purposes in countries that round to the nearest 100 cc. The badge says 2.0. The insurance adjuster's database says 2.1. The owner pays the difference.

The US is the only major auto market where displacement is not taxed. The cubic inch died partly because the liter was a better unit for a global industry — and partly because the rest of the world's tax codes made displacement matter in a way that cubic inches couldn't express.

---

## 7. The Death of the Cubic Inch (and Why It Still Refuses to Die)

The cubic inch was the primary displacement unit for American engines from roughly 1900 to 1980. It began dying in 1975, when the US auto industry — facing the first wave of Japanese imports badged in liters — started printing metric displacements alongside cubic inches on window stickers.

> **1975 Corvette:** "350 CID (5.7 L)"
> **1985 Corvette:** "5.7 L V8"
> **1995:** Cubic inches gone from the sticker. The liter had won.

But the cubic inch didn't die. It went underground. It survives in:

- **Aftermarket catalogs.** Summit Racing, JEGS, and Edelbrock list crate engines in cubic inches. A "572" is a 572 ci big-block Chevy — 9.4 liters. Nobody calls it a "9.4." The aftermarket never metricated because its customers — people building restomod Camaros in two-car garages — never metricated.
- **NHRA and NASCAR rulebooks.** NHRA class breaks are specified in cubic inches: Super Stock is divided at 350, 396, 427, and 500 cubic inches. Changing it to liters would require reindexing 60 years of class records.
- **Classic car valuation.** A 1969 Camaro Z/28 is a "302." A 1970 Chevelle SS is a "454." A 1967 Corvette 427 is a "427." The cubic-inch number is the car's name. Changing the name to liters would reduce the car's value — collectors pay for "427" badges, not "7.0" badges.
- **Automotive journalism.** *Car and Driver* and *Road & Track* still print displacement in both units, cubic inches first: "the 350-cubic-inch (5.7-liter) V8." The parenthetical is always liters. The magazines know their audience.

The cubic inch will outlive everyone reading this article. It is preserved in the aftermarket, in the collector community, in the rulebooks, and in the cultural memory of a country that measures its engines in cubic inches the way France measures its wine in hectares and Japan measures its rice in koku. **The unit is obsolete. The culture is not.**

---

## 8. Displacement Isn't Everything: When a 122-Cubic-Inch Engine Outpowers a 350

Displacement tells you the engine's physical size. It tells you **nothing** about what the engine does with that size.

| Engine | Displacement | Horsepower | hp/cu in |
|--------|-------------|------------|----------|
| 1970 Chevy 350 (NA) | 350 ci / 5.7 L | ~300 (gross) | 0.86 |
| 2024 AMG M139 2.0T | 122 ci / 2.0 L | 416 | 3.4 |
| Bugatti Chiron W16 | 488 ci / 8.0 L | 1,500 | 3.1 |
| Koenigsegg Gemera I3T | 122 ci / 2.0 L | 600 | 4.9 |
| Formula 1 V6 Turbo-Hybrid | 98 ci / 1.6 L | ~850 | 8.7 |

The modern Mercedes-AMG engine is **four times** as power-dense as the 1970 Chevy. The difference is not displacement. It's boost pressure, direct injection, variable valve timing, and about $2,000 worth of turbocharger. **The horsepower-per-cubic-inch race is over. The turbocharger won.**

This is why modern engine badges are increasingly disconnected from displacement. A BMW "330i" once meant a 3.0-liter inline-six. Today it means a 2.0-liter turbo-four producing roughly the same power — the badge now references the **power tier**, not the displacement. Mercedes dropped displacement from its badges entirely: a "C 300" is a 2.0-liter turbo-four. An "E 450" is a 3.0-liter turbo inline-six. The number after the letter is a performance tier, not an engine size. The displacement is still there, in the owner's manual, on page 287, in a table nobody reads.

---

## 9. Motorcycles, Lawn Mowers, and Chainsaws: Small Engine Displacement in Cubic Centimeters

Motorcycle engines have always been measured in cubic centimeters — never in cubic inches, even in the United States. **A Harley-Davidson 1,450 cc engine is an 88-cubic-inch engine to its owner** — Harley riders are the last American consumers who convert cc to cu in as a matter of identity — but the factory specification is in cc.

The liter-bike class is defined as 1,000 cc = 61.0 cubic inches, and every engine in the class lands between 998 and 1,000 cc — the 2 cc margin is the racing-homologation buffer, the same game played by kei car manufacturers.

**Small engine displacement conversions:**

| Application | Typical cc Range | Cubic Inches | Horsepower Equivalent |
|------------|------------------|--------------|----------------------|
| String trimmer | 21–35 cc | 1.3–2.1 | 0.8–1.6 hp |
| Chainsaw (homeowner) | 30–50 cc | 1.8–3.1 | 1.5–3.0 hp |
| Chainsaw (professional) | 70–120 cc | 4.3–7.3 | 4.5–8.5 hp |
| Walk-behind mower | 140–190 cc | 8.5–11.6 | 4.0–6.5 hp |
| Riding mower | 500–750 cc | 30.5–45.8 | 15–25 hp |
| Portable generator | 80–420 cc | 4.9–25.6 | 1.5–15 hp |
| Motorcycle (125 cc) | 124–125 cc | 7.6 | 11–15 hp |
| Motorcycle (liter bike) | 998–1,000 cc | 60.9–61.0 | 180–215 hp |
| Harley Milwaukee-Eight 117 | 1,923 cc | 117.3 | ~105 hp / 125 lb-ft |

The cubic inch died first at the bottom of the displacement range — where an inch-based number (a 190 cc lawn mower engine is 11.6 cubic inches) is too small to be meaningful — and is dying last at the top, where the 500-cubic-inch Cadillac still means something to the man who remembers when Cadillac was the standard of the world.

The Harley 117 is the last American engine regularly discussed in cubic inches by its manufacturer. Harley-Davidson calls it the "Milwaukee-Eight 117" — 117 cubic inches, 1,923 cc. The cubic-inch number is the primary designation; the cc number is the parenthetical. It will almost certainly be the last.

---

## FAQ

### How do I quickly convert cubic inches to liters in my head?

**Divide by 61.** 350 ÷ 61 = 5.74 (exact: 5.735, error 0.09%). 302 ÷ 61 = 4.95 (exact: 4.949, error 0.02%). 426 ÷ 61 = 6.98 (exact: 6.981, error 0.01%). The ÷61 shortcut is accurate to within 0.1% across the entire range of automotive displacements. For liters to cubic inches: **multiply by 61**. 2.0 × 61 = 122 (exact: 122.0, error < 0.01%). This is the only engine-displacement mental math you need at a car show.

For precise conversion: [cubic inches to liters](https://enginstack.com/cubic-inches-to-liters) and [liters to cubic inches](https://enginstack.com/liters-to-cubic-inches).

### Why do some engines have the same displacement in cubic inches but completely different metric badges?

Because the metric badge is chosen by the **marketing department**, not the engineering department. The Chevy 302 (Z/28 Camaro, 1967–1969) and the Ford 302 (Mustang, 1968–1995) both displace 301.6 cubic inches / 4.95 liters. Chevy never badged the 302 in liters. Ford badged its 302 as the 5.0. Same displacement. Two manufacturers. One became a cultural icon; the other is a footnote in a Camaro registry. The badge, not the displacement, is what people remember.

### Are engine displacement badges legally regulated?

No, not in the way that fuel economy labels or safety ratings are. There is no international standard for displacement badge accuracy. The convention — that the badge rounds to the nearest 0.1 L — is an industry norm, not a law. A manufacturer could legally badge a 2.5-liter engine as "3.0" — but no manufacturer does, because automotive journalists would discover the discrepancy in approximately four hours. **Self-policing by the enthusiast press** is the only enforcement mechanism, and it has worked reasonably well for 50 years.

A "2.0T" that displaces 2,051 cc is a 2.1-liter engine in every regulatory database, regardless of what the decklid says.

### What's the relationship between engine displacement and horsepower?

Displacement is the engine's size. Horsepower is what it does with that size. A rule of thumb:

- **Naturally aspirated:** 60–80 hp/L (1.0–1.3 hp/cu in)
- **Turbocharged production:** 100–200 hp/L (1.6–3.3 hp/cu in)
- **Racing (F1):** ~530 hp/L (8.7 hp/cu in)

The 0.01639 constant converts the displacement. The horsepower comes from everything else. See the [Energy & Power Conversion Guide](https://enginstack.com/guides/energy-power-conversion-guide) for the full horsepower story — James Watt, the four different horsepower definitions, and the kW/kWh confusion.

### How many cubic inches was the engine in the original Volkswagen Beetle?

The original VW Beetle (Type 1) air-cooled flat-four started at 1,131 cc (69.0 cubic inches) in 1938 and grew to 1,584 cc (96.7 cubic inches) by 1971. The "1600" produced 57 horsepower — **0.59 hp/cu in**. A modern 1.5-liter turbo (91.5 cubic inches) produces roughly 180 hp — **1.97 hp/cu in**. The Beetle's engine and a modern Civic's engine are roughly the same physical size. One produces three times the power. That is the story of 85 years of internal combustion development in two numbers: 57 and 180, from the same swept volume.

### Why did the Dodge Viper's 488 cubic inches equal almost exactly 8.0 liters?

It's a numerical coincidence — the closest any production engine has ever gotten to its metric badge. The Gen 4 Viper (2008–2010) used a 4.00-inch bore and 3.88-inch stroke in a V10:

```
π × (4.00/2)² × 3.88 × 10 = 487.8 ci → rounded to 488
× 0.016387 = 7.993 L → within 0.09% of 8.00
```

An engine dimensioned in inches, with bore and stroke chosen for performance, whose cubic-inch displacement multiplied by 0.016387 lands within 0.09% of a clean metric round number. **No other production engine has ever hit its metric badge with this level of accidental precision.**

---

## Related Tools & References

- [Cubic Inches to Liters Calculator](https://enginstack.com/cubic-inches-to-liters) — exact 0.016387064 multiplier
- [Liters to Cubic Inches Calculator](https://enginstack.com/liters-to-cubic-inches) — the reverse (×61.024)
- [kW to HP Converter](https://enginstack.com/kw-to-hp) — metric to mechanical horsepower
- [ft·lb to N·m Converter](https://enginstack.com/ft-lbs-to-nm) — torque, the engine's other number
- [Energy & Power Conversion Guide](https://enginstack.com/guides/energy-power-conversion-guide) — why confusing kW and kWh costs millions
- [All 150+ EnginStack Unit Converters](https://enginstack.com/volume/)

---

*Originally published at [enginstack.com](https://enginstack.com/guides/engine-displacement-conversion-guide). All conversion constants are traceable to the 1959 International Yard and Pound Agreement and NIST metrology standards.*
