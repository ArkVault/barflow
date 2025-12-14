import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to login page - this is the entry point for production
  redirect("/auth/login");
}
