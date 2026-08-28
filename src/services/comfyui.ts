import type { ComfyAsset } from '../types';

export class ComfyUIService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8188') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkStatus(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = await response.json();
        const vram = data?.devices?.[0]?.vram_total ? Math.round(data.devices[0].vram_total / (1024 * 1024 * 1024)) + 'GB' : 'Apple Silicon';
        return { ok: true, message: `ComfyUI Conectado (${vram} VRAM)` };
      }
      return { ok: false, message: 'ComfyUI respondió con error' };
    } catch {
      return {
        ok: false,
        message: 'ComfyUI no detectado en ' + this.baseUrl + ' (se usarán generadores locales de respaldo)'
      };
    }
  }

  /**
   * Generates an image or video asset via ComfyUI or high-quality procedural generator
   */
  async generateMedia(
    prompt: string,
    type: 'image' | 'video' | 'texture' = 'image'
  ): Promise<ComfyAsset> {
    try {
      // If ComfyUI is reachable, we submit the workflow prompt
      const status = await this.checkStatus();
      if (status.ok) {
        // Send to ComfyUI /prompt endpoint
        const client_id = 'nona_' + Date.now();
        const promptWorkflow = this.buildBasicWorkflow(prompt, client_id);
        
        const response = await fetch(`${this.baseUrl}/prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptWorkflow, client_id }),
        });

        if (response.ok) {
          const resJson = await response.json();
          const promptId = resJson.prompt_id;
          return {
            id: 'comfy_' + Date.now(),
            prompt,
            type,
            url: `${this.baseUrl}/view?filename=nona_${promptId}.png`,
            createdAt: new Date().toLocaleTimeString(),
          };
        }
      }
    } catch {
      // Fallback
    }

    // High quality dynamic fallback texture / visual asset
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 512;
    fallbackCanvas.height = 512;
    const ctx = fallbackCanvas.getContext('2d');

    if (ctx) {
      // Procedural neon cyberpunk / luxury aesthetic graphic
      const gradient = ctx.createRadialGradient(256, 256, 20, 256, 256, 300);
      gradient.addColorStop(0, '#7C3AED');
      gradient.addColorStop(0.5, '#4F46E5');
      gradient.addColorStop(1, '#0F172A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // Grid lines
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 512; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }

      // Center glowing emblem
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(prompt.slice(0, 25), 256, 240);
      ctx.fillStyle = '#A78BFA';
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.fillText('NONA Media Asset (' + type.toUpperCase() + ')', 256, 275);
    }

    const dataUrl = fallbackCanvas.toDataURL('image/png');
    return {
      id: 'asset_' + Date.now(),
      prompt,
      type,
      url: dataUrl,
      createdAt: new Date().toLocaleTimeString(),
    };
  }

  private buildBasicWorkflow(prompt: string, _clientId: string): any {
    return {
      "3": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000),
          "steps": 20,
          "cfg": 7,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": { "ckpt_name": "v1-5-pruned-emaonly.ckpt" },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": { "width": 512, "height": 512, "batch_size": 1 },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": { "text": prompt + ", high quality, 8k, modern ui asset", "clip": ["4", 1] },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": { "text": "blurry, low quality, distorted", "clip": ["4", 1] },
        "class_type": "CLIPTextEncode"
      }
    };
  }
}

export const comfyClient = new ComfyUIService();
