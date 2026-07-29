import { useEffect, useRef, useState } from 'react';
import './App.css';
import './GuestbookGate.css';

// Replace only "mdaqjdba" when switching to another Formspree form ID.
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mdaqjdba';

export default function GuestbookGate({ onEnter }) {
  const [visitorType, setVisitorType] = useState('visitor');
  const [submitState, setSubmitState] = useState('idle');
  const isMounted = useRef(true);
  const submissionInFlight = useRef(false);
  const requestController = useRef(null);
  const accessGranted = useRef(false);

  useEffect(() => {
    const previousTitle = document.title;
    isMounted.current = true;
    document.title = 'Guestbook Gateway — Surachet Panto';

    return () => {
      isMounted.current = false;
      requestController.current?.abort();
      document.title = previousTitle;
    };
  }, []);

  const grantAccessOnce = () => {
    if (accessGranted.current) return;

    accessGranted.current = true;
    onEnter();
  };

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

      if (!isMounted.current || accessGranted.current) return;

      setSubmitState('success');
      grantAccessOnce();
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

  const handleSkip = () => {
    requestController.current?.abort();
    submissionInFlight.current = false;
    grantAccessOnce();
  };

  return (
    <main className="guestbook-gate">
      <div className="guestbook-scanlines" aria-hidden="true" />
      <header className="guestbook-header">
        <a className="brand" href="/" aria-label="Surachet Panto — guestbook">
          SP<span>.</span>
        </a>
        <span>ACCESS_NODE // GUESTBOOK</span>
      </header>

      <section className="guestbook-shell" aria-labelledby="guestbook-title">
        <div className="guestbook-intro">
          <div className="guestbook-node" aria-hidden="true">
            <span>NODE_01</span>
            <i />
          </div>
          <p>Enterprise Builder // Visitor Gateway</p>
          <h1 id="guestbook-title">
            Leave a signal
            <span>before entering.</span>
          </h1>
          <p className="guestbook-description">
            Share one useful observation about this website. Your feedback is
            transmitted securely through Formspree and helps improve the next build.
          </p>
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
              <legend>Select visitor type</legend>
              <div>
                <button
                  type="button"
                  className={visitorType === 'visitor' ? 'is-active' : ''}
                  aria-pressed={visitorType === 'visitor'}
                  onClick={() => setVisitorType('visitor')}
                >
                  [ Visitor ]
                </button>
                <button
                  type="button"
                  className={visitorType === 'recruiter' ? 'is-active' : ''}
                  aria-pressed={visitorType === 'recruiter'}
                  onClick={() => setVisitorType('recruiter')}
                >
                  [ HR / Recruiter ]
                </button>
              </div>
            </fieldset>

            <div className="guestbook-dynamic-fields" aria-live="polite">
              {visitorType === 'visitor' ? (
                <label>
                  <span>01 // Name</span>
                  <input
                    type="text"
                    name="visitor_name"
                    autoComplete="name"
                    placeholder="Enter your name"
                    required
                  />
                </label>
              ) : (
                <>
                  <label>
                    <span>01 // Company Name</span>
                    <input
                      type="text"
                      name="company_name"
                      autoComplete="organization"
                      placeholder="Enter company or organization"
                      required
                    />
                  </label>
                  <label>
                    <span>02 // Contact Info (Optional)</span>
                    <input
                      type="text"
                      name="contact_info"
                      autoComplete="email"
                      placeholder="Email, LinkedIn, or phone"
                    />
                  </label>
                </>
              )}
            </div>

            <label className="guestbook-feedback">
              <span>
                {`${visitorType === 'visitor' ? '02' : '03'} // Website Feedback`}
              </span>
              <textarea
                name="website_feedback"
                rows="5"
                placeholder="What should be added or improved on this website?"
                required
              />
            </label>

            <div className="guestbook-actions">
              <button
                className="guestbook-submit"
                type="submit"
                disabled={submitState === 'sending'}
              >
                <span>
                  {submitState === 'sending'
                    ? '[ TRANSMITTING... ]'
                    : '[ TRANSMIT DATA ]'}
                </span>
              </button>
              <button
                className="guestbook-skip"
                type="button"
                onClick={handleSkip}
              >
                {submitState === 'sending'
                  ? 'Cancel transmission and continue →'
                  : 'Continue without transmitting →'}
              </button>
            </div>

            <p
              className="guestbook-form-status"
              role="status"
              aria-live="polite"
            >
              {submitState === 'sending' && 'Encrypting feedback payload...'}
              {submitState === 'success' && 'Transmission received. Access granted.'}
              {submitState === 'error' &&
                'Transmission failed. Check your connection or continue without sending.'}
            </p>
          </form>
        </div>
      </section>

      <footer className="guestbook-footer" aria-hidden="true">
        <span>SURACHET_PANTO // PORTFOLIO_GATEWAY</span>
        <span>NONTHABURI // TH</span>
      </footer>
    </main>
  );
}
