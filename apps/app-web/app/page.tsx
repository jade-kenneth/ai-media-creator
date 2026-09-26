import { redirect } from 'next/navigation';

/** `/` resumes at Projects; the guarded app layout sends signed-out visitors to sign-in. */
export default function HomePage() {
  redirect('/projects');
}
