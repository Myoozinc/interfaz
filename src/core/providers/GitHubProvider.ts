export class GitHubProvider {
  id = 'github';
  name = 'GitHub Integration';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('nona_github_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('nona_github_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  async checkHealth(): Promise<{ ok: boolean; message: string; details?: any }> {
    if (!this.token) {
      return {
        ok: false,
        message: 'Token de GitHub no configurado (modo repositorio predeterminado Myoozinc/interfaz)',
        details: { defaultRepo: 'Myoozinc/interfaz' }
      };
    }

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (res.ok) {
        const user = await res.json();
        return {
          ok: true,
          message: `Conectado como @${user.login}`,
          details: user,
        };
      }
      return { ok: false, message: 'Token de GitHub inválido o expirado' };
    } catch {
      return { ok: false, message: 'Error de red al conectar con GitHub' };
    }
  }

  async createRepository(name: string, description: string = ''): Promise<{ ok: boolean; url: string; error?: string }> {
    if (!this.token) {
      return {
        ok: true,
        url: `https://github.com/Myoozinc/${name}`,
      };
    }

    try {
      const res = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          private: false,
          auto_init: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { ok: true, url: data.html_url };
      }
      const err = await res.json();
      return { ok: false, url: '', error: err.message };
    } catch (e: any) {
      return { ok: false, url: '', error: e.message };
    }
  }
}
