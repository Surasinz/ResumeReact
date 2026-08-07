import { useEffect, useRef, useState } from 'react';
import './App.css';
import './CyberPages.css';
import ViewSidebar from './ViewSidebar';
import InternalLink from './InternalLink';
import { LocalizedText, useLanguage } from './LanguageSystem';
import { splitGraphemes } from './graphemes';
import { ROUTES } from './routes';

const impactCategories = [
  {
    nameKey: 'impact_category_database',
    code: 'SYS.DB',
    metrics: [
      {
        target: 85,
        suffix: '%',
        labelKey: 'impact_metric',
        descriptionKey: 'impact_metric_1_desc',
      },
      {
        target: 10000,
        suffix: '+',
        labelKey: 'impact_metric_2',
        descriptionKey: 'impact_metric_2_desc',
      },
      {
        target: 40,
        suffix: '%',
        labelKey: 'impact_metric_3',
        descriptionKey: 'impact_metric_3_desc',
      },
    ],
  },
  {
    nameKey: 'impact_category_workflow',
    code: 'FLOW.AUTO',
    metrics: [
      {
        target: 40,
        suffix: '+',
        labelKey: 'impact_metric_4',
        descriptionKey: 'impact_metric_4_desc',
      },
      {
        target: 99.9,
        suffix: '%',
        decimals: 1,
        labelKey: 'impact_metric_5',
        descriptionKey: 'impact_metric_5_desc',
      },
    ],
  },
  {
    nameKey: 'impact_category_ai',
    code: 'AI.QUANT',
    metrics: [
      {
        target: 24,
        suffix: '/7',
        labelKey: 'impact_metric_6',
        descriptionKey: 'impact_metric_6_desc',
      },
      {
        target: 10,
        suffix: 'x',
        labelKey: 'impact_metric_7',
        descriptionKey: 'impact_metric_7_desc',
      },
    ],
  },
];

const interviewQuestions = [
  {
    id: 'strength',
    questionKey: 'interview_q1',
    answerKey: 'interview_a1',
  },
  {
    id: 'bottlenecks',
    questionKey: 'interview_q2',
    answerKey: 'interview_a2',
  },
  {
    id: 'hire',
    questionKey: 'interview_q3',
    answerKey: 'interview_a3',
  },
];

function CyberHeader({ activePage }) {
  const { language, t } = useLanguage();

  return (
    <header className="cyber-header">
      <InternalLink className="brand" href={ROUTES.home} aria-label="Surachet Panto — home">
        SP<span>.</span>
      </InternalLink>
      <nav aria-label={t('explore_portfolio_views')} lang={language}>
        <InternalLink href={ROUTES.home}><LocalizedText i18nKey="header_portfolio" /></InternalLink>
        <InternalLink
          className={activePage === 'impact' ? 'is-active' : ''}
          href={ROUTES.impact}
          aria-current={activePage === 'impact' ? 'page' : undefined}
        >
          <LocalizedText i18nKey="header_impact" />
        </InternalLink>
        <InternalLink
          className={activePage === 'interview' ? 'is-active' : ''}
          href={ROUTES.interview}
          aria-current={activePage === 'interview' ? 'page' : undefined}
        >
          <LocalizedText i18nKey="header_interview" />
        </InternalLink>
      </nav>
    </header>
  );
}

function AnimatedMetric({ target, suffix, decimals = 0 }) {
  const metricRef = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const element = metricRef.current;
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (
      reducedMotion ||
      typeof window.IntersectionObserver !== 'function'
    ) {
      setValue(target);
      return undefined;
    }

    let animationFrame = null;
    let startedAt = null;

    const animate = (timestamp) => {
      if (startedAt === null) startedAt = timestamp;

      const progress = Math.min((timestamp - startedAt) / 1100, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const precision = 10 ** decimals;
      setValue(
        Math.round(target * easedProgress * precision) / precision
      );

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();
        animationFrame = window.requestAnimationFrame(animate);
      },
      { threshold: 0.35 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [decimals, target]);

  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <strong className="impact-metric" ref={metricRef}>
      <span aria-hidden="true">
        {formattedValue}
        <em>{suffix}</em>
      </span>
      <span className="sr-only">
        {target.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </span>
    </strong>
  );
}

function CyberPageIntro({ index, eyebrowKey, titleKey, descriptionKey }) {
  return (
    <section className="cyber-intro">
      <div className="cyber-intro-code" aria-hidden="true">
        {`VIEW_${index} // ONLINE`}
      </div>
      <LocalizedText as="p" i18nKey={eyebrowKey} />
      <LocalizedText as="h1" i18nKey={titleKey} />
      <div className="cyber-intro-bottom">
        <LocalizedText as="p" i18nKey={descriptionKey} />
        <span>NONTHABURI // TH</span>
      </div>
    </section>
  );
}

export function ImpactPage() {
  const { language, t } = useLanguage();

  return (
    <div className="cyber-page">
      <CyberHeader activePage="impact" />
      <ViewSidebar currentPage="impact" />
      <main>
        <CyberPageIntro
          index="01"
          eyebrowKey="impact_eyebrow"
          titleKey="impact_title"
          descriptionKey="impact_desc"
        />

        <section
          className="impact-dashboard"
          aria-label={t('impact_eyebrow')}
          lang={language}
        >
          {impactCategories.map((category, categoryIndex) => (
            <section className="impact-category" key={category.nameKey}>
              <header>
                <span>{String(categoryIndex + 1).padStart(2, '0')}</span>
                <div>
                  <p>{category.code}</p>
                  <LocalizedText as="h2" i18nKey={category.nameKey} />
                </div>
              </header>
              <div className="impact-grid">
                {category.metrics.map((metric) => (
                  <article className="impact-card" key={metric.labelKey}>
                    <span className="impact-card-scan" aria-hidden="true" />
                    <AnimatedMetric
                      target={metric.target}
                      suffix={metric.suffix}
                      decimals={metric.decimals}
                    />
                    <LocalizedText as="h3" i18nKey={metric.labelKey} />
                    <LocalizedText as="p" i18nKey={metric.descriptionKey} />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <InternalLink className="cyber-next-view" href={ROUTES.interview}>
          <LocalizedText i18nKey="next_interface" />
          <LocalizedText i18nKey="sidebar_interview" /> <b aria-hidden="true">→</b>
        </InternalLink>
      </main>
      <CyberFooter />
    </div>
  );
}

export function InterviewPage() {
  const { language, t } = useLanguage();
  const [selectedId, setSelectedId] = useState(null);
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const selectedQuestion = interviewQuestions.find(
    (item) => item.id === selectedId
  );
  const selectedAnswer = selectedQuestion ? t(selectedQuestion.answerKey) : '';

  useEffect(() => {
    if (!selectedQuestion) return undefined;

    const answer = selectedAnswer;
    const answerGraphemes = splitGraphemes(answer, language);
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    setDisplayedAnswer('');

    if (reducedMotion) {
      setDisplayedAnswer(answer);
      setIsTyping(false);
      return undefined;
    }

    let characterIndex = 0;
    let typeTimer = null;
    setIsTyping(true);

    const typeNextCharacter = () => {
      characterIndex += 1;
      setDisplayedAnswer(answerGraphemes.slice(0, characterIndex).join(''));

      if (characterIndex < answerGraphemes.length) {
        typeTimer = window.setTimeout(typeNextCharacter, 16);
      } else {
        setIsTyping(false);
      }
    };

    typeTimer = window.setTimeout(typeNextCharacter, 120);

    return () => {
      window.clearTimeout(typeTimer);
    };
  }, [language, selectedAnswer, selectedQuestion]);

  return (
    <div className="cyber-page">
      <CyberHeader activePage="interview" />
      <ViewSidebar currentPage="interview" />
      <main>
        <CyberPageIntro
          index="02"
          eyebrowKey="interview_eyebrow"
          titleKey="interview_title"
          descriptionKey="interview_desc"
        />

        <section className="interview-terminal" aria-labelledby="terminal-title">
          <header className="terminal-bar">
            <div aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p id="terminal-title">surachet@enterprise-builder:~/interview</p>
            <span>SECURE SESSION</span>
          </header>

          <div className="terminal-layout">
            <aside
              className="terminal-prompts"
              aria-label={t('interview_eyebrow')}
              lang={language}
            >
              <p>AVAILABLE_PROMPTS</p>
              {interviewQuestions.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={selectedId === item.id ? 'is-selected' : ''}
                  aria-pressed={selectedId === item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <LocalizedText i18nKey={item.questionKey} />
                </button>
              ))}
            </aside>

            <div className="terminal-output">
              <div className="terminal-command">
                <span>builder@surachet:~$</span>{' '}
                {selectedQuestion
                  ? `answer --prompt="${selectedQuestion.id}"`
                  : 'awaiting_prompt --interactive'}
              </div>
              <div
                className="terminal-answer"
                aria-busy={isTyping}
                data-empty={!selectedQuestion}
              >
                <span aria-hidden="true">
                  <LocalizedText>
                    {selectedQuestion ? displayedAnswer : t('choose_question')}
                  </LocalizedText>
                  <i className="terminal-cursor" />
                </span>
                <LocalizedText
                  as="span"
                  className="sr-only"
                  role="status"
                  aria-live="polite"
                >
                  {selectedQuestion
                    ? isTyping
                      ? `${t('generating_answer')} ${t(selectedQuestion.questionKey)}`
                      : selectedAnswer
                    : t('choose_interview')}
                </LocalizedText>
              </div>
              <div className="terminal-status" aria-hidden="true">
                <span>STATUS: {isTyping ? 'TRANSMITTING' : 'READY'}</span>
                <span>LATENCY: 016MS</span>
                <span>ENCRYPTION: ACTIVE</span>
              </div>
            </div>
          </div>
        </section>

        <InternalLink className="cyber-next-view" href={ROUTES.impact}>
          <LocalizedText i18nKey="inspect_data" />
          <LocalizedText i18nKey="return_impact" /> <b aria-hidden="true">←</b>
        </InternalLink>
      </main>
      <CyberFooter />
    </div>
  );
}

function CyberFooter() {
  return (
    <footer className="cyber-footer">
      <InternalLink className="brand" href={ROUTES.home}>
        SP<span>.</span>
      </InternalLink>
      <p>Enterprise Builder // Surachet Panto</p>
      <a href="mailto:surachetpan@hotmail.com">
        <LocalizedText i18nKey="initialize_contact" /> ↗
      </a>
    </footer>
  );
}
