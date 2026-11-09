# Delivery Quality OS

A Java + SQLite quality-management workspace for the **Logistics and Delivery Management System (LDMS)**. It serves a responsive HTML/CSS/vanilla-JS app and JSON API from one service. Demo records cover order intake, assignment idempotency, driver status events, mobile offline behavior, route-provider contracts, notifications, access control, and reporting. The sample development team is Mohan V (Software Engineer I), Nruthya (Software Engineer II), and Sinchana (Software Engineer III). The displayed sample profile randomly rotates among these developers on each server startup and will not select the same person twice in a row; this is demo presentation behavior, not authentication.

## Run locally

Requirements: Java 17+ and Maven 3.8+.

```powershell
mvn test
mvn package
java -jar target/delivery-quality-os-1.0.0.jar
```

Open <http://localhost:8080>. The server creates `data/qms.db` on first launch and seeds demo records only when the requirements table is empty. Set `PORT` and `QMS_DB` to change the listen port and SQLite file:

```powershell
$env:PORT = "8080"
$env:QMS_DB = "data/qms.db"
java -jar target/delivery-quality-os-1.0.0.jar
```

The UI includes an overview and lifecycle, requirement/defect/review/test/CAPA CRUD, review and test-status workflows, traceability CSV, quality report download, evidence-backed release gate, and direct downloads for the controlled-plan/procedure/checklist/template set. The report derives current defect aging from persisted opened dates. First-pass review yield and change-impact coverage are explicitly marked illustrative demo estimates because the prototype does not persist review iteration or change-impact/retest history. Historical trend deltas are not presented as measured. For browser access from another machine, bind through your normal reverse proxy; the app does not include authentication or TLS.

## API

All API responses use JSON. Create and partial-update request bodies are JSON. Record IDs are SQLite integer IDs.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness |
| GET | `/api/dashboard` | Dashboard metrics, lifecycle, recent activity |
| GET | `/api/report` | Quality indicators for report export |
| GET / POST | `/api/requirements` | List / create requirements |
| PATCH / DELETE | `/api/requirements/{id}` | Update / delete requirement |
| GET / POST | `/api/defects` | List / create defects |
| PATCH / DELETE | `/api/defects/{id}` | Update / delete defect |
| GET / POST | `/api/reviews` | List / schedule review |
| PATCH / DELETE | `/api/reviews/{id}` | Update / delete review |
| GET / POST | `/api/tests` | List / create verification case |
| PATCH / DELETE | `/api/tests/{id}` | Update / delete verification case |
| GET / POST | `/api/capas` | List / create corrective action |
| PATCH / DELETE | `/api/capas/{id}` | Update / delete corrective action |
| GET / PATCH | `/api/release` | Read gate / record approval, rollback and monitoring evidence |
| GET | `/docs/{document}.md` | Download a controlled QMS document |

Unknown fields are ignored; required fields are checked; invalid requests return `400`, missing records return `404`. The application uses prepared statements for record writes and whitelisted entity/field names.

## Free deployment and SQLite persistence

The app is a single HTTP service. Vercel and Netlify primarily host static/serverless applications and do not run this Java server as-is; use a container-capable host instead. A Render blueprint is included:

1. Push this repository to GitHub.
2. In Render, create a **Blueprint** from the repository and apply `render.yaml` (or create a Docker web service from the repository).
3. Keep the Free plan and deploy. The Dockerfile builds the Java 17 app; `/api/health` is the health check.
4. Open the Render service URL. The first request may take a little longer while a free instance wakes up.

The included free service configuration is intended for a classroom prototype. Check the provider's current quotas and policies before deployment.

**Important persistence limitation:** SQLite is a local file, not a network database. Free service instances commonly have ephemeral filesystems, can sleep/restart, and may be replaced during deploy. A `data/qms.db` stored on that filesystem may be lost; multiple replicas do not share or safely coordinate that file. Do not treat free-hosted SQLite as durable, backed up, or production-ready. For durable deployment, use a paid persistent disk mounted at the database path with a single app instance and scheduled backups, or migrate to a managed database (typically PostgreSQL) and update the JDBC/storage implementation. Never store sensitive customer/driver data in this demo without authentication, access controls, encryption, retention policy, and operational backups.

The server has no bundled authentication, authorization, CSRF protection, or production observability. Restrict network access or add an authenticated gateway before sharing a deployment.

## Documents

Downloadable controlled documents are in `src/main/resources/web/docs/` and are served from the QMS library as editable **Word (.docx)** and **Excel (.xlsx)** files. The Markdown source copies remain available in the repository:

- Project Quality Plan
- Requirements Development & Management Procedure
- Requirement Review Checklist
- Change Request Form
- Requirements Traceability Matrix
- Peer Review Procedure
- Release Readiness Checklist
- CAPA Procedure

The Word exports preserve headings and list structure. The Excel exports place each document line into an editable, section-labeled worksheet; they are convenient for tracking/checklist use, but do not replace the controlled procedure as the source of truth.

## Tests

`mvn test` starts the Java HTTP service against an isolated database under `target/` and exercises seeded data, document downloads, validation, requirement CRUD, report endpoints, and release-evidence updates.
