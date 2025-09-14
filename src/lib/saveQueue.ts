type Job<T = any> = () => Promise<T>;
type JobWithCallbacks<T = any> = {
  job: Job<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: any) => void;
};

class SaveQueue {
  private q: JobWithCallbacks[] = [];
  private running = false;

  enqueue<T = any>(job: Job<T>, callbacks?: { onSuccess?: (result: T) => void; onError?: (error: any) => void }) {
    this.q.push({ job, ...callbacks });
    if (!this.running) this.run();
  }

  private async run() {
    this.running = true;
    while (this.q.length) {
      const { job, onSuccess, onError } = this.q.shift()!;
      try { 
        const result = await job();
        onSuccess?.(result);
      } catch (e) { 
        console.error('Save queue job failed:', e);
        onError?.(e);
      }
    }
    this.running = false;
  }
}

export const globalSaveQueue = new SaveQueue();