# Delivery Refactor Tasks

## Discovery & Preparation
- [ ] Map current delivery order flow (creation, assignment, routing, completion) and document pain points.
- [ ] Inventory all delivery-related components/screens and note which must migrate to shadcn/ui primitives.
- [ ] Confirm responsive breakpoints in `tailwind.config.js` align with delivery UX needs.

## Design System & shadcn Setup
- [ ] Install/verify shadcn CLI configuration and baseline UI tokens (colors, spacing, radius).
- [ ] Create shadcn-based primitives required for delivery (button variants, sheets/modal, table, badge, tabs).
- [ ] Establish shared layout patterns for mobile/tablet/desktop delivery screens.

## Delivery UX Redesign
- [ ] Redesign order list with status badges, ETA, and assignment controls (no live courier tracking).
- [ ] Build streamlined assignment workflow that works for touch devices.
- [ ] Ensure detail view includes customer info, order items, and quick actions (call, message, reprint).
- [ ] Validate all screens for accessibility (focus order, keyboard Nav, ARIA where needed).

## Thermal Printing Templates
- [ ] Define required receipt/route slip formats for 58mm and 80mm printers.
- [ ] Implement print templates (Handlebars/JSX) with dynamic sections (order items, notes, timestamps).
- [ ] Wire templates to existing print service with ESC/POS commands and page width controls.
- [ ] Run end-to-end print tests on physical or emulated thermal printer and capture sample outputs.

## Dynamic Delivery Fee Calculation
- [ ] Add configuration to set origin location (latitude/longitude or address) in the admin settings.
- [x] Integrate geocoding service to resolve destination coordinates from customer CEP/address.
- [x] Calculate distance and duration using origin/destination (e.g., Google Distance Matrix, Mapbox).
- [x] Implement dynamic pricing rules (base fee, per-km, per-minute, surge windows) with override options.
- [x] Expose calculated fee in order creation UI and persist in order payload with audit trail.

## Integration & Data Layer
- [ ] Refactor delivery API routes/services to normalize status transitions and pricing fields.
- [ ] Update React Query hooks (`useDeliveries`, `useDeliveryZones`, etc.) to match new schemas.
- [ ] Add optimistic updates and error handling for assignment, status updates, and printing.
- [ ] Create background job (if needed) to reconcile delivery status with external couriers/partners.

## QA, Observability & Documentation
- [ ] Implement critical unit/integration tests for fee calculation, order lifecycle, and printing.
- [ ] Add logging/telemetry around delivery assignment, fee overrides, and print failures.
- [ ] Update README/docs with new delivery workflow, printer setup, and configuration steps.
- [ ] Schedule usability review with delivery stakeholders and incorporate feedback.

## Stretch Improvements
- [ ] CEP auto-fill with ViaCEP/Postmon fallback and manual override flow.
- [ ] Auto-suggest delivery zones and SLA alerts based on historical performance.
- [ ] Persist customer delivery preferences (gate info, contact) and expose in UI.
- [ ] Maintain history of print jobs with quick reprint and operator attribution.
