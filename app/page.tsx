import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect base path directly to the vendor login page
  redirect('/login')
}
