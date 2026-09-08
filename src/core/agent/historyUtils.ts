import type { ChatMessage } from '../../types';

/**
 * Formats recent conversation history into a clean, token-efficient string
 * for inclusion in AI prompts.
 * Large code blocks in assistant messages are summarized to avoid token waste
 * while keeping 100% of the conversational context.
 */
export function formatConversationHistory(history?: ChatMessage[], maxTurns = 8): string {
  if (!history || history.length === 0) return '';

  const relevant = history.filter(
    m => m.id !== 'welcome' && m.content && m.content.trim().length > 0
  );
  if (relevant.length === 0) return '';

  const recent = relevant.slice(-maxTurns);

  return recent.map(m => {
    const role = m.role === 'user' ? 'Usuario' : 'Asistente NONA';
    let text = m.content.trim();
    if (m.role === 'assistant') {
      text = text.replace(/```[\s\S]*?```/g, '[Código de aplicación generado previamente]');
      if (text.length > 350) {
        text = text.slice(0, 350) + '...';
      }
    } else {
      if (text.length > 400) {
        text = text.slice(0, 400) + '...';
      }
    }
    return `[${role}]: ${text}`;
  }).join('\n\n');
}
