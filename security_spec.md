# Clinical Security Specification (Aegis Bipolar Workspace)

## 1. Data Invariants
- **BipolarLog Integrity**: Every logged daily check-in must have a unique identifier, a valid clinical date string, and sleep records. A log cannot be saved without an authenticated user ID matching the active credentials.
- **SafetyPlan Immutability**: Rules and psychiatrists cannot be altered by anonymous non-owners.
- **Decoupled User Isolation**: Patient logs are completely HIPAA-aligned and isolated. No patient can read another patient's therapeutic notes or records.

## 2. The "Dirty Dozen" Vulnerability Payloads (Denial Gates)
1. **Unauthenticated Read Attempt**: Trying to query `logs` collection without an active login. (Result: `PERMISSION_DENIED`)
2. **Identity Spoofing on Create**: Creating a log containing `userId: "malicious_user"` while logged in as `legitimate_user`. (Result: `PERMISSION_DENIED`)
3. **Cross-Tenant List Scraping**: Attempting a list query on all users' medical logs without targeting one's own `userId`. (Result: `PERMISSION_DENIED`)
4. **Invalid Rating Bound**: Creating a log with a mood score of `11` or sleep duration of `-5` hours. (Result: `PERMISSION_DENIED`)
5. **Ghost Field Poisoning**: Injecting an un-blueprint-approved field (like `adminPrivileges: true`) into a `UserSettings` document. (Result: `PERMISSION_DENIED`)
6. **Immutable Field Edit**: Trying to change `userId` or `id` on an existing Bipolar Log. (Result: `PERMISSION_DENIED`)
7. **Malicious ID Poisoning**: Specifying an extremely long document ID string containing query injects to exhaust database resources. (Result: `PERMISSION_DENIED`)
8. **Stale Verification Spoof**: Authenticating with an email that is not verified (`email_verified: false`) when accessing records. (Result: `PERMISSION_DENIED`)
9. **State Shortcutting on Safety Plan**: Modifying safety contact numbers using someone else's credentials. (Result: `PERMISSION_DENIED`)
10. **System-Only Variable Mod**: Updating diagnostic prodromal state attributes directly from the client. (Result: `PERMISSION_DENIED`)
11. **Relational Sync Break**: Writing a subcollection item without verifying the core parent document exists. (Result: `PERMISSION_DENIED`)
12. **Blanket Query Scraping**: Demanding all logs with a generic unfiltered request. (Result: `PERMISSION_DENIED`)
