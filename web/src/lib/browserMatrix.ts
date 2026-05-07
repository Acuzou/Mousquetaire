const CHROMIUM_TOKEN = "Chrome/";
const FIREFOX_TOKEN = "Firefox/";
const EDGE_TOKEN = "Edg/";
const SAFARI_TOKEN = "Safari/";

export function isOutsideBrowserMatrix(userAgent: string): boolean {
  const normalizedUa = userAgent ?? "";
  const isEdge = normalizedUa.includes(EDGE_TOKEN);
  const isFirefox = normalizedUa.includes(FIREFOX_TOKEN);
  const isChromium = normalizedUa.includes(CHROMIUM_TOKEN) && !isEdge;
  const isSafari =
    normalizedUa.includes(SAFARI_TOKEN) &&
    !normalizedUa.includes(CHROMIUM_TOKEN) &&
    !normalizedUa.includes(EDGE_TOKEN);
  return !(isEdge || isFirefox || isChromium || isSafari);
}
