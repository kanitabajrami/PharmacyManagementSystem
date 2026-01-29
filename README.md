# Pharmacy Management System

The Pharmacy Management System is a full-stack web application built using ASP.NET Core Web API and a RESTful layered architecture. The backend separates controllers, services, repositories, DTOs, and data models to ensure clean structure and maintainability.

Entity Framework Core is used for database access and migrations, while JWT-based authentication secures API endpoints. The system exposes JSON APIs consumed by the frontend and is backed by a relational database to ensure data integrity and consistency.

## Features

- User registration with admin-assigned roles  
- Role-based authentication and authorization (JWT)  
- Admin dashboard for user and role management  
- Pharmacist dashboard for operational tasks  
- Medicine, inventory, and prescription management  
- RESTful ASP.NET Core Web API with EF Core

## Tech Stack

**Frontend:** React (Vite), Axios, Fetch API, Tailwind CSS  
**Backend:** ASP.NET Core Web API, Entity Framework Core, ASP.NET Identity, JWT  
**Database:** PostgreSQL  
**Tools:** Swagger, Git, GitHub  
**Deployment:** Azure


## Installation

### Prerequisites
Make sure you have the following installed:
- Node.js (v18 or later)
- .NET SDK 7.0 or later
- PostgreSQL
- Git

---

### 1. Clone the repository
```bash
git clone https://github.com/kanitabajrami/PharmacyManagementSystem.git
cd PharmacyManagementSystem
```

### 2. Backend Setup (ASP.NET Core Web API)
1. Navigate to the backend folder:
```bash
cd backend
```
2. Update the PostgreSQL connection string in ```appsettings.json```

3. Apply database migrations:
```bash
dotnet ef database update
```
4. Run the backend:
```bash
dotnet run
```
The API will be available at: 
```bash 
https://localhost:7201
```

Swagger UI for testing:  
```bash
https://localhost:7201/swagger
```

---

### 3. Frontend Setup (React + Vite)
1. Navigate to the frontend folder.
```bash
cd frontend
```
2. Install dependencies.
```bash 
npm install
```
3. Run the frontend.
```bash
npm run dev
```

The frontend will run at:  
```
http://localhost:5173
```


## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file (or configure them in `appsettings.json` for the backend):

### Backend (ASP.NET Core Web API)

- `ConnectionStrings__DefaultConnection` — your PostgreSQL connection string, for example:`Host=localhost;Database=PharmacyDB;Username=postgres Password=yourpassword`
- `JWT_Secret` — secret key used to sign JSON Web Tokens for authentication
- `JWT_Expiration` — token expiration time in minutes (e.g., 60)
- `ASPNETCORE_ENVIRONMENT` — set to Development or Production

### Frontend (React + Vite)
- `VITE_API_URL` — URL of the backend API, for example: `https://localhost:7201`

### Example `.env` file
```
ConnectionStrings__DefaultConnection=Host=localhost;Database=PharmacyManagementDB;Username=postgres;Password=YourDBPassword
JWT_Secret=MyVerySecretKey123
JWT_Expiration=60
ASPNETCORE_ENVIRONMENT=Development
VITE_API_URL=https://localhost:7201
```



## API Reference

All endpoints require a **JWT token** in the `Authorization` header except for **User Registration.**

### Users

#### Register (Public)

```http
    POST /api/auth/register
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required**. Username of the new user |
| `password` | `string`| **Required**. Password for the account
| `email` | `string`| **Required**. Email for the account

#### Get all users (Admin only)

```http
  GET /api/users
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `Authorization`      | `string` | **Required**. JWT token with admin role |

#### Assign role (Admin only)

```http
    PUT /api/users/{id}/role
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Id of the user |
| `role` | `string`| **Required**. Role to assign (Admin/User)|
| `Authorization` | `string`| **Required**. JWT token with admin role|


### Medicines

#### Get all medicines


```http
    GET /api/Medicines
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `Authorization` | `string`| **Required**. JWT token |

#### Get medicine by ID


```http
    GET /api/Medicines/{id}
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `int` | **Required**. Medicine ID |
| `Authorization` | `string` | **Required**. JWT token |

#### Create medicine (Admin only)

```http
    POST /api/medicines
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `name` | `string` | Medicine name |
| `price` | `int` | Medicine price |
| `quantity` | `int` | Stock quantity |
| `supplierid` | `int` | Supplier ID |
| `Authorization` | `string` | **Required**. JWT token |

#### Additional medicine endpoints
```http
    GET /api/medicines/search?name=&category=
    GET /api/medicines/low-stock?threshold=10
    GET /api/medicines/expiring-soon?days=30
```


### Prescriptions   

#### Get all prescriptions

```http
    GET /api/prescription
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `Authorization` | `string`| **Required**. JWT token |

#### Get prescription by ID

```http
    GET /api/Prescription/{id}
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `int` | **Required**. Prescription ID |
| `Authorization` | `string` | **Required**. JWT token |


## Screenshots

![Login page](/assets/screenshots/login.png)

![Admin dashboard](/assets/screenshots/admin.png)

![User dashboar](/assets/screenshots/user.png)





