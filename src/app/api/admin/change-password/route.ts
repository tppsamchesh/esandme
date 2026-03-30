import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "esandme_admin";

function teamQuery(): string {
  const tid = process.env.VERCEL_TEAM_ID?.trim();
  return tid ? `?teamId=${encodeURIComponent(tid)}` : "";
}

export async function POST(request: Request) {
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !projectId) {
    return NextResponse.json(
      {
        error:
          "Vercel is not configured. Set VERCEL_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID if applicable).",
      },
      { status: 503 }
    );
  }

  let body: { password?: string; confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = body.password?.trim() ?? "";
  const confirm = body.confirm?.trim() ?? "";
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (password !== confirm) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 }
    );
  }

  const tq = teamQuery();
  const auth = { Authorization: `Bearer ${token}` };

  try {
    const listRes = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/env${tq}`,
      { headers: auth, cache: "no-store" }
    );
    const listJson = (await listRes.json()) as {
      envs?: Array<{
        id?: string;
        key?: string;
        type?: string;
        target?: string[] | string;
      }>;
    };

    if (!listRes.ok) {
      return NextResponse.json(
        {
          error:
            (listJson as { error?: { message?: string } }).error?.message ??
            `Failed to list env vars (${listRes.status})`,
        },
        { status: 502 }
      );
    }

    const envs = listJson.envs ?? [];
    const seenIds = new Set<string>();
    const matches: typeof envs = [];
    for (const e of envs) {
      if (e.key === "ADMIN_PASSWORD" && e.id && !seenIds.has(e.id)) {
        seenIds.add(e.id);
        matches.push(e);
      }
    }

    if (matches.length > 0) {
      for (const env of matches) {
        const envId = env.id!;
        const target = Array.isArray(env.target)
          ? env.target
          : env.target
            ? [env.target]
            : ["production", "preview", "development"];
        const patchRes = await fetch(
          `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(envId)}${tq}`,
          {
            method: "PATCH",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({
              key: "ADMIN_PASSWORD",
              value: password,
              type: env.type === "sensitive" ? "sensitive" : "encrypted",
              target,
            }),
          }
        );
        if (!patchRes.ok) {
          const err = await patchRes.json().catch(() => ({}));
          return NextResponse.json(
            {
              error:
                (err as { error?: { message?: string } }).error?.message ??
                `Vercel PATCH failed (${patchRes.status})`,
            },
            { status: 502 }
          );
        }
      }
    } else {
      const createRes = await fetch(
        `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/env${tq}`,
        {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "ADMIN_PASSWORD",
            value: password,
            type: "encrypted",
            target: ["development", "preview", "production"],
          }),
        }
      );
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            error:
              (err as { error?: { message?: string } }).error?.message ??
              `Vercel create env failed (${createRes.status})`,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        "ADMIN_PASSWORD updated in Vercel. Redeploy or wait for the next deployment for runtime to pick up the new value.",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
