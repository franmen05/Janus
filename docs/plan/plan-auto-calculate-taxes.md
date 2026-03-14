# Auto-Calculate DR Customs Taxes on Declarations

## Context
When tariff lines are added to a declaration, tax amounts (DAI/duty, ITBIS, selective, surcharge) are NOT being calculated. The backend stores whatever the frontend sends as-is. The correct formulas exist in `PreliquidationService` but are disconnected from data entry. The frontend form only captures generic `taxRate`/`taxAmount` instead of the specific DR customs rates.

## Approach
Backend-first (Protocol A). Fix `calculateTariffLineAmounts()` to apply DR customs formulas, auto-recalculate `Declaration.totalTaxes` on every tariff line change, and update the frontend form to capture individual tax rates. **Amounts are auto-calculated from rates but remain editable** — the user can override any calculated amount after the fact.

---

## Phase 1: Backend — Fix tax calculation

### File: `DeclarationService.java`

**1a. Replace `calculateTariffLineAmounts()` (lines 293-312):**
- `totalValue = quantity × unitValue` (if null)
- `dutyAmount = totalValue × dutyRate / 100` (if dutyRate present AND dutyAmount not provided)
- `itbisAmount = (totalValue + dutyAmount) × itbisRate / 100` (if itbisRate present AND itbisAmount not provided)
- `selectiveAmount = totalValue × selectiveRate / 100` (if selectiveRate present AND selectiveAmount not provided)
- `surchargeAmount = totalValue × surchargeRate / 100` (if surchargeRate present AND surchargeAmount not provided)
- `taxAmount = dutyAmount + itbisAmount + selectiveAmount + surchargeAmount + adminFee` (always recalculated as sum)
- **Key**: if the user sends an explicit amount, it takes priority over the auto-calculated value (allows manual override)
- Backward compat: if no DR rates provided, keep old `taxRate/taxAmount` logic

**1b. Add `recalculateDeclarationTotalTaxes(Declaration)`:**
- Sum all tariff line `taxAmount` values → set `declaration.totalTaxes`

**1c. Call recalculate after `addTariffLine()` and `updateTariffLine()`**

---

## Phase 2: Frontend — Tariff line form

### File: `tariff-line-form.component.ts`

- Replace `taxRate`/`taxAmount` fields with: `dutyRate`, `itbisRate`, `selectiveRate`, `surchargeRate`, `adminFee`
- Add editable amount fields: `dutyAmount`, `itbisAmount`, `selectiveAmount`, `surchargeAmount` — pre-filled by backend calculation but user can override
- All optional (no required validators)
- Auto-calculate `totalValue = quantity × unitValue` in real-time (frontend)
- Auto-calculate amounts from rates in real-time (frontend preview), but backend is source of truth
- Group in a "Tax Rates & Amounts" section with rates on left, amounts on right
- On edit mode: load existing amounts from backend, allow user to modify them

### File: `preliquidation.component.ts`

- Show individual tax columns: Duty, ITBIS, Selective, Surcharge, Admin Fee, Total Tax
- Remove generic taxRate/taxAmount columns

---

## Phase 3: i18n

| Key | EN | ES |
|-----|----|----|
| `DECLARATIONS.DUTY_RATE` | Duty Rate (%) | Tasa Arancelaria (%) |
| `DECLARATIONS.ITBIS_RATE` | ITBIS Rate (%) | Tasa ITBIS (%) |
| `DECLARATIONS.SELECTIVE_RATE` | Selective Rate (%) | Tasa Selectiva (%) |
| `DECLARATIONS.SURCHARGE_RATE` | Surcharge Rate (%) | Tasa de Recargo (%) |
| `DECLARATIONS.ADMIN_FEE` | Admin Fee | Comisión Administrativa |
| `DECLARATIONS.TAX_RATES_SECTION` | Tax Rates | Tasas Impositivas |

---

## Critical Files
- `janus-backend/.../declaration/application/DeclarationService.java` — fix `calculateTariffLineAmounts()`, add `recalculateDeclarationTotalTaxes()`
- `janus-backend/.../declaration/domain/service/PreliquidationService.java` — reference for correct formulas
- `janus-frontend/.../declarations/tariff-line-form/tariff-line-form.component.ts` — add rate fields
- `janus-frontend/.../declarations/preliquidation/preliquidation.component.ts` — show tax breakdown
- `janus-frontend/src/assets/i18n/en.json` + `es.json` — new keys

## Verification
1. `cd janus-backend && ./gradlew test`
2. API test: add tariff line with dutyRate=20, itbisRate=18, quantity=10, unitValue=1000 → expect dutyAmount=2000, itbisAmount=2160, taxAmount=4660
3. `cd janus-frontend && npx ng build`
4. Browser: create tariff line, verify amounts auto-calculated and Declaration.totalTaxes updated
