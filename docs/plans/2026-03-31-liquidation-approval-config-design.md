# Liquidation Approval Config Design

## Problem

The liquidation approval step (PRELIMINARY → APPROVED → DEFINITIVE) is always mandatory. We need it to be configurable so it can be skipped when not required.

## Approach

Leverage existing `ComplianceRuleConfig` system with a new rule code `LIQUIDATION_APPROVAL_REQUIRED`.

- **Enabled (default):** PRELIMINARY → APPROVED → DEFINITIVE → PAID (current behavior)
- **Disabled:** PRELIMINARY → DEFINITIVE → PAID (skip approval)

## Changes

### Backend - LiquidationService

- Inject `ComplianceRuleConfigRepository`
- Modify `makeLiquidationDefinitive()` to accept PRELIMINARY when rule is disabled
- Keep `approveLiquidation()` unchanged (still callable, just not required)

### Backend - Seed Data

- Add `LIQUIDATION_APPROVAL_REQUIRED` entry in `import.sql`

### Backend - New Endpoint

- `GET /api/liquidation/config/approval-required` → `{ required: boolean }`
- Accessible by ADMIN, AGENT, ACCOUNTING, CLIENT (read-only config check)
- Avoids exposing generic compliance config API to non-admin roles

### Frontend - PaymentPanelComponent

- Fetch approval config on init
- When `approvalRequired = false` and status is PRELIMINARY: show "Make Definitive" button instead of "Approve"
- When `approvalRequired = true`: current behavior unchanged

### i18n

- No new keys needed — reuse existing PAYMENT.APPROVE and PAYMENT.MAKE_DEFINITIVE
