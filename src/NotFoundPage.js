import { useEffect, useState } from 'react';
import './App.css';
import './NotFoundPage.css';
import ViewSidebar from './ViewSidebar';

const ERROR_LOG =
  '> PAGE NOT FOUND\n' +
  '> SYSTEM_LOG: Directory missing or execution policy blocked.\n' +
  '> ACTION: Awaiting manual reboot...';

function RepairBot({ messageVisible }) {
  return (
    <div className="error-bot-wrap" aria-label="Builder bot repairing the missing page">
      <div
        className={`error-bot-message${messageVisible ? ' is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {messageVisible ? 'WARNING: Page payload not found!' : ''}
      </div>
      <div
        className="error-bot-sprite"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${process.env.PUBLIC_URL}/builder-bot-sprite.webp")`,
        }}
      />
      <span className="error-bot-shadow" aria-hidden="true" />
    </div>
  );
}

export default function NotFoundPage() {
  const [typedLog, setTypedLog] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    document.title = '404 — Page Payload Not Found';

    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (reducedMotion) {
      setTypedLog(ERROR_LOG);
      setTypingComplete(true);
      return undefined;
    }

    let characterIndex = 0;
    let typeTimer = null;

    const typeNextCharacter = () => {
      characterIndex += 1;
      setTypedLog(ERROR_LOG.slice(0, characterIndex));

      if (characterIndex < ERROR_LOG.length) {
        typeTimer = window.setTimeout(typeNextCharacter, 18);
      } else {
        setTypingComplete(true);
      }
    };

    typeTimer = window.setTimeout(typeNextCharacter, 280);

    return () => {
      window.clearTimeout(typeTimer);
    };
  }, []);

  return (
    <main className="error-page">
      <div className="error-scanlines" aria-hidden="true" />
      <ViewSidebar currentPage="not-found" />
      <header className="error-header">
        <a className="brand" href="/" aria-label="Surachet Panto — home">
          SP<span>.</span>
        </a>
        <span>ERR_ROUTE // UNRESOLVED</span>
      </header>

      <section className="error-content" aria-labelledby="error-title">
        <p className="error-kicker">SYSTEM EXCEPTION // 0x00000404</p>
        <div
          className="error-code"
          id="error-title"
          data-text="404"
          aria-label="Error 404"
        >
          404
        </div>

        <div className="error-terminal">
          <div className="error-terminal-bar" aria-hidden="true">
            <span />
            <span />
            <span />
            <b>system/recovery.log</b>
          </div>
          <div
            className="error-terminal-output"
            aria-busy={!typingComplete}
            aria-label={ERROR_LOG}
          >
            <span aria-hidden="true">{typedLog}</span>
            <i className="error-terminal-cursor" aria-hidden="true">
              █
            </i>
          </div>
        </div>

        <a className="error-reboot" href="/">
          <span>[ INITIALIZE REBOOT ]</span>
        </a>
      </section>

      <RepairBot messageVisible={typingComplete} />

      <footer className="error-footer" aria-hidden="true">
        <span>ENTERPRISE_BUILDER_OS v2.6</span>
        <span>NONTHABURI // TH</span>
      </footer>
    </main>
  );
}

export { ERROR_LOG };
