# Task: Guided Mobile Onboarding And Auth Implementation

## Objective

Implement a guided mobile onboarding, organization selection, login, and member registration flow based on `apps/org-system-mobile/onboarding.html`.

The implementation must use the existing production auth, tenant, organization, and registration APIs. It should not introduce a separate auth backend flow. The new UI should use the `assets/onboarding_*.jpeg` avatar images, preserve the prototype's guided step-by-step experience, and keep existing Expo Router auth routes working.

## Success Criteria

- First unauthenticated app launch opens the guided onboarding flow.
- Users can select a organization before login or registration.
- Existing `/(auth)/login`, `/(auth)/register`, `/(auth)/organization-picker`, and `/(auth)/registration-pending` routes still work.
- Login uses the existing login mutation and routes authenticated members to `/(main)/(tabs)`.
- Registration uses the existing member registration mutation and shows a submitted/review state after success.
- The flow is usable on small Android screens and iOS screens with safe areas.
- `npx nx run org-system-mobile:typecheck` and `npx nx run org-system-mobile:lint` complete without new errors.

## 1. Confirm Existing Contracts

- Read `apps/org-system-mobile/onboarding.html` and list every prototype step, title, guide message, layout style, and action.
- Read current route entry files in `apps/org-system-mobile/app/(auth)/`.
- Read current auth feature files in `apps/org-system-mobile/features/auth/`.
- Confirm these existing APIs will be reused:
  - `useOrganizationsQuery`
  - `useLoginMutation`
  - `useRegisterMemberMutation`
  - `useTenant`
  - `RegistrationStatusModal`
- Confirm registration requires these fields:
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

## 2. Define The Guided Flow Model

- Create a single `OnboardingStep` union with these steps:
  - `welcome`
  - `organization`
  - `choice`
  - `login`
  - `register-name`
  - `register-contact`
  - `register-member-details`
  - `register-security`
  - `submitted`
- Store the active step in local screen state.
- Store a step history stack for back navigation.
- Hide or disable back navigation on `welcome` and `submitted`.
- If a user deep-links directly to `login` or `register` without a selected tenant, send them to `organization` first.
- After organization selection, continue to the intended next step:
  - default onboarding goes to `choice`
  - login route goes to `login`
  - register route goes to `register-name`

## 3. Build Shared Onboarding UI

- Add reusable components under `features/auth/components/`.
- Build `OnboardingShell`:
  - uses `SafeAreaView`
  - uses a scrollable layout for small screens
  - includes a top back button slot
  - renders large blue step title text
  - includes a light blue/white background treatment inspired by the prototype
  - keeps bottom content clear of Android navigation and iOS home indicator areas
- Build `GuideBubble`:
  - accepts `message`, `avatarSource`, and `layout`
  - supports `hero`, `standard`, and `compact`
  - places avatar and speech bubble according to the prototype flow
  - uses `expo-image` or React Native image rendering with `contain`
- Build `OnboardingProgress`:
  - displays four registration progress dots
  - fills dots through the current registration step
- Reuse the existing shared `Button`, `FormInput`, `PasswordInput`, `SelectField`, and `DatePickerField` components where possible.

## 4. Add Avatar Asset Mapping

- Create a local avatar map in the guided onboarding screen.
- Use these files:
  - `assets/onboarding_1.jpeg`
  - `assets/onboarding_2.jpeg`
  - `assets/onboarding_3.jpeg`
  - `assets/onboarding_4.jpeg`
  - `assets/onboarding_5.jpeg`
  - `assets/onboarding_6.jpeg`
- Map image usage by step:
  - `welcome`: full-body pointing avatar
  - `organization`: pointing avatar
  - `choice`: pointing avatar
  - `login`: compact pointing avatar
  - `register-name`: full or standard avatar
  - `register-contact`: full or standard avatar
  - `register-member-details`: compact confident avatar
  - `register-security`: compact confident avatar
  - `submitted`: thumbs-up avatar
- Ensure each image has stable width and height so the layout does not jump between steps.

## 5. Implement `GuidedOnboardingScreen`

- Create `features/auth/guided-onboarding-screen.tsx`.
- Accept an optional `initialStep` prop.
- Define all step copy in one local constant:
  - title
  - guide message
  - avatar
  - guide layout
- Render each step inside `OnboardingShell`.
- Render the matching `GuideBubble` for every step.
- Keep route entry files thin; do not move route logic into `app/`.

## 6. Implement Welcome Step

- Render title `Hello, Ka-Organization!`.
- Render the prototype welcome guide message.
- Add a primary `Next` action.
- On `Next`, move to `organization`.
- Do not require network or auth state on this step.

## 7. Implement Organization Selection Step

- Use `useOrganizationsQuery({ filter: { isActive: true } })`.
- Show a search input.
- Filter organizations by name on the client.
- Show selectable organization rows with selected state.
- Preselect the saved tenant when available.
- On `Proceed`, persist selected organization through `setTenant`.
- Show these states:
  - loading organizations
  - query error with retry
  - empty search result
  - disabled proceed button until a organization is selected

## 8. Implement Login/Register Choice Step

- Render title `Let's Get You In`.
- Render guide message explaining login versus account creation.
- Primary button opens `login`.
- Outline button opens `register-name`.
- Keep this step purely local; no API call is needed.

## 9. Implement Login Step

- Use React Hook Form with a Zod schema.
- Validate:
  - email must be a valid email
  - password must be at least 8 characters
- Submit through `useLoginMutation`.
- Pass the selected tenant's `organizationSlug` into the login mutation.
- On success, route to `/(main)/(tabs)`.
- Preserve existing error behavior:
  - show pending registration modal for `RegistrationPendingError`
  - show rejected registration modal for `RegistrationRejectedError`
  - show not-affiliated message for `NotAffiliatedMemberError`
  - show generic GraphQL error text for other failures
- Add a `Forgot Password?` action only as a placeholder if no backend reset flow exists.
- Add footer action to move to `register-name`.

## 10. Implement Registration Name Step

- Fields:
  - first name
  - last name
  - optional middle name
- Validate only the fields for this step before continuing.
- On valid input, move to `register-contact`.
- Show progress dot 1 of 4.

## 11. Implement Registration Contact Step

- Fields:
  - email
  - contact number
- Validate only the fields for this step before continuing.
- On valid input, move to `register-member-details`.
- Show progress dot 2 of 4.

## 12. Implement Registration Member Details Step

- Fields:
  - birthdate
  - optional gender
  - address
  - optional purok / zone
- Use `DatePickerField` for birthdate.
- Use `SelectField` for gender.
- Validate required fields before continuing.
- Prevent future birthdates through existing validation.
- On valid input, move to `register-security`.
- Show progress dot 3 of 4.

## 13. Implement Registration Security Step

- Fields:
  - password
  - confirm password
- Show password strength hint based on minimum length.
- Show password match hint.
- Submit the full registration form through `useRegisterMemberMutation`.
- Include `tenant.organizationSlug` in the mutation input.
- Convert birthdate with `formatISO`.
- On success, move to `submitted`.
- On mutation error, render inline GraphQL error text and keep the user on this step.
- Show progress dot 4 of 4.

## 14. Implement Submitted Step

- Render title `Registration Sent`.
- Render guide message explaining admin review.
- Render a success check visual.
- Add a `Back to Login` action.
- On `Back to Login`, clear local history and move to `login`.
- Do not auto-authenticate after registration because accounts require organization admin review.

## 15. Wire Auth Routes

- Add `app/(auth)/onboarding.tsx` and render `GuidedOnboardingScreen`.
- Update `app/(auth)/_layout.tsx` to include the `onboarding` stack screen.
- Update `app/_layout.tsx` so unauthenticated users route to `/(auth)/onboarding`.
- Update compatibility route files:
  - `organization-picker` renders `GuidedOnboardingScreen initialStep="organization"`
  - `login` renders `GuidedOnboardingScreen initialStep="login"`
  - `register` renders `GuidedOnboardingScreen initialStep="register-name"`
  - `registration-pending` renders `GuidedOnboardingScreen initialStep="submitted"`

## 16. Accessibility And Interaction Polish

- Add accessibility labels to:
  - back button
  - search input
  - organization rows
  - primary and secondary actions
  - form fields
- Preserve readable contrast using existing `theme/colors.ts`.
- Ensure all form errors use selectable text where useful.
- Ensure Android ripple or press opacity feedback exists for tappable rows/buttons.
- Ensure layout remains scrollable when the keyboard is open.
- Confirm no button text wraps awkwardly on narrow screens.

## 17. Verification

- Run:
  - `npx nx run org-system-mobile:typecheck`
  - `npx nx run org-system-mobile:lint`
- Run targeted lint on newly added files if needed.
- Manually verify:
  - unauthenticated launch opens onboarding
  - welcome goes to organization selection
  - organization query loading/error/empty states work
  - selected organization persists
  - choice opens login and registration
  - login succeeds and routes to main tabs
  - login error states render correctly
  - registration validates each step before continuing
  - registration submits the expected full payload
  - submitted screen appears after registration
  - back navigation follows the step history
  - Android keyboard does not cover password fields
  - small-screen layout remains usable

## 18. Cleanup And Follow-Up

- Decide whether old standalone auth screens should remain as fallback components or be removed later.
- If old screens remain, ensure no route still points to them unintentionally.
- Consider adding a future password reset route when backend support exists.
- Consider replacing JPEG white backgrounds with transparent PNG/WebP variants if the visual edges become distracting.
