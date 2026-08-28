import type { ProjectRecord, FileItem } from '../types';
import { STARTER_TEMPLATES } from './templates';

const DB_NAME = 'NONA_PROJECTS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

class ProjectStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  async getAllProjects(): Promise<ProjectRecord[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result as ProjectRecord[];
          if (list && list.length > 0) {
            resolve(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
          } else {
            const initial = this.createDefaultProject();
            this.saveProject(initial);
            resolve([initial]);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const saved = localStorage.getItem('nona_projects_list');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
      const initial = this.createDefaultProject();
      return [initial];
    }
  }

  async getProject(id: string): Promise<ProjectRecord | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getAllProjects();
      return list.find(p => p.id === id) || null;
    }
  }

  async saveProject(project: ProjectRecord): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        project.updatedAt = new Date().toISOString();
        const req = store.put(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getAllProjects();
      const idx = list.findIndex(p => p.id === project.id);
      if (idx !== -1) list[idx] = project;
      else list.push(project);
      localStorage.setItem('nona_projects_list', JSON.stringify(list));
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = (await this.getAllProjects()).filter(p => p.id !== id);
      localStorage.setItem('nona_projects_list', JSON.stringify(list));
    }
  }

  createDefaultProject(name: string = 'NONA App', files: FileItem[] = STARTER_TEMPLATES[0].files): ProjectRecord {
    return {
      id: 'proj_' + Date.now(),
      name,
      description: 'Proyecto creado con NONA AI Studio',
      files,
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '¡Hola! Soy **NONA AI**. Pídeme crear cualquier aplicación, juego 3D interactivo, componente o diseño en tiempo real.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const projectStore = new ProjectStore();
