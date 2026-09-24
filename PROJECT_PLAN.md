# Surplus-to-Shelter Project Plan

## 1. Project Summary

**Name:** Surplus-to-Shelter  
**Tagline:** Turn a restaurant's unsold food into a shelter's next meal before it hits the dumpster.  
**Hackathon:** AmiHacks, Track A - NGO / Social Impact

Surplus-to-Shelter is a real-time food rescue coordination system. It takes time-sensitive surplus food, validates its donor-reported usable window, filters recipient organizations by hard constraints, ranks eligible matches transparently, assigns a suitable driver, guides the pickup and delivery, and records the resulting impact.

This is not a generic donation CRUD application. The core decision is:

> Given surplus food available right now, which eligible recipient can use it before the usable window expires, which driver should transport it, and why?

## 2. Repository Starting Point

The current repository is an AI Crop Disease Scanner scaffold:

- `frontend/`: React, TypeScript, Vite, Tailwind CSS, React Router.
- `backend/`: FastAPI, SQLAlchemy, PostgreSQL-oriented configuration, crop analysis and disease routers.
- `database/migrations/`: existing migration location.
- `docker-compose.yml`: frontend, backend, and PostgreSQL services named for the crop-disease application.
- Existing UI and API code is unrelated to food rescue.

### Migration decision

Reuse the frontend and backend build tooling where practical, but replace the crop-disease domain surface with the food-rescue domain. Do not carry crop-analysis models, routes, copy, or dependencies into the MVP unless they remain useful as generic infrastructure. The first implementation phase must rename the application, establish the new modules, and update local configuration/documentation before feature work begins.

## 3. Goals and Non-Goals

### Goals

- Let a donor post a surplus donation in under one minute.
- Capture food quantity, location, preparation time, usable-until time, storage condition, allergens, and contact details.
- Enforce expiry, capacity, dietary, availability, and geographic feasibility constraints.
- Rank eligible recipients with configurable, explainable scores.
- Assign an available driver with sufficient capacity and an achievable ETA.
- Show a donor-to-recipient route and a complete pickup lifecycle.
- Provide in-app status notifications and an impact dashboard.
- Make the 3-5 minute demo visibly simulate a live rescue.
- Keep synthetic/demo data and estimates clearly labeled.
- Continue operating with rule-based matching when ML or routing services are unavailable.

### Non-goals for the 24-hour MVP

- Production identity verification, payment, or legal food-safety certification.
- Autonomous food-safety decisions.
- Live traffic claims or guaranteed real-world ETAs.
- Production-scale multi-city operations.
- Full computer vision or demand forecasting before the core rescue loop works.
- Deployment infrastructure.

## 4. Target Users and Roles

- **Donor:** posts and manages surplus food.
- **Recipient organization:** maintains capacity, needs, preferences, hours, and accepts/rejects matches.
- **Driver/volunteer:** views assignments, route, ETA, and updates pickup status.
- **Operations/admin:** monitors active rescues, exceptions, drivers, and impact.
- **Impact viewer:** reads clearly labeled recorded and estimated metrics.

Role-based authorization is required for private phone numbers, exact addresses, and operational actions.

## 5. Core User Journeys

### Donor journey

1. Open a fast donation form or enter a natural-language description.
2. Review parsed values and correct them.
3. Submit food, location, contact, storage, and donor-reported usable window.
4. See validation state, match progress, driver assignment, and delivery status.

### Operations journey

1. See new donation and remaining usable time.
2. Inspect eligible and rejected recipients.
3. Review the recommended match and component score explanation.
4. Confirm or override the match with an audit note.
5. Assign the best available driver.
6. Monitor the route, timeline, warnings, and exceptions.

### Driver journey

1. View assignment, donor, recipient, capacity, ETA, and remaining food window.
2. Start travel, mark arrival, confirm pickup, start delivery, and confirm delivery.
3. Receive clear warnings if the route becomes infeasible.

### Recipient journey

1. Maintain current need, capacity, preferences, dietary restrictions, hours, and urgency.
2. Review incoming donation details without exposing unnecessary private donor data.
3. Accept or reject the match and confirm delivery.

## 6. MVP Acceptance Criteria

- A donor can post a donation with location and usable-until time.
- Invalid or incomplete safety-window data is visible and cannot be silently treated as safe.
- An expired donation is never matched.
- An incompatible dietary requirement is never recommended.
- A recipient without capacity is never selected.
- A recipient that cannot receive before expiry is rejected.
- Matching shows eligible candidates, rejected reasons, component scores, and a human-readable explanation.
- A driver without sufficient capacity is never assigned.
- An available driver can be assigned and see driver -> donor -> shelter routing.
- The pickup lifecycle progresses through timestamped, actor-attributed status events.
- The demo can run end to end without external ML or routing services.
- Impact values identify whether they are actual recorded values or estimates.
- Synthetic city data is visibly labeled as synthetic demonstration data.

## 7. Target Architecture

```text
frontend/src/
  components/       Reusable status, forms, cards, timeline, and metric views
  pages/            Operations, donor, recipient, driver, matching, impact, demo
  layouts/          Role-aware application shell and navigation
  hooks/            Query and live-status hooks
  services/         Typed API client and notification client
  types/            Shared frontend domain types
  utils/            Formatting, status, urgency, and accessibility helpers
  map/              Leaflet map and route overlays
  charts/           Recharts impact and operations charts
  App.tsx
  main.tsx

backend/app/
  main.py
  config.py
  database.py
  models/           SQLAlchemy persistence models
  schemas/          Pydantic request/response contracts
  routers/          auth, donations, recipients, needs, matching, dispatch, routes, status, impact, demo
  services/         donation validation, notifications, impact, demo orchestration
  matching/         constraints, feature calculation, ranking, explanation
  routing/          distance, travel-time fallback, route service interface
  dispatch/         driver eligibility and assignment
  analytics/        impact aggregation and operational metrics
  utils/             time, geography, security, and error helpers

ml/
  embeddings/       Cached sentence-transformer adapter
  matching/         Semantic feature adapter and fallbacks
  training/         Optional historical success model
  evaluation/       Baseline-vs-ML evaluation scripts
  preprocessing/    Feature preparation and validation

data/
  demo/             Seeded synthetic city data and scenarios
  synthetic/        Generated historical examples, clearly labeled

tests/
  backend/ matching/ routing/ ml/ frontend/

docs/
  architecture.md matching.md routing.md ml.md demo.md safety.md JUDGE_QA.md
```

### Service boundaries

Keep matching, routing, dispatch, notifications, and analytics behind service interfaces. The MVP may run them in one FastAPI process, but business logic must not depend directly on SQLite/PostgreSQL or a particular routing/embedding provider.

## 8. Data Model

Implement explicit relationships for:

- `User`: authentication, role, verification label, timestamps.
- `DonorProfile`: organization/contact details and verified/demo-verified state.
- `RecipientOrganization`: location, capacity, preferences, restrictions, hours, availability, verification.
- `RecipientNeed`: required-by time, current need, urgency, description, status.
- `Donation`: food type, description, quantity/unit, servings, dietary type, allergens, prepared/available/usable times, storage condition, location, donor, status.
- `FoodAttribute`: normalized category, tags, dietary and allergen attributes.
- `Driver`: vehicle, capacity, location, availability, status, verification.
- `Match`: donation, recipient, hard-filter result, all score components, overall score, explanation, decision state.
- `Route`: ordered stops, distance, estimated travel time, provider/fallback metadata, feasibility.
- `Pickup`: donation, match, driver, route, lifecycle status.
- `StatusEvent`: entity, status, actor, timestamp, optional note.
- `Notification`: recipient, event type, message, read state, timestamp.
- `ImpactRecord`: rescued servings, weight, people served, duration, estimate/actual label, methodology reference.

Use timezone-aware UTC timestamps. Store latitude/longitude as numeric fields for the MVP and isolate any future geospatial database upgrade behind the routing service.

## 9. Matching Engine

### Hard constraint filter

Reject candidates when any of these is true:

- Donation is claimed, cancelled, missing required location, or expired.
- Donation has `current_time >= usable_until`.
- Recipient is closed, unavailable, at capacity, or outside its operating window.
- Food category or dietary requirements conflict.
- Recipient cannot accept the required quantity or cannot receive it before expiry.
- Pickup route cannot be completed within the donor-reported window.

Every rejection must include a machine-readable code and human-readable reason.

### Feature calculation

For each remaining recipient calculate normalized values in `[0, 1]`:

- `time_score`: remaining usable time and expiry risk.
- `distance_score`: donor-to-recipient distance/travel time.
- `quantity_score`: fit between servings and current/max capacity.
- `urgency_score`: recipient need urgency and required-by time.
- `food_score`: explicit food-category compatibility.
- `dietary_score`: dietary compatibility after hard validation.
- `semantic_score`: donation description versus recipient need description.

### Configurable ranking

```text
overall_score =
    w_time * time_score +
    w_distance * distance_score +
    w_quantity * quantity_score +
    w_urgency * urgency_score +
    w_food * food_score +
    w_dietary * dietary_score +
    w_semantic * semantic_score
```

Initial weights:

- time/expiry risk: 0.25
- distance/travel time: 0.20
- quantity fit: 0.20
- urgency: 0.15
- food compatibility: 0.10
- dietary compatibility: 0.05
- semantic similarity: 0.05

Keep weights in configuration and persist the score components used for every match. The explanation should show distance, quantity fit, urgency, compatibility, pickup-window overlap, remaining window, and important tradeoffs. A score must never appear without reasons.

## 10. Semantic Matching and ML

### Semantic matching

Use `sentence-transformers/all-MiniLM-L6-v2` by default, with `all-mpnet-base-v2` as an optional higher-quality model. Cache normalized embeddings by stable input text. Embeddings are one ranking feature only and can never override safety, dietary, capacity, availability, or geographic feasibility.

When the model is unavailable, use explicit food-type compatibility and set the response metadata to `semantic_fallback: true`.

### Historical success prediction

Only add a learned match-success model after the rule-based baseline and demo are stable. Candidate features include distance, travel time, quantity ratio, remaining time, urgency, compatibility, semantic similarity, driver ETA, and pickup-window overlap. Compare a baseline with `HistGradientBoostingClassifier` or `RandomForestClassifier` using precision, recall, F1, ROC-AUC where appropriate, and ranking precision@k/recall@k.

Synthetic training data and metrics must be labeled as synthetic. Never fabricate performance numbers. If the model is unavailable or confidence is low, use the baseline rules.

## 11. Routing and Dispatch

### Routing

- Use Leaflet and OpenStreetMap for the map view.
- Display driver, donor, recipient, route line, distance, ETA, and remaining usable time.
- Define a routing-provider interface.
- Use straight-line distance plus a configurable speed/travel-time estimate as the local fallback.
- Label estimates clearly and never claim live traffic.
- For the MVP, optimize the route `driver -> donor -> recipient`.
- Consider multi-stop pickup ordering only after the single-donation route is reliable.

### Driver assignment

Filter out drivers who are offline, unavailable, already committed, or below the donation capacity. Rank the rest by ETA, distance to donor, vehicle suitability, availability, and remaining usable time. Persist accepted and rejected driver candidates with reasons.

Driver statuses:

`AVAILABLE`, `ASSIGNED`, `EN_ROUTE_TO_DONOR`, `AT_DONOR`, `PICKED_UP`, `EN_ROUTE_TO_SHELTER`, `DELIVERED`, `OFFLINE`.

## 12. Status, Notifications, and Safety

Donation/pickup lifecycle:

`POSTED -> MATCHED -> DRIVER_ASSIGNED -> DRIVER_EN_ROUTE -> PICKUP_READY -> PICKED_UP -> DELIVERING -> DELIVERED -> COMPLETED`.

Each transition records timestamp, actor, and optional note. Reject invalid transitions and make concurrent claims idempotent where possible.

In-app notifications cover donation posted, match found, shelter accepted, driver assigned/approaching, pickup completed, delivery completed, expiry warning, and match failed. Keep notification delivery behind an interface so SMS/email/push can be added later.

Food safety is coordination logic, not safety certification. Use labels:

`SAFE_WINDOW_VALID`, `EXPIRY_WARNING`, `EXPIRY_RISK`, `EXPIRED`, `MISSING_SAFETY_INFORMATION`.

Display “Donor-reported usable window” and “Requires verification.” Never claim the system has verified that food is safe.

## 13. API Contract

Implement typed FastAPI routes for:

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `POST /donations`, `GET /donations`, `GET /donations/{id}`, `PATCH /donations/{id}`
- `GET /recipients`, `GET /recipients/{id}`, `POST /recipients`, `PATCH /recipients/{id}`
- `POST /needs`, `GET /needs`, `PATCH /needs/{id}`
- `POST /matching/run/{donation_id}`, `GET /matching/{donation_id}`, `GET /matching/{donation_id}/explanation`
- `GET /drivers`, `POST /drivers`, `PATCH /drivers/{id}`
- `POST /dispatch/{donation_id}`, `GET /dispatch/{donation_id}`
- `GET /routes/{pickup_id}`
- `PATCH /pickups/{id}/status`, `GET /pickups/{id}/timeline`
- `GET /impact`, `GET /impact/analytics`
- `POST /demo/reset`, `POST /demo/run`

Use Pydantic validation, consistent error codes, JWT authentication, password hashing, role checks, CORS from environment configuration, and safe ORM queries. Do not commit secrets; maintain `.env.example` for local values.

## 14. Frontend Plan

Build the first screen as the usable operations experience rather than a marketing-only landing page. The interface should make time, location, food, need, driver, and route immediately scannable.

Primary views:

- Operations dashboard: active donations, matches, unassigned work, drivers, pickups, warnings, and impact.
- Fast donor intake: compact form plus optional natural-language parser with editable review state.
- Matching screen: donation summary, eligible/rejected candidates, score breakdown, and “why this match” explanation.
- Dispatch screen: driver, vehicle, ETA, donor, recipient, route, time remaining, and status controls.
- Driver dashboard: assignment and large touch-friendly lifecycle actions.
- Recipient dashboard: needs, capacity, incoming donations, and urgency.
- Impact dashboard: recorded versus estimated measures and methodology link.
- Demo mode: live simulation controls and visibly changing timeline/map/metrics.

Use React Router, TanStack Query, Recharts, Leaflet, OpenStreetMap, and Lucide icons. Keep controls accessible: labels, keyboard support, high contrast, touch-friendly actions, and status conveyed by text as well as color. Use responsive layouts for desktop operations and mobile driver workflows.

## 15. Synthetic Demo City

Create a clearly labeled fictional/demo environment with:

- 10 donors
- 10 shelters/recipient organizations
- 8 drivers
- 30 donations
- 20 needs
- 50 historical matches

Seed scenarios:

1. Perfect match
2. Urgent donation
3. Expiry-risk donation
4. Dietary mismatch
5. Capacity mismatch
6. Far-away recipient
7. Driver capacity problem
8. No valid recipient
9. Multiple eligible recipients
10. Multi-stop route candidate

The primary demo should post 40 vegetarian meals available now with a two-hour donor-reported window, reject incompatible or infeasible candidates, select a ranked recipient, assign a driver, render the route, progress the lifecycle, and update impact metrics.

## 16. Implementation Phases

### Phase 1 - Foundation and migration

- Rename product metadata and replace crop-disease routes/copy.
- Establish target folders and configuration.
- Choose SQLite for local MVP development while keeping SQLAlchemy portable to PostgreSQL.
- Add authentication primitives, role model, database session, migrations, health endpoint, and API error format.
- Add `docs/` and update README for the new product.

### Phase 2 - Domain data and intake

- Add donor, recipient, need, driver, donation, and food-attribute models.
- Implement donation validation and safety-window states.
- Build fast donor intake and seed data.

### Phase 3 - Rule-based matching

- Implement hard constraints, distance/travel-time fallback, normalized features, configurable weights, and explanations.
- Add critical expiry, dietary, capacity, and recipient-feasibility tests.

### Phase 4 - Matching operations UI

- Build operations dashboard and matching screen.
- Show ranked and rejected candidates, reasons, score breakdown, and warnings.

### Phase 5 - Dispatch and lifecycle

- Implement driver eligibility, assignment, pickup, status transitions, timeline, and in-app notifications.
- Add concurrency/idempotency checks for claims and transitions.

### Phase 6 - Routing and maps

- Add Leaflet/OpenStreetMap visualization and route fallback.
- Display driver -> donor -> recipient route, distance, ETA, and remaining usable time.

### Phase 7 - Impact and analytics

- Record meals, weight, people served, match/pickup duration, expiry outcomes, and estimated CO2e.
- Add recorded/estimated labels and methodology documentation.

### Phase 8 - Semantic matching

- Add cached MiniLM embeddings, semantic feature storage, fallback metadata, and comparison tests.

### Phase 9 - Optional ML evaluation

- Add historical-success preprocessing, baseline comparison, evaluation scripts, and honest synthetic-data labeling.

### Phase 10 - Demo simulation and polish

- Implement reset/run demo endpoints and visible state progression.
- Add all ten scenarios as selectable fixtures.
- Polish responsive/accessibility behavior and run the complete validation checklist.

After every phase: run focused tests, backend checks, frontend build, and a manual end-to-end demo smoke test before moving on.

## 17. Testing Strategy

### Backend and matching

- Donation creation and validation.
- Missing, warning, risky, and expired usable windows.
- Expired donation is never matched.
- Dietary incompatibility is never recommended.
- Recipient capacity and quantity fit.
- Closed recipient and required-by/expiry feasibility.
- Distance and travel-time calculations.
- Ranking component normalization and configurable weights.
- Explanation generation and rejection reasons.
- Driver capacity and assignment ranking.
- Route fallback and route feasibility.
- Valid/invalid status transitions and timeline ordering.
- Authorization and private-field access.
- Impact aggregation and recorded/estimated labels.
- Demo reset and deterministic simulation progression.

### ML

- Text preprocessing and embedding cache keys.
- Semantic fallback when model loading fails.
- Baseline and model feature shape validation.
- Metrics calculation without fabricated defaults.

### Frontend

- Fast intake form validation and editable parser review.
- Matching, rejection reasons, timeline, and status control rendering.
- Responsive driver actions.
- Loading, empty, expired, no-match, and API-error states.
- Keyboard navigation and accessible labels.

## 18. Documentation Deliverables

- `README.md`: problem, solution, architecture, features, tech stack, local setup, demo, tests, limitations, and synthetic-data disclaimer.
- `docs/architecture.md`: components, boundaries, persistence, and failure fallbacks.
- `docs/matching.md`: constraints, features, weights, explanation, and examples.
- `docs/routing.md`: map provider, fallback travel model, limitations, and multi-stop future work.
- `docs/ml.md`: embeddings, optional success model, baseline, data provenance, and evaluation.
- `docs/demo.md`: reset/run instructions and 3-5 minute script.
- `docs/safety.md`: donor-reported windows, non-certification language, expiry behavior, and operational warnings.
- `docs/JUDGE_QA.md`: answers to the specified architecture, ML, safety, trust, scaling, and simulation questions.
- `.env.example`: non-secret local configuration.

## 19. Risks and Mitigations

- **The existing scaffold is unrelated:** replace domain code early and avoid incremental contamination from crop-disease concepts.
- **ML model download or runtime failure:** rule-based matching remains the authoritative fallback.
- **Routing API unavailable:** use distance plus configurable estimated speed and label it clearly.
- **Synthetic data appears real:** show “Synthetic demonstration data” throughout demo and impact views.
- **Time-window race conditions:** validate at match and dispatch time, use UTC, and reject expired claims.
- **Overbuilt UI delays the core loop:** prioritize post -> filter -> rank -> assign -> route -> deliver before advanced analytics.
- **Unsafe interpretation of food status:** use donor-reported language and require verification; never certify safety.

## 20. Final Demo Script

1. Open the operations dashboard and point out the synthetic demo label.
2. Post 40 vegetarian meals with a two-hour donor-reported usable window.
3. Show immediate validation and recipient search.
4. Show candidates rejected for incompatibility, capacity, or expiry feasibility.
5. Open the recommended match and explain each score component.
6. Assign the best available driver and show the driver-to-donor-to-shelter route.
7. Progress through assigned, en route, picked up, delivering, delivered, and completed.
8. Show in-app notifications and the updated impact dashboard.
9. Explain the rule-based baseline, semantic feature fallback, and what is simulated versus recorded.

## 21. Definition of Done

The project is ready for the hackathon demo when the primary scenario completes locally from donor intake to impact update, all four critical safety/capacity tests pass, the route and timeline are visible, the app works without external ML/routing services, synthetic data and estimates are labeled, the README and judge documentation exist, and no UI or API claims exceed what the implementation actually verifies.
