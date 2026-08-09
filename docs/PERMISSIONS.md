# Roles and permissions (future policy/schema baseline)

The six-role matrix below documents the future policy/schema baseline. The connected pilot exercises only the student experience; staff, mentor, club, department-admin, and super-admin workspace responsibilities are not completed pilot UI. A user may have more than one role; effective access is the union of permitted actions, constrained by department, course membership, and ownership. Role assignment must be server-side and auditable.

| Role | MVP responsibilities |
| --- | --- |
| `student` | Read enrolled courses and lessons; submit assignments; view own published attendance summaries, progress, achievements, calendar, notifications, and local QR receipts. Quizzes, downloads, and social interaction are deferred. |
| `faculty` | Future scoped workspace: manage owned courses/lessons, assignments, grading, and attendance corrections. Not part of the connected student pilot. |
| `mentor` | Future scoped workspace: view assigned mentees and permitted progress/attendance. Not part of the connected student pilot. |
| `club_coordinator` | Future baseline: manage an assigned club's posts and events; moderate only that club's feed scope; cannot access academic records without another role. |
| `department_admin` | Future baseline: manage department courses, faculty assignments, calendar events, and department-level reports; cannot change global roles or read unrelated departments. |
| `super_admin` | Future baseline: manage institution-wide configuration, role assignments, integrations, moderation, and audit access. Use sparingly and log every privileged action. |

## Authorization rules

Enforce these rules in Supabase RLS and server-side mutation paths. UI checks are convenience only:

1. A student can read only their profile, memberships, submissions, attempts, attendance, and progress.
2. Faculty access follows an explicit course ownership or teaching assignment; do not infer access from email domains.
3. Mentors require an explicit active mentor-to-student assignment.
4. Club coordinators are scoped to a club ID and never receive department-wide access implicitly.
5. Department admins are scoped to one or more department IDs.
6. Only super admins can assign or revoke roles and change integration configuration.
7. A role change takes effect from the database transaction and is recorded in an audit table.
8. Deletes should be soft deletes or state transitions for academic records, submissions, attendance, and audit data.
9. Authentication is limited to `@sairamtap.edu.in`; Google OAuth metadata never assigns a LearnFlow role.
10. All authenticated users may read institution-wide academic calendar events, while only scoped staff policies may create or change them.

The client capability map and database policies define the future role baseline. The UI never substitutes for RLS; validate policies against live authenticated users after deploying the current migrations. Remote push, EDUMATE, NFC/BLE, kiosk, and automated attendance integrations remain deferred; the native QR bridge requires explicit Confirm attendance.
