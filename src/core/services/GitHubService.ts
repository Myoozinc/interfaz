/**
 * GitHubService
 * 
 * Servicio nativo para sincronización y despliegue en GitHub con 1 clic.
 * Permite validar tokens, crear repositorios en la cuenta del usuario,
 * subir commits atómicos vía Git Data API (Blobs, Trees, Commits) y
 * generar enlaces de despliegue directo a Vercel.
 */

import type { FileItem } from '../../types';

export interface GitHubUserProfile {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos?: number;
}

export interface GitHubRepoResult {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

export interface PushResult {
  commitSha: string;
  commitUrl: string;
  repoUrl: string;
}

export class GitHubService {
  private static instance: GitHubService | null = null;
  private readonly GITHUB_API_URL = 'https://api.github.com';

  private constructor() {}

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  /**
   * Sanitiza el nombre de un proyecto para convertirlo en un slug válido para GitHub
   */
  public sanitizeRepoName(name: string): string {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'nona-project';
  }

  /**
   * Valida un Personal Access Token (PAT) y obtiene el perfil del usuario
   */
  public async validateToken(token: string): Promise<GitHubUserProfile> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('El token de GitHub no puede estar vacío.');
    }

    const response = await fetch(`${this.GITHUB_API_URL}/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token de GitHub inválido o expirado. Verifica tus permisos en GitHub Settings.');
      }
      throw new Error(`Error de autenticación con GitHub (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      login: data.login,
      name: data.name || data.login,
      avatar_url: data.avatar_url,
      html_url: data.html_url,
      public_repos: data.public_repos,
    };
  }

  /**
   * Crea un nuevo repositorio en la cuenta del usuario autenticado
   */
  public async createRepository(
    token: string,
    options: {
      name: string;
      description?: string;
      isPrivate?: boolean;
    }
  ): Promise<GitHubRepoResult> {
    const cleanToken = token.trim();
    const repoName = this.sanitizeRepoName(options.name);

    const response = await fetch(`${this.GITHUB_API_URL}/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: options.description || 'Creado con NONA AI Software Factory',
        private: Boolean(options.isPrivate),
        auto_init: true, // Crea commit inicial con README para inicializar la rama main
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 422) {
        throw new Error(`El repositorio "${repoName}" ya existe en tu cuenta de GitHub.`);
      }
      throw new Error(errData.message || `No se pudo crear el repositorio en GitHub (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      html_url: data.html_url,
      clone_url: data.clone_url,
      default_branch: data.default_branch || 'main',
    };
  }

  /**
   * Sube todos los archivos del proyecto como un commit atómico usando Git Data API
   */
  public async pushFiles(
    token: string,
    owner: string,
    repo: string,
    files: FileItem[],
    commitMessage: string = 'feat: Sincronización automática desde NONA AI Studio',
    onProgress?: (message: string) => void
  ): Promise<PushResult> {
    const cleanToken = token.trim();
    const headers = {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    onProgress?.('Verificando rama principal en GitHub...');
    // 1. Obtener la referencia de la rama main
    let latestCommitSha: string | null = null;
    const refRes = await fetch(`${this.GITHUB_API_URL}/repos/${owner}/${repo}/git/ref/heads/main`, {
      headers,
    });

    if (refRes.ok) {
      const refData = await refRes.json();
      latestCommitSha = refData.object.sha;
    }

    // 2. Crear Git Blobs para cada archivo
    onProgress?.(`Creando estructura de archivos (${files.length} componentes)...`);
    const treeEntries: { path: string; mode: string; type: string; sha: string }[] = [];

    for (const file of files) {
      const cleanPath = file.name.replace(/^(\.\/|\/)/, '');
      const blobRes = await fetch(`${this.GITHUB_API_URL}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      });

      if (!blobRes.ok) {
        throw new Error(`Error al procesar el archivo "${cleanPath}" para GitHub.`);
      }

      const blobData = await blobRes.json();
      treeEntries.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // 3. Crear el nuevo árbol Git
    onProgress?.('Construyendo árbol Git...');
    const treePayload: any = {
      tree: treeEntries,
    };
    if (latestCommitSha) {
      // Obtener el base_tree del último commit si existe
      const commitRes = await fetch(`${this.GITHUB_API_URL}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
        headers,
      });
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        treePayload.base_tree = commitData.tree.sha;
      }
    }

    const newTreeRes = await fetch(`${this.GITHUB_API_URL}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(treePayload),
    });

    if (!newTreeRes.ok) {
      throw new Error('No se pudo generar el árbol de archivos en GitHub.');
    }
    const newTreeData = await newTreeRes.json();

    // 4. Crear el Commit
    onProgress?.('Creando commit atómico...');
    const commitPayload: any = {
      message: commitMessage,
      tree: newTreeData.sha,
      parents: latestCommitSha ? [latestCommitSha] : [],
    };

    const newCommitRes = await fetch(`${this.GITHUB_API_URL}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commitPayload),
    });

    if (!newCommitRes.ok) {
      throw new Error('No se pudo generar el commit en GitHub.');
    }
    const newCommitData = await newCommitRes.json();

    // 5. Actualizar la referencia refs/heads/main
    onProgress?.('Actualizando rama main...');
    if (latestCommitSha) {
      await fetch(`${this.GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads/main`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: true,
        }),
      });
    } else {
      await fetch(`${this.GITHUB_API_URL}/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: 'refs/heads/main',
          sha: newCommitData.sha,
        }),
      });
    }

    onProgress?.('¡Sincronización completada con éxito!');
    const repoUrl = `https://github.com/${owner}/${repo}`;
    return {
      commitSha: newCommitData.sha,
      commitUrl: `${repoUrl}/commit/${newCommitData.sha}`,
      repoUrl,
    };
  }

  /**
   * Genera una URL para desplegar el repositorio directamente a Vercel con 1 clic
   */
  public getVercelDeployUrl(repoHtmlUrl: string): string {
    return `https://vercel.com/new/git/external?repository-url=${encodeURIComponent(repoHtmlUrl)}`;
  }
}

export const gitHubService = GitHubService.getInstance();
