# R01 T1: web API contract sync

T1 makes `DashboardResponse.finances` optional so a moderator response can omit the field. This generated type keeps the web client aligned with R01-01 and R01-07 while shared API consumers adopt R01-05, R01-06 and R01-08. T2 handles panel dashboard rendering and role checks.

The only generated change is `DashboardResponse.finances?: Record<string, unknown> | null` in `src/lib/generated-api.ts`. Before generation, the panel, web and mobile contract files shared SHA-256 `4e1eda9d5c0987627e3c15d7b65812ff97847c632335faac96780b4e8c597a86` and the web file had no local changes.

The official API generator wrote all three outputs with `poetry run python scripts/generate_api_contracts.py`. `poetry run python scripts/generate_api_contracts.py --check` confirmed the outputs match OpenAPI. API consumer-contract tests passed (3 passed), and the full API suite passed (360 passed, 29 skipped).
