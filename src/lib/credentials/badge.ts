export function generateCredentialSvgBadge(
  title: string,
  status: "active" | "revoked" = "active"
): string {
  const leftText = "TechNexusOrg";
  const rightText = status === "revoked" ? `${title} (Revoked)` : `${title} ✓`;

  const leftCharWidth = 7.5;
  const rightCharWidth = 7.8;
  const padding = 16;

  const leftWidth = Math.round(leftText.length * leftCharWidth + padding);
  const rightWidth = Math.round(rightText.length * rightCharWidth + padding);
  const totalWidth = leftWidth + rightWidth;

  const leftColor = "#0f172a"; // slate-900
  const rightColor = status === "revoked" ? "#b91c1c" : "#0284c7"; // red-700 or sky-600

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" viewBox="0 0 ${totalWidth} 24" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <clipPath id="badge-clip">
    <rect width="${totalWidth}" height="24" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#badge-clip)">
    <rect width="${leftWidth}" height="24" fill="${leftColor}"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="24" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="24" fill="url(#gloss)" opacity="0.1"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" text-rendering="geometricPrecision" font-size="11" font-weight="600">
    <text x="${leftWidth / 2}" y="16" fill="#cbd5e1">${leftText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="16">${rightText}</text>
  </g>
</svg>`;
}
