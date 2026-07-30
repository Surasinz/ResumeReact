import { useEffect, useRef, useState } from 'react';
import './App.css';
import './CyberPages.css';
import ViewSidebar from './ViewSidebar';
import { useLanguage } from './LanguageSystem';

const impactCategories = [
  {
    name: 'Enterprise System & Database Optimization',
    code: 'SYS.DB',
    metrics: [
      {
        target: 85,
        suffix: '%',
        label: 'Reduced Processing Time',
        description:
          'Optimized database scripts and targeted CUTOFF_FOR_EBOOK_DATE conditions to eliminate full-month scans, significantly reducing server load.',
      },
      {
        target: 10000,
        suffix: '+',
        label: 'Records Secured Daily',
        description:
          'Built a secure data pipeline using JSON parsing inside Database Triggers and secure token architecture.',
      },
      {
        target: 40,
        suffix: '%',
        label: 'Faster UI Load Time',
        description:
          'Enhanced front-end behaviors and Oracle APEX Interactive Grids for seamless enterprise data querying.',
      },
    ],
  },
  {
    name: 'Workflow Automation & Integration',
    code: 'FLOW.AUTO',
    metrics: [
      {
        target: 40,
        suffix: '+',
        label: 'Manual Hours Saved/Month',
        description:
          'Developed custom Automated Notification Scripts via Google Apps Script to eliminate repetitive tasks.',
      },
      {
        target: 99.9,
        suffix: '%',
        decimals: 1,
        label: 'Real-time Payload Accuracy',
        description:
          'Engineered zero-delay parameter extraction from Calendar Events to external communication channels.',
      },
    ],
  },
  {
    name: 'AI-Powered & Quantitative Architecture',
    code: 'AI.QUANT',
    metrics: [
      {
        target: 24,
        suffix: '/7',
        label: 'Automated Trading',
        description:
          "Set up the 'QuantAgent' script environment overcoming execution policy blocks via Python virtual environments.",
      },
      {
        target: 10,
        suffix: 'x',
        label: 'Faster Trend Analysis',
        description:
          'Integrated Gemini API and LangChain frameworks to rapidly generate market insights.',
      },
    ],
  },
];

const interviewQuestions = [
  {
    id: 'strength',
    question: 'What is your core strength?',
    answer:
      'I specialize in bridging the gap between complex backend systems and user-friendly enterprise interfaces. I focus on deep database optimization, workflow automation, and creating secure data pipelines.',
  },
  {
    id: 'bottlenecks',
    question: 'How do you handle system bottlenecks?',
    answer:
      'I analyze the data flow and pinpoint redundant queries. For example, I implemented targeted processing with specific date cutoffs instead of full-month data sweeps, which reduced processing time by up to 85%.',
  },
  {
    id: 'hire',
    question: 'Why should we hire you?',
    answer:
      "I don't just write code; I build automated, scalable architectures. Whether it's managing Oracle APEX, deploying Google Apps Script for cross-channel syncs, or integrating LLM APIs for data analysis, I deliver direct business impact.",
  },
];

function CyberHeader({ activePage }) {
  return (
    <header className="cyber-header">
      <a className="brand" href="/" aria-label="Surachet Panto — home">
        SP<span>.</span>
      </a>
      <nav aria-label="Portfolio views">
        <a href="/">Portfolio</a>
        <a
          className={activePage === 'impact' ? 'is-active' : ''}
          href="/impact"
          aria-current={activePage === 'impact' ? 'page' : undefined}
        >
          Impact
        </a>
        <a
          className={activePage === 'interview' ? 'is-active' : ''}
          href="/interview-me"
          aria-current={activePage === 'interview' ? 'page' : undefined}
        >
          Interview me
        </a>
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

function CyberPageIntro({ index, eyebrow, title, description }) {
  return (
    <section className="cyber-intro">
      <div className="cyber-intro-code" aria-hidden="true">
        {`VIEW_${index} // ONLINE`}
      </div>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <div className="cyber-intro-bottom">
        <p>{description}</p>
        <span>NONTHABURI // TH</span>
      </div>
    </section>
  );
}

export function ImpactPage() {
  const { language, t } = useLanguage();
  useEffect(() => {
    document.title = 'Impact Dashboard — Surachet Panto';
  }, []);

  return (
    <div className="cyber-page">
      <CyberHeader activePage="impact" />
      <ViewSidebar currentPage="impact" />
      <main>
        <CyberPageIntro
          index="01"
          eyebrow="Measured outcomes"
          title="Impact Dashboard"
          description="A data-driven view of the systems, automations, and intelligent workflows I build to create measurable enterprise value."
        />

        <section className="impact-dashboard" aria-label="Engineering impact metrics">
          {impactCategories.map((category, categoryIndex) => (
            <section className="impact-category" key={category.name}>
              <header>
                <span>{String(categoryIndex + 1).padStart(2, '0')}</span>
                <div>
                  <p>{category.code}</p>
                  <h2>{category.name}</h2>
                </div>
              </header>
              <div className="impact-grid">
                {category.metrics.map((metric, metricIndex) => (
                  <article className="impact-card" key={metric.label}>
                    <span className="impact-card-scan" aria-hidden="true" />
                    <AnimatedMetric
                      target={metric.target}
                      suffix={metric.suffix}
                      decimals={metric.decimals}
                    />
                    <h3
                      lang={
                        categoryIndex === 0 && metricIndex === 0
                          ? language
                          : undefined
                      }
                      data-i18n={
                        categoryIndex === 0 && metricIndex === 0
                          ? 'impact_metric'
                          : undefined
                      }
                    >
                      {categoryIndex === 0 && metricIndex === 0
                        ? t('impact_metric')
                        : metric.label}
                    </h3>
                    <p>{metric.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <a className="cyber-next-view" href="/interview-me">
          <span>Next interface</span>
          Interactive Interview Terminal <b aria-hidden="true">→</b>
        </a>
      </main>
      <CyberFooter />
    </div>
  );
}

export function InterviewPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const selectedQuestion = interviewQuestions.find(
    (item) => item.id === selectedId
  );

  useEffect(() => {
    document.title = 'Interview Terminal — Surachet Panto';
  }, []);

  useEffect(() => {
    if (!selectedQuestion) return undefined;

    const answer = selectedQuestion.answer;
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
      setDisplayedAnswer(answer.slice(0, characterIndex));

      if (characterIndex < answer.length) {
        typeTimer = window.setTimeout(typeNextCharacter, 16);
      } else {
        setIsTyping(false);
      }
    };

    typeTimer = window.setTimeout(typeNextCharacter, 120);

    return () => {
      window.clearTimeout(typeTimer);
    };
  }, [selectedQuestion]);

  return (
    <div className="cyber-page">
      <CyberHeader activePage="interview" />
      <ViewSidebar currentPage="interview" />
      <main>
        <CyberPageIntro
          index="02"
          eyebrow="Ask the builder"
          title="Interview Terminal"
          description="Select a prompt to inspect how I approach enterprise engineering, bottlenecks, automation, and measurable delivery."
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
            <aside className="terminal-prompts" aria-label="Interview questions">
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
                  {item.question}
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
                  {selectedQuestion
                    ? displayedAnswer
                    : 'Choose a question from the prompt directory to begin.'}
                  <i className="terminal-cursor" />
                </span>
                <span className="sr-only" role="status" aria-live="polite">
                  {selectedQuestion
                    ? isTyping
                      ? `Generating answer for ${selectedQuestion.question}`
                      : selectedQuestion.answer
                    : 'Choose an interview question to begin.'}
                </span>
              </div>
              <div className="terminal-status" aria-hidden="true">
                <span>STATUS: {isTyping ? 'TRANSMITTING' : 'READY'}</span>
                <span>LATENCY: 016MS</span>
                <span>ENCRYPTION: ACTIVE</span>
              </div>
            </div>
          </div>
        </section>

        <a className="cyber-next-view" href="/impact">
          <span>Inspect the data</span>
          Return to Impact Dashboard <b aria-hidden="true">←</b>
        </a>
      </main>
      <CyberFooter />
    </div>
  );
}

function CyberFooter() {
  return (
    <footer className="cyber-footer">
      <a className="brand" href="/">
        SP<span>.</span>
      </a>
      <p>Enterprise Builder // Surachet Panto</p>
      <a href="mailto:surachetpan@hotmail.com">Initialize contact ↗</a>
    </footer>
  );
}
