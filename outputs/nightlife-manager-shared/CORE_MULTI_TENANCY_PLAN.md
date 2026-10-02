# Implementation Plan - Core Multi-tenancy

> [!NOTE]
> **STATO: COMPLETATO** (Step 1-10). Multi-tenancy, isolamento per `organizationId`,
> onboarding, migrazione dati legacy e security rules sono implementati e in produzione.
> Questo documento è conservato come storico del piano originale.

## Goal Description
Transform the application into a multi-tenant system where data is isolated by "Organization" (e.g., each Nightclub). This phase focuses on the **Core Architecture** changes required to support data isolation, without implementing payment gateways yet.

**Key Objective:** Ensure that User A from Organization X cannot see or modify data belonging to Organization Y.

## User Review Required
> [!IMPORTANT]
> **Data Migration Strategy**: We will create a "Default Organization" for current data. A migration script will run once to assign all existing Events, PRs, Guests, and Tables to this default organization.
>
> **Breaking Change**: The `firestore.rules` will be updated to STRICTLY require `organizationId` on all reads/writes. The app may be temporarily unstable during the migration deployment until the migration script completes.

## Proposed Changes

### 1. Data Models (`types.ts`)
Introduce `Organization` and update existing entities.

#### [MODIFY] [types.ts](file:///Users/edoardougolotti/Desktop/nightlife-manager/types.ts)
*   Add `interface Organization { id, name, ownerId, createdAt, ... }`
*   Add `organizationId` to `UserProfile`.
*   Add `organizationId` to `Event`, `GuestList`, `Guest`, `Table`, `PR`.

### 2. Authentication & Context
Update `AuthContext` to manage the user's current organization.

#### [MODIFY] [AuthContext.tsx](file:///Users/edoardougolotti/Desktop/nightlife-manager/contexts/AuthContext.tsx)
*   Fetch `Organization` details upon login.
*   If user has no `organizationId`, prompt to create one (Onboarding flow) or assign to default (for legacy support).
*   Expose `currentOrganization` in context.

### 3. Service Layer Refactoring
Update all Firestore interactions to include `organizationId`.

#### [MODIFY] [firestoreService.ts](file:///Users/edoardougolotti/Desktop/nightlife-manager/services/firestoreService.ts)
*   **Reads**: All `get` functions (e.g., `getEvents`) must append `.where('organizationId', '==', currentOrgId)`.
*   **Writes**: All `add`/`set` functions must automatically inject `organizationId`.
*   **Migration Function**: specific function `migrateLegacyData(user)` to run once -> creates Org and updates all docs owned by user.

### 4. Security Rules
Enforce isolation at the database level.

#### [MODIFY] [firestore.rules](file:///Users/edoardougolotti/Desktop/nightlife-manager/firestore.rules)
*   Create function `isSignedInToOrg(orgId)` checking `request.auth.token.organizationId` (or looking up user profile).
*   Apply checks to all collections: `allow read, write: if isSignedInToOrg(resource.data.organizationId);`

### 5. UI Updates
*   **Onboarding**: Simple "Create Organization" modal if user has no org.
*   **Settings**: View current Organization details.

## Verification Plan

### Automated Tests
*   We don't have a test suite, so manual verification is key.

### Manual Verification
1.  **Migration Test**: Login with existing admin. Confirm all invalid data disappears or app shows "Migrating...". Run migration. Confirm data reappears.
2.  **Isolation Test**:
    *   Create `User A` -> `Org A` -> Create Event A.
    *   Create `User B` -> `Org B`.
    *   Verify `User B` sees EMPTY dashboard (cannot see Event A).
3.  **Role Test**: Verify PR/Door login still works within their assigned Organization.
