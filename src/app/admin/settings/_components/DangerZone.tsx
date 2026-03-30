import { logoutAdmin } from "@/app/admin/settings/actions";

export function DangerZone() {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50/50 p-6">
      <h2 className="font-heading text-xl text-red-900">Danger zone</h2>
      <p className="mt-1 text-sm text-red-900/80">
        Sign out of the admin panel on this browser by clearing the admin
        session cookie.
      </p>
      <form action={logoutAdmin} className="mt-6">
        <button
          type="submit"
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
        >
          Clear all sessions
        </button>
      </form>
    </section>
  );
}
