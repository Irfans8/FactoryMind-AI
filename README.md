# FactoryMind AI — Integrated Factory Management MVP

A local factory management application using React + Vite, Python FastAPI and SQLite. The original Production Dashboard, Production Tracking, Rejection Tracking and Reports are retained. New department workspaces add basic activity registers for Quality, Maintenance, Delivery & Dispatch, Design & Engineering, Stores & Inventory, and HR & Manpower, plus a Management overview.

## Requirements
- Python 3.15 (launcher uses `py -3.15`)
- Node.js LTS

## Start on Windows
1. Extract the project folder.
2. Double-click `START_FACTORYMIND.bat`.
3. The first run installs Python and frontend packages; internet is required.
4. The dashboard opens at http://127.0.0.1:5173/.
5. Keep the Backend and Frontend command windows open while using the app.

## Department workspaces
- **Production:** Existing hourly production, target, actual, rejection and reports.
- **Quality:** Inspection, complaints, NCR, CAPA and calibration activity register.
- **Maintenance:** Breakdown, preventive maintenance, electrical/mechanical and spare-parts register.
- **Delivery & Dispatch:** Customer orders, packing, dispatch, transport and delivery register.
- **Design & Engineering:** Drawings, revisions, ECN, tool design and process development register.
- **Stores & Inventory:** Raw material, tools, inserts, consumables and purchase requests register.
- **HR & Manpower:** Attendance, manpower allocation, training, skill assessment and leave register.
- **Management:** Cross-department activity overview and open-activity count.

Each new department has a date, activity/title, category, reference, status, responsible person, optional quantity and remarks. Entries are stored in SQLite and remain after restarting the app.

## API
- Backend: http://127.0.0.1:8000
- API documentation: http://127.0.0.1:8000/docs

## Data preservation
The database is `backend\factorymind.db`. Keep this file to preserve your existing production and rejection records. The new department table is added automatically when the backend starts; existing tables are not dropped.

## Important limitations
This is a local development MVP, not a production-secured multi-factory SaaS. It does not yet include user roles, cloud sync, customer/vendor integrations, approval workflows, or specialized ERP inventory/dispatch accounting. The department registers are a first functional foundation that can be expanded with department-specific fields and reports.
