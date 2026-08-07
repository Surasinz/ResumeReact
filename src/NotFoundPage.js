import { useEffect, useState } from 'react';
import './App.css';
import './NotFoundPage.css';
import ViewSidebar from './ViewSidebar';
import InternalLink from './InternalLink';
import { LocalizedText, useLanguage } from './LanguageSystem';
import { splitGraphemes } from './graphemes';
import { ROUTES } from './routes';

const ERROR_LOG =
  '> PAGE NOT FOUND\n' +
  '> SYSTEM_LOG: Directory missing or execution policy blocked.\n' +
  '> ACTION: Awaiting manual reboot...';

function RepairBot({ messageVisible, message }) {
  return (
    <div className="error-bot-wrap" aria-label="Builder bot repairing the missing page">
      <div
        className={`error-bot-message${messageVisible ? ' is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {messageVisible ? message : ''}
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
  const { language, t } = useLanguage();
  const [typedLog, setTypedLog] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const localizedErrorLog =
    `> ${t('error_page_not_found')}\n` +
    `> ${t('error_system_log')}\n` +
    `> ${t('error_action')}`;

  useEffect(() => {
    setTypedLog('');
    setTypingComplete(false);

    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (reducedMotion) {
      setTypedLog(localizedErrorLog);
      setTypingComplete(true);
      return undefined;
    }

    let characterIndex = 0;
    let typeTimer = null;
    const logGraphemes = splitGraphemes(localizedErrorLog, language);

    const typeNextCharacter = () => {
      characterIndex += 1;
      setTypedLog(logGraphemes.slice(0, characterIndex).join(''));

      if (characterIndex < logGraphemes.length) {
        typeTimer = window.setTimeout(typeNextCharacter, 18);
      } else {
        setTypingComplete(true);
      }
    };

    typeTimer = window.setTimeout(typeNextCharacter, 280);

    return () => {
      window.clearTimeout(typeTimer);
    };
  }, [language, localizedErrorLog]);

  return (
    <main className="error-page">
      <div className="error-scanlines" aria-hidden="true" />
      <ViewSidebar currentPage="not-found" />
      <header className="error-header">
        <InternalLink className="brand" href={ROUTES.home} aria-label="Surachet Panto — home">
          SP<span>.</span>
        </InternalLink>
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
            aria-label={localizedErrorLog}
            lang={language}
          >
            <LocalizedText aria-hidden="true">{typedLog}</LocalizedText>
            <i className="error-terminal-cursor" aria-hidden="true">
              █
            </i>
          </div>
        </div>

        <InternalLink className="error-reboot" href={ROUTES.home}>
          <span>[ <LocalizedText i18nKey="error_reboot" /> ]</span>
        </InternalLink>
      </section>

      <RepairBot messageVisible={typingComplete} message={t('error_warning')} />

      <footer className="error-footer" aria-hidden="true">
        <span>ENTERPRISE_BUILDER_OS v2.6</span>
        <span>NONTHABURI // TH</span>
      </footer>
    </main>
  );
}

export { ERROR_LOG };
