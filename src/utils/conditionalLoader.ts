// Conditional loading based on user interactions and route needs
export class ConditionalLoader {
  private loadedModules = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();

  // Load charts only when needed
  async loadChartsIfNeeded() {
    if (this.loadedModules.has('charts')) return;
    
    if (!this.loadingPromises.has('charts')) {
      this.loadingPromises.set('charts', 
        import('recharts').then(module => {
          this.loadedModules.add('charts');
          return module;
        })
      );
    }
    
    return this.loadingPromises.get('charts');
  }

  // Load Supabase only when authentication or data operations are needed
  async loadSupabaseIfNeeded() {
    if (this.loadedModules.has('supabase')) return;
    
    if (!this.loadingPromises.has('supabase')) {
      this.loadingPromises.set('supabase',
        import('@supabase/supabase-js').then(module => {
          this.loadedModules.add('supabase');
          return module;
        })
      );
    }
    
    return this.loadingPromises.get('supabase');
  }

  // Load form libraries only when forms are actually interacted with
  async loadFormsIfNeeded() {
    if (this.loadedModules.has('forms')) return;
    
    if (!this.loadingPromises.has('forms')) {
      this.loadingPromises.set('forms',
        Promise.all([
          import('react-hook-form'),
          import('@hookform/resolvers/zod'),
          import('zod')
        ]).then(modules => {
          this.loadedModules.add('forms');
          return modules;
        })
      );
    }
    
    return this.loadingPromises.get('forms');
  }

  // Load date utilities only when date operations are needed
  async loadDateUtilsIfNeeded() {
    if (this.loadedModules.has('date-utils')) return;
    
    if (!this.loadingPromises.has('date-utils')) {
      this.loadingPromises.set('date-utils',
        Promise.all([
          import('date-fns'),
          import('react-day-picker')
        ]).then(modules => {
          this.loadedModules.add('date-utils');
          return modules;
        })
      );
    }
    
    return this.loadingPromises.get('date-utils');
  }

  // Preload based on user behavior
  preloadOnIdle(modules: string[]) {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        modules.forEach(module => {
          switch (module) {
            case 'charts':
              this.loadChartsIfNeeded();
              break;
            case 'forms':
              this.loadFormsIfNeeded();
              break;
            case 'date-utils':
              this.loadDateUtilsIfNeeded();
              break;
          }
        });
      });
    }
  }

  // Preload on user interaction (hover, focus)
  preloadOnInteraction(element: HTMLElement, modules: string[]) {
    const preload = () => {
      modules.forEach(module => {
        switch (module) {
          case 'charts':
            this.loadChartsIfNeeded();
            break;
          case 'forms':
            this.loadFormsIfNeeded();
            break;
        }
      });
    };

    element.addEventListener('mouseenter', preload, { once: true });
    element.addEventListener('focus', preload, { once: true });
  }
}

export const conditionalLoader = new ConditionalLoader();