import { useState } from 'react';
import { useFetcher } from 'react-router';
import './App.css';
import './GuestbookGate.css';
import InternalLink from './InternalLink';
import ViewSidebar from './ViewSidebar';
import { LocalizedText, useLanguage } from './LanguageSystem';
import { ROUTES } from './routes';

// Replace only "mdaqjdba" when switching to another Formspree form ID.
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mdaqjdba';

export async function guestbookAction({ request }) {
  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: await request.formData(),
      headers: { Accept: 'application/json' },
      signal: request.signal,
    });

    return response.ok
      ? { ok: true }
      : { ok: false, status: response.status };
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return { ok: false, status: 0 };
  }
}

export default function GuestbookGate() {
  const { language, t } = useLanguage();
  const [visitorType, setVisitorType] = useState('visitor');
  const fetcher = useFetcher();
  const submitState = fetcher.state !== 'idle'
    ? 'sending'
    : fetcher.data?.ok
      ? 'success'
      : fetcher.data
        ? 'error'
        : 'idle';

  return (
    <main className="guestbook-gate">
      <div className="guestbook-scanlines" aria-hidden="true" />
      <ViewSidebar currentPage="review" />
      <header className="guestbook-header">
        <InternalLink className="brand" href={ROUTES.home} aria-label="Surachet Panto — portfolio">
          SP<span>.</span>
        </InternalLink>
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

          <fetcher.Form method="post" action={ROUTES.review} data-formspree-endpoint={FORMSPREE_ENDPOINT}>
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
              <InternalLink className="guestbook-skip" href={ROUTES.home}>
                {t('return_portfolio')} →
              </InternalLink>
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
          </fetcher.Form>
        </div>
      </section>

      <footer className="guestbook-footer" aria-hidden="true">
        <span>SURACHET_PANTO // REVIEW_TERMINAL</span>
        <span>NONTHABURI // TH</span>
      </footer>
    </main>
  );
}
