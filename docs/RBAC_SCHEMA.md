# RBAC Schema Documentation

This document describes the Role-Based Access Control (RBAC) database schema and provides example data flows.

## Schema Overview

The RBAC system consists of 6 core tables with the following relationships:

```
User
  └── UserRole (many-to-many)
        └── Role
              └── RolePermission (many-to-many)
                    └── Permission
                          ├── PermissionRoute (one-to-many)
                          └── RolePermission (many-to-many)

Authentication (one-to-one with User)
  └── User
```

## Tables

### 1. User

Stores user profile information.

| Column    | Type      | Constraints      |
| --------- | --------- | ---------------- |
| id        | serial    | PRIMARY KEY      |
| firstName | text      | NOT NULL         |
| lastName  | text      | NOT NULL         |
| email     | text      | NOT NULL, UNIQUE |
| enabled   | boolean   | DEFAULT true     |
| deleted   | boolean   | DEFAULT false    |
| createdAt | timestamp | DEFAULT NOW()    |
| updatedAt | timestamp | DEFAULT NOW()    |

**Relations:**

- `roles`: many(UserRole) - User can have multiple roles
- **Referenced by:** Authentication (one-to-one), UserRole (one-to-many)

### 2. Role

Defines role names and descriptions.

| Column      | Type      | Constraints      |
| ----------- | --------- | ---------------- |
| id          | serial    | PRIMARY KEY      |
| name        | text      | NOT NULL, UNIQUE |
| description | text      | optional         |
| createdAt   | timestamp | DEFAULT NOW()    |
| updatedAt   | timestamp | DEFAULT NOW()    |

**Relations:**

- `permissions`: many(RolePermission) - Role can have multiple permissions
- `users`: many(UserRole) - Role can be assigned to multiple users
- **Referenced by:** UserRole (one-to-many), RolePermission (one-to-many)

### 3. Permission

Defines granular permissions using resource-action model.

| Column      | Type      | Constraints      |
| ----------- | --------- | ---------------- |
| id          | serial    | PRIMARY KEY      |
| name        | text      | NOT NULL, UNIQUE |
| description | text      | optional         |
| resource    | text      | NOT NULL         |
| action      | text      | NOT NULL         |
| createdAt   | timestamp | DEFAULT NOW()    |
| updatedAt   | timestamp | DEFAULT NOW()    |

**Relations:**

- `roles`: many(RolePermission) - Permission can be assigned to multiple roles
- `routes`: many(PermissionRoute) - Permission can protect multiple routes
- **Referenced by:** RolePermission (one-to-many), PermissionRoute (one-to-many)

### 4. UserRole (Junction Table)

Establishes many-to-many relationship between users and roles.

| Column    | Type      | Constraints                             |
| --------- | --------- | --------------------------------------- |
| id        | serial    | PRIMARY KEY                             |
| userId    | integer   | NOT NULL, FK → User.id (cascade delete) |
| roleId    | integer   | NOT NULL, FK → Role.id (cascade delete) |
| createdAt | timestamp | DEFAULT NOW()                           |

**Relations:**

- `user`: one(User)
- `role`: one(Role)

### 5. RolePermission (Junction Table)

Establishes many-to-many relationship between roles and permissions.

| Column       | Type      | Constraints                                    |
| ------------ | --------- | ---------------------------------------------- |
| id           | serial    | PRIMARY KEY                                    |
| roleId       | integer   | NOT NULL, FK → Role.id (restrict delete)       |
| permissionId | integer   | NOT NULL, FK → Permission.id (restrict delete) |
| createdAt    | timestamp | DEFAULT NOW()                                  |

**Relations:**

- `role`: one(Role)
- `permission`: one(Permission)

### 6. PermissionRoute (Junction Table)

Binds permissions to specific routes (frontend or API).

| Column       | Type      | Constraints                                      |
| ------------ | --------- | ------------------------------------------------ |
| id           | serial    | PRIMARY KEY                                      |
| permissionId | integer   | NOT NULL, FK → Permission.id (restrict delete)   |
| route        | text      | NOT NULL                                         |
| routeType    | enum      | NOT NULL, DEFAULT 'frontend' ('api', 'frontend') |
| createdAt    | timestamp | DEFAULT NOW()                                    |

**Relations:**

- `permission`: one(Permission)

### 7. Authentication

Stores password hashes and login security information (one-to-one with User).

| Column                | Type      | Constraints                                     |
| --------------------- | --------- | ----------------------------------------------- |
| id                    | serial    | PRIMARY KEY                                     |
| userId                | integer   | NOT NULL, UNIQUE, FK → User.id (cascade delete) |
| passwordHash          | text      | NOT NULL (bcrypt hash)                          |
| lastPasswordChangedAt | timestamp | DEFAULT NOW()                                   |
| passwordExpiresAt     | timestamp | optional                                        |
| failedLoginAttempts   | integer   | DEFAULT 0                                       |
| lockedUntil           | timestamp | optional                                        |
| createdAt             | timestamp | DEFAULT NOW()                                   |
| updatedAt             | timestamp | DEFAULT NOW()                                   |

**Relations:**

- `user`: one(User)

## Example Data Flow

### Scenario: Admin User with Dashboard Access

#### User Table

```
id: 1
email: "john@example.com"
firstName: "John"
lastName: "Doe"
enabled: true
deleted: false
```

#### Authentication Table

```
id: 1
userId: 1
passwordHash: "$2b$12$..." (bcrypt hash)
failedLoginAttempts: 0
lockedUntil: null
```

#### Role Table

```
id: 1
name: "admin"
description: "Administrator with full access"

id: 2
name: "editor"
description: "Content editor"
```

#### Permission Table

```
id: 1
name: "create_post"
resource: "post"
action: "create"

id: 2
name: "delete_post"
resource: "post"
action: "delete"

id: 3
name: "view_dashboard"
resource: "dashboard"
action: "view"

id: 4
name: "manage_users"
resource: "user"
action: "manage"
```

#### UserRole Table

```
id: 1
userId: 1
roleId: 1  (admin role)

id: 2
userId: 1
roleId: 2  (editor role)
```

#### RolePermission Table

```
id: 1
roleId: 1  (admin)
permissionId: 1  (create_post)

id: 2
roleId: 1  (admin)
permissionId: 2  (delete_post)

id: 3
roleId: 1  (admin)
permissionId: 3  (view_dashboard)

id: 4
roleId: 1  (admin)
permissionId: 4  (manage_users)

id: 5
roleId: 2  (editor)
permissionId: 1  (create_post)

id: 6
roleId: 2  (editor)
permissionId: 3  (view_dashboard)
```

#### PermissionRoute Table

```
id: 1
permissionId: 3  (view_dashboard)
route: "/dashboard"
routeType: "frontend"

id: 2
permissionId: 3  (view_dashboard)
route: "GET /api/dashboard"
routeType: "api"

id: 3
permissionId: 4  (manage_users)
route: "/admin/users"
routeType: "frontend"

id: 4
permissionId: 4  (manage_users)
route: "POST /api/users"
routeType: "api"

id: 5
permissionId: 4  (manage_users)
route: "DELETE /api/users/:id"
routeType: "api"

id: 6
permissionId: 1  (create_post)
route: "POST /api/posts"
routeType: "api"
```

### Access Verification Flow

**Question:** Can John (userId: 1) access "/dashboard"?

**Resolution Path:**

1. Fetch user: `user.id = 1`
2. Get user's roles: `userRole.userId = 1` → roleIds: [1, 2]
3. Get roles' permissions: `rolePermission.roleId IN (1, 2)` → permissionIds: [1, 2, 3, 4]
4. Check if permission exists for route: `permissionRoute.route = "/dashboard"` → permissionId: 3
5. Check if permissionId 3 in user's permissions: **YES** ✓

**Answer:** John can access "/dashboard" because:

- John has admin role (and editor role)
- Admin role has "view_dashboard" permission
- "view_dashboard" permission protects "/dashboard" route

## Key Design Benefits

1. **Flexibility**: One permission can protect multiple routes
2. **Scalability**: Multiple users, roles, and permissions scale independently
3. **Maintainability**: Route changes don't require code modifications
4. **Security**: Brute force protection with lockout mechanism
5. **Auditability**: Timestamps on all creation events
6. **Data Integrity**: Cascade deletes for user/role cleanup, restrict deletes for permission changes

## Query Examples

### Get all permissions for a user

```sql
SELECT DISTINCT p.* FROM permission p
  JOIN role_permission rp ON p.id = rp.permission_id
  JOIN role r ON rp.role_id = r.id
  JOIN user_role ur ON r.id = ur.role_id
WHERE ur.user_id = 1;
```

### Get all routes protected by a permission

```sql
SELECT * FROM permission_route
WHERE permission_id = 3;
```

### Check if user can access a route

```sql
SELECT COUNT(*) FROM permission_route pr
  JOIN role_permission rp ON pr.permission_id = rp.permission_id
  JOIN role r ON rp.role_id = r.id
  JOIN user_role ur ON r.id = ur.role_id
WHERE ur.user_id = 1
  AND pr.route = '/dashboard'
  AND pr.route_type = 'frontend';
```
