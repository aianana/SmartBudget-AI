# SmartBudget AI

AI-powered personal finance assistant that analyzes CSV/PDF bank statements,
categorizes expenses, detects spending patterns, and provides actionable budgeting insights.

---

## Problem

People often do not understand where their money goes every month.
Bank apps show transactions, but they rarely provide intelligent financial insights.

SmartBudget AI helps users:
- analyze spending habits
- detect unnecessary expenses
- receive AI-generated recommendations
- improve budgeting decisions

---

## Features

- Upload bank statements (CSV/PDF)
- Automatic expense categorization
- Spending analytics
- AI-generated financial recommendations
- Monthly budget overview
- Secure environment variable handling
- Dockerized deployment

---

## Tech Stack

### Frontend
- React / Next.js

### Backend
- Node.js / Express

### AI
- OpenAI API

### DevSecOps
- Docker
- Docker Compose
- GitHub Actions CI/CD

---

## Project Structure

```text
backend/     → API & business logic
frontend/    → User interface
.github/     → CI/CD workflows
```

---

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/your-team/smartbudget-ai.git
cd smartbudget-ai
```

### 2. Configure environment

Create `.env` file:

```env
OPENAI_API_KEY=your_api_key
```

### 3. Run project

```bash
docker compose up --build
```

---

## Team Roles

- Project Manager
- Frontend Developer
- Backend Developer
- DevSecOps Engineer
- AI Engineer

---

## DevSecOps Responsibilities

- Docker containerization
- CI/CD pipeline
- Repository security
- Access control
- Environment configuration
- Deployment readiness

---

 
