export interface VendorSelectionPromptOptions {
  vendorsLoaded: boolean;
  vendorsCount: number;
  userPrefsLoaded: boolean;
  hasPrefs: boolean;
}

export function shouldPromptForVendorSelection(opts: VendorSelectionPromptOptions): boolean {
  if (!opts.vendorsLoaded || !opts.userPrefsLoaded) return false;
  if (opts.vendorsCount <= 0) return false;
  if (opts.hasPrefs) return false;
  if (sessionStorage.getItem("vendorModalDismissed") === "1") return false;
  return true;
}

export function markVendorModalDismissed(): void {
  sessionStorage.setItem("vendorModalDismissed", "1");
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}