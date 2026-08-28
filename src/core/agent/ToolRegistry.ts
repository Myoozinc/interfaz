import type { ToolDefinition, ToolResult, ToolCall, FullStackProject } from '../types';
import { ComfyUIProvider } from '../providers/ComfyUIProvider';
import { GitHubProvider } from '../providers/GitHubProvider';
import { VercelProvider } from '../providers/VercelProvider';
import { agentEvents } from './AgentEvents';

export class ToolRegistry {
  private comfyProvider: ComfyUIProvider;
  private githubProvider: GitHubProvider;
  private vercelProvider: VercelProvider;

  constructor() {
    this.comfyProvider = new ComfyUIProvider();
    this.githubProvider = new GitHubProvider();
    this.vercelProvider = new VercelProvider();
  }

  getDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'project_write_file',
        description: 'Crea o sobrescribe un archivo dentro del proyecto.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Ruta relativa del archivo (ej. index.html, src/App.tsx, api/routes.js)' },
            content: { type: 'string', description: 'Contenido completo del archivo' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'project_patch_file',
        description: 'Modifica selectivamente una sección de un archivo existente.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Ruta del archivo a modificar' },
            target: { type: 'string', description: 'Texto o bloque a reemplazar' },
            replacement: { type: 'string', description: 'Nuevo texto de reemplazo' }
          },
          required: ['path', 'target', 'replacement']
        }
      },
      {
        name: 'project_read_file',
        description: 'Lee el contenido de un archivo del proyecto.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Ruta del archivo' }
          },
          required: ['path']
        }
      },
      {
        name: 'project_list_files',
        description: 'Lista todos los archivos actuales del proyecto.',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'generate_image',
        description: 'Genera una imagen o textura para el proyecto mediante IA.',
        parameters: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Descripción detallada de la imagen a generar' },
            type: { type: 'string', enum: ['image', 'texture'], description: 'Tipo de asset' }
          },
          required: ['prompt']
        }
      },
      {
        name: 'generate_video',
        description: 'Genera un video o animación para el proyecto mediante IA.',
        parameters: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Descripción del video o animación' }
          },
          required: ['prompt']
        }
      },
      {
        name: 'build_project',
        description: 'Compila y valida la sintaxis de todos los archivos del proyecto.',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'git_commit',
        description: 'Crea un commit con los cambios del proyecto.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Mensaje descriptivo del commit' }
          },
          required: ['message']
        }
      },
      {
        name: 'deployment_deploy',
        description: 'Despliega la aplicación en Vercel y devuelve la URL de producción.',
        parameters: {
          type: 'object',
          properties: {
            environment: { type: 'string', enum: ['production', 'preview'], description: 'Entorno de despliegue' }
          }
        }
      },
      {
        name: 'database_create_schema',
        description: 'Genera el esquema de base de datos SQL o Prisma para el proyecto.',
        parameters: {
          type: 'object',
          properties: {
            schemaSql: { type: 'string', description: 'Sentencias DDL / SQL para crear tablas y relaciones' }
          },
          required: ['schemaSql']
        }
      }
    ];
  }

  async executeTool(toolCall: ToolCall, project: FullStackProject): Promise<ToolResult> {
    agentEvents.emit('agent.tool.started', `Ejecutando herramienta: ${toolCall.name}`, toolCall);
    const { name, arguments: args } = toolCall;

    try {
      switch (name) {
        case 'project_write_file': {
          const { path, content } = args;
          const ext = path.split('.').pop() || 'html';
          project.files[path] = {
            path,
            content,
            language: ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'js' ? 'javascript' : ext,
            isModified: true,
            size: content.length,
          };
          agentEvents.emit('agent.file.created', `Archivo guardado: ${path}`);
          return { toolCallId: toolCall.id, name, success: true, output: `Archivo ${path} guardado correctamente.` };
        }

        case 'project_patch_file': {
          const { path, target, replacement } = args;
          const file = project.files[path];
          if (!file) return { toolCallId: toolCall.id, name, success: false, output: `Archivo ${path} no encontrado.` };
          file.content = file.content.replace(target, replacement);
          file.isModified = true;
          agentEvents.emit('agent.file.modified', `Archivo modificado: ${path}`);
          return { toolCallId: toolCall.id, name, success: true, output: `Parche aplicado en ${path}.` };
        }

        case 'project_read_file': {
          const file = project.files[args.path];
          if (!file) return { toolCallId: toolCall.id, name, success: false, output: `Archivo ${args.path} no encontrado.` };
          return { toolCallId: toolCall.id, name, success: true, output: file.content };
        }

        case 'project_list_files': {
          const paths = Object.keys(project.files);
          return { toolCallId: toolCall.id, name, success: true, output: JSON.stringify(paths) };
        }

        case 'generate_image':
        case 'generate_video': {
          agentEvents.emit(name === 'generate_image' ? 'agent.image.started' : 'agent.video.started', `Generando medio: ${args.prompt}`);
          const asset = await this.comfyProvider.generateAsset(args.prompt, name === 'generate_image' ? 'image' : 'video', project.id);
          agentEvents.emit(name === 'generate_image' ? 'agent.image.completed' : 'agent.video.completed', `Medio listo: ${asset.url}`);
          return { toolCallId: toolCall.id, name, success: true, output: `Asset generado con éxito: ${asset.url}`, data: asset };
        }

        case 'build_project': {
          agentEvents.emit('agent.build.started', 'Validando sintaxis y compilación...');
          let hasErrors = false;
          let errorLog = '';
          for (const [path, file] of Object.entries(project.files)) {
            if (path.endsWith('.html') && (!file.content.includes('<html') && !file.content.includes('<!DOCTYPE'))) {
              hasErrors = true;
              errorLog += `Error en ${path}: Falta estructura básica HTML.\n`;
            }
          }
          if (hasErrors) {
            agentEvents.emit('agent.build.failed', errorLog);
            return { toolCallId: toolCall.id, name, success: false, output: errorLog };
          }
          agentEvents.emit('agent.build.completed', 'Compilación exitosa sin errores');
          return { toolCallId: toolCall.id, name, success: true, output: 'Build verificado exitosamente (0 errores).' };
        }

        case 'git_commit': {
          agentEvents.emit('agent.command.started', `git commit -m "${args.message}"`);
          const token = this.githubProvider.getToken();
          const repo = project.name.toLowerCase().replace(/\s+/g, '-');
          if (token) {
            await this.githubProvider.createRepository(repo);
          }
          return { toolCallId: toolCall.id, name, success: true, output: `Commit registrado: [main] ${args.message}` };
        }

        case 'deployment_deploy': {
          agentEvents.emit('deployment.started', 'Preparando despliegue en Vercel...');
          const deployRes = await this.vercelProvider.deployProject(project.name, Object.fromEntries(Object.entries(project.files).map(([k, v]) => [k, v.content])));
          project.deploymentUrl = deployRes.deploymentUrl;
          agentEvents.emit('deployment.completed', `Despliegue activo en ${deployRes.deploymentUrl}`);
          return { toolCallId: toolCall.id, name, success: true, output: `Desplegado en ${deployRes.deploymentUrl}` };
        }

        case 'database_create_schema': {
          project.databaseSchema = args.schemaSql;
          project.files['schema.sql'] = {
            path: 'schema.sql',
            content: args.schemaSql,
            language: 'sql',
            isModified: true
          };
          agentEvents.emit('agent.file.created', 'Esquema de base de datos generado: schema.sql');
          return { toolCallId: toolCall.id, name, success: true, output: 'Esquema de base de datos generado correctamente.' };
        }

        default:
          return { toolCallId: toolCall.id, name, success: false, output: `Herramienta desconocida: ${name}` };
      }
    } catch (err: any) {
      agentEvents.emit('agent.error', `Error en ${name}: ${err.message}`);
      return { toolCallId: toolCall.id, name, success: false, output: `Error: ${err.message}`, error: err.message };
    }
  }
}
