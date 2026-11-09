# Requirements Traceability Matrix (RTM)

**Project:** Logistics and Delivery Management System (LDMS) · **Baseline / revision:** ______ · **As of:** ______ · **Maintainer:** BA Team

Maintain traceability in both directions. Use stable IDs and versioned links; a link alone is not evidence that the linked artifact is current or passed.

| Provider need / source | Requirement ID / version | Acceptance criteria / risk | Design / API / data map | Implementation / change | Test ID / method / result | Defect / CAPA | Owner / approval |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

## Review queries
- **Forward gaps:** provider needs without SRS requirements; requirements without design/implementation/test links.
- **Reverse gaps:** design/code/tests without an approved requirement, justified technical constraint, or approved change.
- **Unverified:** approved requirements with no current passing evidence or accepted exception.
- **Change impact:** changed requirement with no identified design, code, test, regression, provider, and release impact.
- **Nonconformance links:** each relevant defect/CAPA points to affected requirement(s) and retest evidence.

## Example interface coverage
| Need | Requirement | Design / contract | Test evidence | Defect / disposition |
|---|---|---|---|---|
| Avoid duplicate driver allocation during retry | REQ-002 | API-04 idempotency contract | TC-204 assignment idempotency | Link any duplicate assignment issue |
| Preserve delivered state on late event replay | REQ-003 | Driver status state machine | TC-307 order/replay cases | DF-018 open; release blocker |
| Route provider throttling is safe | REQ-005 | API-12 Retry-After contract | TC-512 timeout / 429 / fallback | DF-021 in progress |

**Reviewed by BA Team:** ______ **Technical Architect:** ______ **Test Manager:** ______ **PM:** ______  
**Orphan links dispositioned / date:** ______
