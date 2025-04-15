import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/exercises');
  return null; // Możesz również wyświetlić jakąś zawartość, ale nie będzie widoczna, ponieważ nastąpi przekierowanie.
}