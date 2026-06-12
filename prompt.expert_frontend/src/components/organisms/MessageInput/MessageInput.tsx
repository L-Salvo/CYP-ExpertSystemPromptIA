import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { useChatStore } from '../../../store/chat.store';

interface MessageInputProps {
  onSubmit: (prompt: string) => void;
  /** External busy flag (e.g. creating chat) that also disables the input */
  forceBusy?: boolean;
}

export function MessageInput({ onSubmit, forceBusy = false }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { pipelineState } = useChatStore();

  const busy = forceBusy || pipelineState === 'enriching' || pipelineState === 'sending';

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  useEffect(() => {
    autoResize();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const el = textareaRef.current;
    if (!el) return;
    const prompt = el.value.trim();
    if (!prompt || busy) return;
    onSubmit(prompt);
    el.value = '';
    el.style.height = 'auto';
  }

  return (
    /* Aurora RGB rotating border wrapper */
    <div className="aurora-input-wrapper shadow-[var(--shadow-input)]">
      <div className="aurora-input-inner">
        <div className="relative flex items-center gap-3 bg-[var(--color-surface-1)] px-4 py-3">
          <textarea
            id="message-input"
            ref={textareaRef}
            rows={1}
            disabled={busy}
            placeholder="Escribe tu consulta..."
            onInput={autoResize}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
              resize-none outline-none leading-relaxed max-h-[160px] disabled:opacity-50"
            aria-label="Mensaje"
          />
          <Button
            id="send-btn"
            variant="primary"
            size="icon"
            disabled={busy}
            onClick={submit}
            aria-label="Enviar mensaje"
            className="flex-shrink-0"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
