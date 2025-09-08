import { supabase } from "@/lib/supabaseClient"

// Debounced save utility
const pending = new Map<string, any>()
const inFlight = new Set<string>()
const debounceMs = 500
let timer: any

export function queueServicePatch(id: string, patch: any) {
  pending.set(id, { ...(pending.get(id) || {}), ...patch })
  clearTimeout(timer)
  timer = setTimeout(flush, debounceMs)
}

async function flush() {
  const entries = Array.from(pending.entries())
  pending.clear()
  
  await Promise.all(entries.map(async ([id, patch]) => {
    if (inFlight.has(id)) {
      // Re-queue if already saving
      return queueServicePatch(id, patch)
    }
    
    inFlight.add(id)
    try {
      const { error } = await supabase
        .from("services")
        .update(patch)
        .eq("id", id)
      
      if (error) throw error
      
      // Show success feedback
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('service-saved', { 
          detail: { id, success: true } 
        }))
      }
    } catch (error) {
      console.error("Service save failed:", error)
      
      // Show error and rollback
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('service-save-error', { 
          detail: { id, error: error.message } 
        }))
      }
    } finally {
      inFlight.delete(id)
    }
  }))
}

export function isServiceSaving(id: string): boolean {
  return inFlight.has(id)
}

export function cancelPendingSave(id: string) {
  pending.delete(id)
}