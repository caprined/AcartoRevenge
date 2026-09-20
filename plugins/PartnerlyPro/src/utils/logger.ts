export function log(...args: any[]) {
  try {
    console.log("[PartnerlyPro]", ...args);
  } catch {
    // ignore
  }
}

export function warn(...args: any[]) {
  try {
    console.warn("[PartnerlyPro]", ...args);
  } catch {
    // ignore
  }
}

export function error(...args: any[]) {
  try {
    console.error("[PartnerlyPro]", ...args);
  } catch {
    // ignore
  }
}
