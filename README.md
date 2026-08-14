# TaskForge Backend

TaskForge is a RESTful project-management backend built with Node.js, Express, PostgreSQL, and Prisma.

The project focuses on building a secure backend for teams to create workspaces, manage members and roles, invite users, create projects, manage tasks, and assign tasks to workspace members.

TaskForge V1 was built primarily to understand backend architecture, relational database design, authentication, authorization, and resource-level access control.

---

## 🚀 Features

### Authentication

- User registration
- User login
- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes

### Workspaces

- Create, view, update, and delete workspaces
- Workspace ownership
- Workspace membership
- Workspace roles: OWNER, ADMIN, MEMBER
- Member management
- Leave workspace

### Invitations

- Invite users to workspaces
- View pending invitations
- Accept invitations
- Reject invitations
- Invitation ownership verification

### Projects

- Create projects inside workspaces
- View workspace projects
- Update projects
- Delete projects
- Workspace membership authorization

### Tasks

- Create tasks inside projects
- View project tasks
- View individual tasks
- Update tasks
- Delete tasks
- Assign tasks to workspace members
- Unassign tasks

### Authorization

TaskForge does not rely only on authentication. Protected resources are checked against the user's relationship with the resource.

```text
JWT
 ↓
Authenticated User
 ↓
Workspace Membership
 ↓
Workspace
 ↓
Project
 ↓
Task
```

This prevents users from accessing resources simply by changing IDs in API requests.

### Error Handling

- Centralized Express error-handling middleware
- Common Prisma errors handled centrally
- Consistent API error responses
- Business-level errors handled within controllers

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| JWT | Authentication |
| bcrypt | Password hashing |
| Postman | API testing |
| Git / GitHub | Version control |

---

## 🏗️ Architecture

The core database relationships are:

```text
User
 │
 ├── WorkspaceMembership ── Workspace
 │                              │
 │                              └── Project
 │                                   │
 │                                   └── Task ── Assignee → User
 │
 └── WorkspaceInvitation
```

### Main relationship structure

```text
User
  ↓
WorkspaceMember
  ↓
Workspace
  ↓
Project
  ↓
Task
  ↓
User (Assignee)
```

A workspace can have many members.

A user can belong to multiple workspaces.

A workspace can contain multiple projects.

A project can contain multiple tasks.

A task can optionally be assigned to a workspace member.

---

## 🔐 Authentication & Authorization

Authentication is handled using JWT.

After login, the client receives a JWT containing the authenticated user's identity.

Protected requests provide the JWT using:

```http
Authorization: Bearer <token>
```

The authentication middleware verifies the token and makes the authenticated user's ID available to controllers.

Authorization is then performed separately.

For example, when accessing a task:

```text
User
 ↓
Is authenticated?
 ↓
Does the user belong to the task's workspace?
 ↓
Allow / Deny
```

This distinction is important:

> Authentication answers **"Who are you?"**

> Authorization answers **"Are you allowed to do this?"**

---

## 👥 Workspace Roles

Workspace members have one of three roles:

```text
OWNER
ADMIN
MEMBER
```

The roles are used to enforce workspace-level business rules.

For example:

- Only the owner can delete the workspace.
- The owner cannot be removed through the member-removal endpoint.
- Members cannot arbitrarily manage other members.
- Invitation and membership operations verify the user's permissions.

---

## ✉️ Workspace Invitations

Invitations are represented using a dedicated `WorkspaceInvitation` model.

The invitation lifecycle is:

```text
PENDING
   │
   ├── ACCEPT → Workspace membership created
   │
   └── REJECT → Invitation rejected
```

An invitation contains information about:

- Workspace
- Invited user
- Inviting user
- Status
- Creation time

When accepting or rejecting an invitation, the backend verifies that the authenticated user is actually the user who received that invitation.

---

## 📋 Project & Task Structure

Projects belong to workspaces:

```text
Workspace
   │
   └── Project
          │
          └── Task
```

Tasks belong to projects and can optionally be assigned to users:

```text
Task
 ├── Project
 └── Assignee → User
```

This allows a task to exist independently of its assignee while still belonging to a specific project.

A task can therefore be:

```text
Unassigned
```

or:

```text
Assigned → Workspace Member
```

---

## 🗄️ Database

TaskForge uses **PostgreSQL** as its relational database and **Prisma ORM** for database access.

Database schema changes are managed through Prisma migrations.

The repository includes the migration history used to build the current database structure.

---

## 📁 Project Structure

```text
TaskForge-Backend/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── prisma.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── health.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   └── workspace.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── index.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   └── workspace.routes.js
│   │
│   └── validations/
│       └── auth.validation.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
├── server.js
└── README.md
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/semester003/TaskForge-Backend.git
cd TaskForge-Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file using `.env.example` as a reference.

Example:

```env
PORT=5000
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secret-key"
```

Do not commit the `.env` file.

### 4. Set up the database

Make sure PostgreSQL is running and the database connection string is configured correctly.

Then run:

```bash
npx prisma migrate dev
```

### 5. Start the server

```bash
npm run dev
```

---

## 🔗 API Structure

The API uses the following base path:

```text
/api/v1
```

Major API groups include:

```text
/api/v1/auth
/api/v1/workspaces
/api/v1/projects
/api/v1/tasks
```

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

---

## 🧪 API Testing

The API was manually tested using Postman.

Testing included:

- Authentication flows
- Protected routes
- Workspace authorization
- Role-based workspace operations
- Invitation ownership
- Project access
- Task access
- Task assignment
- Unauthorized resource access
- Non-member access attempts
- Invalid resource IDs
- Error responses

Authorization testing specifically verified that changing resource IDs in requests does not bypass backend authorization.

---

## 🔒 Security Considerations

TaskForge includes:

- Password hashing
- JWT authentication
- Protected routes
- Workspace-level authorization
- Membership verification
- Role-based access control
- Invitation ownership verification
- Task-assignee membership verification
- Centralized error handling
- Environment-based secrets

Sensitive configuration such as database credentials and JWT secrets is stored in `.env` and excluded from version control.

---

## 📄 License

This project is intended as a personal learning and portfolio project.
