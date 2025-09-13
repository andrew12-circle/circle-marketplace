type Job = () => Promise<void>;

class SaveQueue {
  private q: Job[] = [];
  private running = false;

  enqueue(job: Job) {
    this.q.push(job);
    if (!this.running) this.run();
  }

  private async run() {
    this.running = true;
    while (this.q.length) {
      const job = this.q.shift()!;
      try { 
        await job(); 
      } catch (e) { 
        console.error('Save queue job failed:', e);
      }
    }
    this.running = false;
  }
}

export const globalSaveQueue = new SaveQueue();