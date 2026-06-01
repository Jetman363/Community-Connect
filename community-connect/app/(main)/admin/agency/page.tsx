import { redirect } from "next/navigation";

/** Agency configuration UI — redirects to integration connectors for now. */
export default function AdminAgencyPage() {
  redirect("/admin/integrations");
}
