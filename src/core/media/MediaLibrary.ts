import type { MediaAsset } from '../types';

export class MediaLibrary {
  private assets: MediaAsset[] = [];

  constructor() {
    const saved = localStorage.getItem('nona_media_assets');
    if (saved) {
      try { this.assets = JSON.parse(saved); } catch {}
    }
  }

  getAssets(projectId?: string): MediaAsset[] {
    if (projectId) {
      return this.assets.filter(a => a.projectId === projectId || a.projectId === 'global');
    }
    return this.assets;
  }

  addAsset(asset: MediaAsset) {
    this.assets = [asset, ...this.assets];
    this.persist();
  }

  deleteAsset(id: string) {
    this.assets = this.assets.filter(a => a.id !== id);
    this.persist();
  }

  private persist() {
    localStorage.setItem('nona_media_assets', JSON.stringify(this.assets));
  }
}

export const mediaLibrary = new MediaLibrary();
