# Task: Mobile Onboarding/Login Revamp

## Objective

Update the mobile app onboarding, login, organization selection, and member registration experience to follow `apps/org-system-mobile/onboarding.html`, while keeping the production auth, tenant, and registration behavior already wired in the app.

## 1. Audit Existing Flow

- Review `apps/org-system-mobile/onboarding.html` and map each prototype screen to React Native states.
- Review current auth files:
  - `features/auth/organization-picker-screen.tsx`
  - `features/auth/login-screen.tsx`
  - `features/auth/register-screen.tsx`
  - `features/auth/registration-pending-screen.tsx`
- Confirm existing backend-required registration fields:
  - first name
  - last name
  - birthdate
  - email
  - contact number
  - address
  - password
  - confirm password
  - optional middle name
  - optional gender
  - optional purok

## 2. Define Onboarding Flow

- Create a single flow state model with these steps:
  - `welcome`
  - `organization`
  - `choice`
  - `login`
  - `register-name`
  - `register-contact`
  - `register-member-details`
  - `register-security`
  - `submitted`
- Preserve back navigation using an internal step history stack.
- Disable back navigation on `welcome` and `submitted`.
- If a tenant already exists, preselect it on the organization step.
- On successful login, route to `/(main)/(tabs)`.
- On successful registration, route to the submitted step instead of immediately leaving the flow.

## 3. Add Shared Onboarding Components

- Add reusable auth/onboarding components under `features/auth/components/`.
- Build an `OnboardingShell` component with:
  - safe-area handling
  - blue/white prototype background
  - bottom city/soft shape treatment
  - title area
  - back button
  - scroll/keyboard-safe content
- Build a `GuideBubble` component with:
  - guide image
  - speech bubble
  - layout variants: `hero`, `standard`, `compact`
- Build shared progress dots for registration steps.
- Build primary and outline action buttons matching the prototype.

## 4. Use Avatar Images

- Create a local avatar asset map using:
  - `assets/onboarding_1.jpeg`
  - `assets/onboarding_2.jpeg`
  - `assets/onboarding_3.jpeg`
  - `assets/onboarding_4.jpeg`
  - `assets/onboarding_5.jpeg`
  - `assets/onboarding_6.jpeg`
- Map images by intent:
  - welcome/hero: full-body pointing avatar
  - organization/choice/name/contact: pointing avatar
  - login/security: compact avatar
  - submitted: thumbs-up avatar
- Render images with React Native `Image` or `expo-image`.
- Use `resizeMode="contain"` and fixed responsive containers so the JPEG white background does not break layout.

## 5. Implement Guided Organization Selection

- Reuse `useOrganizationsQuery({ filter: { isActive: true } })`.
- Replace the standalone list-first layout with the onboarding guide layout.
- Provide search/filter for organizations.
- Let users select one organization and press `Proceed`.
- Save selected organization with `setTenant`.
- Show loading, error, empty, and retry states.

## 6. Implement Guided Choice Screen

- Show the prototype copy:
  - title: `Let’s Get You In`
  - message: `Already have an account? Log in. New here? Create an account to continue.`
- Primary action goes to login.
- Outline action goes to registration name step.

## 7. Implement Guided Login

- Reuse `useLoginMutation`.
- Keep validation with email and password.
- Use current tenant slug in login input.
- Keep existing error handling:
  - pending registration modal/state
  - rejected registration modal/state
  - not affiliated member error
  - generic GraphQL error
- Add a `Forgot Password?` placeholder only if no backend flow exists; it should be visually present but not promise unavailable behavior.
- Add a footer link to registration.

## 8. Implement Guided Registration

- Split registration into steps:
  - Name: first name, last name, optional middle name
  - Contact: email, contact number
  - Member details: birthdate, gender, address, optional purok
  - Security: password, confirm password, strength/match hints
- Reuse `useRegisterMemberMutation`.
- Keep the existing Zod validation rules.
- Only submit to the backend on the security step.
- On success, show the guided submitted screen.
- On error, show inline GraphQL error text and keep the user on the current step.

## 9. Update Routes

- Add `app/(auth)/onboarding.tsx` that renders the new guided screen from the welcome step.
- Update unauthenticated bootstrap in `app/_layout.tsx` to route to `/(auth)/onboarding`.
- Keep compatibility routes:
  - `organization-picker` starts the guided screen at `organization`
  - `login` starts at `login`
  - `register` starts at `register-name`
  - `registration-pending` starts at `submitted`
- Ensure route files stay thin and only compose feature screens.

## 10. Accessibility And Mobile Polish

- Add accessibility labels for:
  - back button
  - primary actions
  - organization search
  - organization rows
  - form fields
- Preserve readable contrast with existing `theme/colors.ts`.
- Account for top and bottom safe areas.
- Ensure keyboard avoidance works on login and registration steps.
- Use platform-appropriate press feedback.
- Avoid fixed-height layouts that break on small Android screens.

## 11. Testing

- Run mobile typecheck through Nx:
  - `npx nx run org-system-mobile:typecheck`
- Run mobile lint through Nx:
  - `npx nx run org-system-mobile:lint`
- Manually verify:
  - first app launch routes to onboarding
  - welcome advances to organization
  - organization list loads and saves selected tenant
  - choice opens login and registration
  - login succeeds and routes to main tabs
  - login errors render correctly
  - registration blocks invalid fields per step
  - registration submits and shows submitted state
  - submitted button returns to login
  - Android keyboard does not cover password fields
  - small-screen layout remains scrollable
