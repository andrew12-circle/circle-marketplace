import { useAuthBootstrap } from "@/lib/useAuthBootstrap"

export function useCanQuery() {
  const { status, session } = useAuthBootstrap()
  return status === "ready" && !!session
}

export function useAuthReady() {
  const { status } = useAuthBootstrap()
  return status === "ready"
}