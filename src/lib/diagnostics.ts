export function logGuardDecision(msg: string, data: any) {
  console.info("[guard]", msg, { ...data, ts: Date.now(), url: window.location.href })
}

export function createHealthEndpoint() {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    auth: {
      hasSession: !!window.localStorage.getItem('circle-auth-v1'),
      userId: null // Will be populated by actual auth check
    }
  }
}