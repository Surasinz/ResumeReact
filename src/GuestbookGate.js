import { useEffect, useRef, useState } from 'react';
import './App.css';
import './GuestbookGate.css';
import ViewSidebar from './ViewSidebar';
import { LocalizedText, useLanguage } from './LanguageSystem';

// Replace only "mdaqjdba" when switching to another Formspree form ID.
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mdaqjdba';

export default function GuestbookGate() {
  const { language, t } = useLanguage();
  const [visitorType, setVisitorType] = useState('visitor');
  const [submitState, setSubmitState] = useState('idle');
  const isMounted = useRef(true);
  const submissionInFlight = useRef(false);
  const requestController = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    isMounted.current = true;
    document.title = 'Review Terminal — Surachet Panto';

    return () => {
      isMounted.current = false;
      requestController.current?.abort();
      document.title = previousTitle;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submissionInFlight.current) return;

    submissionInFlight.current = true;
    const controller = new AbortController();
    requestController.current = controller;
    setSubmitState('sending');

    try {
      const response = await window.fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: new FormData(event.currentTarget),
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Formspree rejected the transmission.');
      }

      if (!isMounted.current) return;

      setSubmitState('success');
    } catch (error) {
      if (isMounted.current && error.name !== 'AbortError') {
        setSubmitState('error');
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
      }
      submissionInFlight.current = false;
    }
  };

  return (
    <main className="guestbook-gate">
      <div className="guestbook-scanlines" aria-hidden="true" />
      <ViewSidebar currentPage="review" />
      <header className="guestbook-header">
        <a className="brand" href="/" aria-label="Surachet Panto — portfolio">
          SP<span>.</span>
        </a>
        <span>FEEDBACK_NODE // REVIEW_TERMINAL</span>
      </header>

      <section className="guestbook-shell" aria-labelledby="guestbook-title">
        <div className="guestbook-intro">
          <div className="guestbook-node" aria-hidden="true">
            <span>NODE_01</span>
            <i />
          </div>
          <LocalizedText as="p" i18nKey="review_eyebrow" />
          <h1 id="guestbook-title">
            <LocalizedText i18nKey="review_title_primary" />
            <LocalizedText i18nKey="review_title_secondary" />
          </h1>
          <LocalizedText as="p" className="guestbook-description" i18nKey="review_desc" />
          <div className="guestbook-meta" aria-hidden="true">
            <span>ENCRYPTION: ACTIVE</span>
            <span>CHANNEL: HTTPS</span>
            <span>STATUS: AWAITING INPUT</span>
          </div>
        </div>

        <div className="guestbook-terminal">
          <div className="guestbook-terminal-bar" aria-hidden="true">
            <div>
              <span />
              <span />
              <span />
            </div>
            <p>visitor_feedback.form</p>
            <b>FORM_ID: MDAQJDBA</b>
          </div>

          <form
            action={FORMSPREE_ENDPOINT}
            method="POST"
            onSubmit={handleSubmit}
          >
            <input
              type="hidden"
              name="_subject"
              value="New Website Visitor & Feedback!"
            />
            <input type="hidden" name="visitor_type" value={visitorType} />

            <fieldset className="guestbook-type">
              <LocalizedText as="legend" i18nKey="select_visitor" />
              <div>
                <button
                  type="button"
                  className={visitorType === 'visitor' ? 'is-active' : ''}
                  aria-pressed={visitorType === 'visitor'}
                  onClick={() => setVisitorType('visitor')}
                >
                  [ <LocalizedText i18nKey="visitor" /> ]
                </button>
                <button
                  type="button"
                  className={visitorType === 'recruiter' ? 'is-active' : ''}
                  aria-pressed={visitorType === 'recruiter'}
                  onClick={() => setVisitorType('recruiter')}
                >
                  [ <LocalizedText i18nKey="recruiter" /> ]
                </button>
              </div>
            </fieldset>

            <div className="guestbook-dynamic-fields" aria-live="polite">
              {visitorType === 'visitor' ? (
                <label>
                  <span lang={language}>01 // {t('field_name')}</span>
                  <input
                    type="text"
                    lang={language}
                    name="visitor_name"
                    autoComplete="name"
                    placeholder={t('placeholder_name')}
                    required
                  />
                </label>
              ) : (
                <>
                  <label>
                    <span lang={language}>01 // {t('field_company')}</span>
                    <input
                      type="text"
                      lang={language}
                      name="company_name"
                      autoComplete="organization"
                      placeholder={t('placeholder_company')}
                      required
                    />
                  </label>
                  <label>
                    <span lang={language}>02 // {t('field_contact')}</span>
                    <input
                      type="text"
                      lang={language}
                      name="contact_info"
                      autoComplete="email"
                      placeholder={t('placeholder_contact')}
                    />
                  </label>
                </>
              )}
            </div>

            <label className="guestbook-feedback">
              <span lang={language}>
                {`${visitorType === 'visitor' ? '02' : '03'} // ${t('field_feedback')}`}
              </span>
              <textarea
                name="website_feedback"
                lang={language}
                rows="5"
                placeholder={t('placeholder_feedback')}
                required
              />
            </label>

            <div className="guestbook-actions">
              <button
                className="guestbook-submit"
                type="submit"
                disabled={submitState === 'sending'}
              >
                <span lang={language}>
                  {submitState === 'sending'
                    ? `[ ${t('transmitting')} ]`
                    : `[ ${t('transmit')} ]`}
                </span>
              </button>
              <a className="guestbook-skip" href="/">
                {t('return_portfolio')} →
              </a>
            </div>

            <p
              className="guestbook-form-status"
              role="status"
              aria-live="polite"
              lang={language}
            >
              {submitState === 'sending' && t('feedback_sending')}
              {submitState === 'success' && t('feedback_success')}
              {submitState === 'error' && t('feedback_error')}
            </p>
          </form>
        </div>
      </section>

      <footer className="guestbook-footer" aria-hidden="true">
        <span>SURACHET_PANTO // REVIEW_TERMINAL</span>
        <span>NONTHABURI // TH</span>
      </footer>
    </main>
  );
}
