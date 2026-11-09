# Release Readiness Checklist

**Release / build:** ______ · **Target date:** ______ · **PM:** ______ · **Test Manager:** ______

## Scope and approvals
- [ ] Release contents match approved requirement and change baselines; known limitations and rollback target are versioned.
- [ ] Customer acceptance evidence is recorded for agreed business scenarios.
- [ ] PM confirms risks, schedule, support and communication; Architect approves technical/interface readiness.
- [ ] Test Manager signs evidence summary; CEO authorizes business release where applicable.

## Defects and requirements
- [ ] Zero unresolved critical defects; all high defects have documented disposition and authority approval.
- [ ] Every approved in-scope requirement traces both ways to current design/implementation and test evidence.
- [ ] No unreviewed baseline changes; every change has CCB decision and impact regression evidence.
- [ ] Security/privacy, data access controls, audit, and operational access review completed.

## Verification
- [ ] Agreed integration, regression, interface contract, acceptance, and recovery tests executed.
- [ ] Pass threshold (project baseline: at least 80%) met; failed/blocked/not-run cases dispositioned with owner and risk.
- [ ] Route provider timeout/throttle/fallback; mobile offline/retry; status ordering/idempotency; notification and reconciliation checks evidenced.
- [ ] Test environment, data, build, and results are reproducible and linked to this release.

## Operations and decision
- [ ] Data migration/backup and restore point confirmed; rollback procedure rehearsed with named owner.
- [ ] Monitoring, alert thresholds, alert recipients, dashboards, and post-release verification are ready.
- [ ] Support, incident, escalation, customer communication, and hypercare coverage confirmed.
- [ ] Residual risks and go/no-go rationale recorded; no gate is waived without accountable written approval.

**Gate:** ☐ GO ☐ NO-GO ☐ Conditional (conditions / owners / due dates):  
**PM:** ______ **Test Manager:** ______ **Technical Architect:** ______ **Customer:** ______ **CEO (as applicable):** ______  
**Decision timestamp / evidence links:** ______
