# Assignments REST API Specification

Базовый URL: `http://localhost:3000/api`

---

## 1. Аутентификация (`/auth`)

### 1.1 Регистрация пользователя
* **URL:** `POST /auth/register`
* **Заголовки:** `Content-Type: application/json`
* **Тело запроса (JSON):**
  ```json
  {
    "email": "teacher@test.com",
    "password": "Password123!",
    "role": "moderator"
  }