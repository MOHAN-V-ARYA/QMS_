# Peer Review Procedure

**Document ID:** LDMS-REV-006 · **Owner:** Project Manager

## Review types and authority
| Artifact | Preparer | Required reviewers | Acceptance authority |
|---|---|---|---|
| SRS / acceptance baseline | BA Team | PM, Technical Architect, Test Manager | Customer; CDO for quality exceptions |
| Architecture / API contract / data map | Technical Architect | Developer, BA Team, Test Manager, interface owner | Technical Architect |
| Code / configuration | Developer | Peer developer; Architect for critical interface changes | Designated code owner |
| Test plan / readiness | Test Manager | BA Team, Architect, environment owner | Test Manager |
| Release evidence | PM / Test Manager | Architect, Customer, operations | CEO for business release where applicable |

## Procedure
1. PM identifies artifact, stable version, review objective, scope, reviewers, decision authority, due date, and entry criteria.
2. Preparer ensures the artifact is identifiable, complete enough to review, has supporting references, and is not being silently edited during review.
3. Reviewers independently prepare against the applicable checklist. Focus on correctness, ambiguity, testability, interface/data risk, failure/recovery, security, maintainability, and traceability.
4. Hold a focused review or perform recorded asynchronous review. Record each finding with ID, location, severity, evidence, proposed disposition, owner, and due date. Distinguish defect from preference.
5. Decision authority records approve, approve with bounded actions, rework, or reject. Approval with actions must state which actions block downstream use.
6. Preparer corrects findings and cites changed version. Reviewer verifies corrections; unresolved disagreements are escalated to PM and authority, not silently closed.
7. Store artifact revision, checklist, findings/dispositions, attendees/reviewers, decision, signatures, and date. Update RTM/change links where scope or baselines change.

## Minimum checklist
- Correct artifact/version and review purpose.
- Complete, consistent, unambiguous, standards/policy aligned.
- Risks, dependencies, assumptions, edge cases, exceptions, and degraded behavior addressed.
- Acceptance/test evidence feasible; upstream and downstream trace links valid.
- Findings have severity, owner, disposition, and verified closure.
- Accountable approval is explicit and dated.
