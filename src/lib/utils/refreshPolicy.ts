import { browser } from '$app/environment';

export interface RefreshState {
  lastFetch: number;
  nextCheck: number;
  isMondayBoost: boolean;
  isDailySweep: boolean;
  lastCheckTime: string;
}

export class RefreshPolicy {
  private timezone = 'America/Detroit';
  
  constructor() {
    if (browser) {
      this.initializePolicy();
    }
  }

  private initializePolicy(): void {
    const stored = localStorage.getItem('refreshPolicy');
    if (!stored) {
      this.resetPolicy();
    }
  }

  private resetPolicy(): void {
    const now = this.getDetroitTime();
    const state: RefreshState = {
      lastFetch: 0,
      nextCheck: this.calculateNextCheck(now),
      isMondayBoost: this.isMondayBoostWindow(now),
      isDailySweep: this.isDailySweepTime(now),
      lastCheckTime: now.toISOString()
    };
    
    if (browser) {
      localStorage.setItem('refreshPolicy', JSON.stringify(state));
    }
  }

  private getDetroitTime(): Date {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: this.timezone }));
  }

  private isMondayBoostWindow(date: Date): boolean {
    const day = date.getDay();
    const hour = date.getHours();
    return day === 1 && hour >= 0 && hour < 12; // Monday 12 AM - 12 PM
  }

  private isDailySweepTime(date: Date): boolean {
    const hour = date.getHours();
    return hour === 7; // 7 AM daily
  }

  private calculateNextCheck(now: Date): number {
    const hour = now.getHours();
    const day = now.getDay();
    
    // Monday boost window: check hourly
    if (this.isMondayBoostWindow(now)) {
      const nextHour = new Date(now);
      nextHour.setHours(hour + 1, 0, 0, 0);
      return nextHour.getTime();
    }
    
    // Daily sweep: next 7 AM
    const nextSweep = new Date(now);
    nextSweep.setHours(7, 0, 0, 0);
    if (nextSweep <= now) {
      nextSweep.setDate(nextSweep.getDate() + 1);
    }
    return nextSweep.getTime();
  }

  public shouldFetch(forceRefresh: boolean = false): boolean {
    if (forceRefresh) return true;
    
    const state = this.getState();
    const now = Date.now();
    
    // Backoff: don't fetch if last fetch < 15 min ago
    if (now - state.lastFetch < 15 * 60 * 1000) {
      return false;
    }
    
    // Check if it's time for next check
    return now >= state.nextCheck;
  }

  public getState(): RefreshState {
    if (!browser) {
      return {
        lastFetch: 0,
        nextCheck: Date.now() + 60 * 60 * 1000,
        isMondayBoost: false,
        isDailySweep: false,
        lastCheckTime: new Date().toISOString()
      };
    }
    
    const stored = localStorage.getItem('refreshPolicy');
    if (!stored) {
      this.resetPolicy();
      return this.getState();
    }
    
    return JSON.parse(stored);
  }

  public updateAfterFetch(): void {
    const now = Date.now();
    const detroitTime = this.getDetroitTime();
    const state = this.getState();
    
    const newState: RefreshState = {
      lastFetch: now,
      nextCheck: this.calculateNextCheck(detroitTime),
      isMondayBoost: this.isMondayBoostWindow(detroitTime),
      isDailySweep: this.isDailySweepTime(detroitTime),
      lastCheckTime: detroitTime.toISOString()
    };
    
    if (browser) {
      localStorage.setItem('refreshPolicy', JSON.stringify(newState));
    }
  }

  public getNextCheckTime(): string {
    const state = this.getState();
    const nextCheck = new Date(state.nextCheck);
    return nextCheck.toLocaleString("en-US", { 
      timeZone: this.timezone,
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  public getStatusMessage(articlesCount: number, isLoading: boolean, error: string): string {
    if (error) {
      return `Can't reach the server. We'll try again at ${this.getNextCheckTime()}. Tap Reload to try now.`;
    }
    
    if (isLoading) {
      return 'Fetching the latest…';
    }
    
    if (articlesCount === 0) {
      return `No new stories yet. We'll check again at ${this.getNextCheckTime()}.`;
    }
    
    return `You're all caught up. Next update at ${this.getNextCheckTime()}.`;
  }
}
