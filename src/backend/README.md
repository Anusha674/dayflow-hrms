# 🐬 Dayflow HRMS — MySQL Backend Architecture

This directory contains the Production-ready **FastAPI + MySQL** backend implementation for Dayflow HRMS.

---

## 🛠️ Tech Stack & Requirements

- **Database**: MySQL 8.0+ (InnoDB engine, `utf8mb4_unicode_ci` charset)
- **Language & Framework**: Python 3.11+, FastAPI, Uvicorn
- **ORM & DB Driver**: SQLAlchemy 2.0, PyMySQL, Cryptography
- **Migrations**: Alembic

---

## 🗄️ Database Provisioning (MySQL)

### 1. Execute SQL Schema
To create the `dayflow_hrms` database and all 8 relational tables (`users`, `employees`, `attendance`, `leave_requests`, `payroll`, `documents`, `notifications`, `audit_logs`), run:

```bash
mysql -u root -p < schema.sql
```

### 2. Environment Configuration (`.env`)
Copy `.env.example` to `.env` and set your MySQL credentials:

```ini
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/dayflow_hrms
JWT_SECRET=super-secret-jwt-key-replace-in-production
CORS_ORIGINS=http://localhost:5173
```

---

## 🚀 Running the FastAPI Server

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. **API Documentation:**
   Open Swagger UI at `http://localhost:8000/docs`
