// Utilities to build tracked redirect URLs for outbound clicks

const SUPABASE_EDGE_BASE = "https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1";

export function getClickTrackingUrl(
  serviceId: string | undefined,
  destinationUrl: string,
  vendorId?: string
) {
  const url = new URL(`${SUPABASE_EDGE_BASE}/click-tracker`);
  if (serviceId) url.searchParams.set("s", serviceId);
  if (vendorId) url.searchParams.set("v", vendorId);
  url.searchParams.set("d", destinationUrl);
  return url.toString();
}

export { getClickTrackingUrl as getClickURL, getClickTrackingUrl as buildTrackingUrl };
