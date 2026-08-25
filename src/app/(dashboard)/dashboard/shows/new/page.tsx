import { redirect } from 'next/navigation';

export default function NewShowRedirectPage() {
  redirect('/dashboard/shows');
}
