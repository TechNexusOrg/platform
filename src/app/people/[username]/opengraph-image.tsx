import { ImageResponse } from "next/og";
import { getContributorPassport } from "@/lib/passport";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getContributorPassport(username);

  const isFound = !("notFound" in data) && !("isPrivate" in data);
  const user = isFound ? data.user : null;
  const stats = isFound ? data.statistics : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#090d16",
          padding: "60px",
          fontFamily: "monospace",
          border: "2px solid #1e293b",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "rgba(2, 132, 199, 0.2)",
                border: "2px solid #0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              TN
            </div>
            <div style={{ color: "#ffffff", fontSize: "28px", fontWeight: "bold" }}>
              TechNexus<span style={{ color: "#38bdf8" }}>Org</span>
            </div>
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "20px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10b981",
              color: "#34d399",
              fontSize: "18px",
            }}
          >
            Verified Contributor Passport
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "30px", marginTop: "20px" }}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "24px",
                border: "3px solid #334155",
              }}
            />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "24px",
                backgroundColor: "#1e293b",
                border: "3px solid #334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: "48px",
              }}
            >
              {username[0]?.toUpperCase()}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ color: "#ffffff", fontSize: "42px", fontWeight: "bold" }}>
              {user?.displayName || `@${username}`}
            </div>
            <div style={{ color: "#38bdf8", fontSize: "24px" }}>
              @{username} • Level: {user ? user.level.replace("_", " ").toUpperCase() : "EXPLORER"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "#0f172a",
            padding: "24px 36px",
            borderRadius: "16px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "#ffffff", fontSize: "36px", fontWeight: "bold" }}>
              {stats ? stats.mergedPrs : 0}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "16px" }}>Merged PRs</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "#38bdf8", fontSize: "36px", fontWeight: "bold" }}>
              {stats ? stats.projectsContributed : 0}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "16px" }}>Official Projects</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "#34d399", fontSize: "36px", fontWeight: "bold" }}>
              {stats ? stats.credentialsEarned : 0}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "16px" }}>Verified Credentials</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "#fbbf24", fontSize: "36px", fontWeight: "bold" }}>
              100%
            </div>
            <div style={{ color: "#94a3b8", fontSize: "16px" }}>GitHub Evidence</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "16px" }}>
          <div>github.com/TechNexusOrg</div>
          <div>Proof of Work Backed by GitHub Evidence</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
