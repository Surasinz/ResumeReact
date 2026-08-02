import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ComponentDocsPage, {
  COMPONENTS,
  PRISM_SCRIPTS,
  PRISM_STYLES,
} from './ComponentDocsPage';
import { LanguageProvider, LanguageToggle } from './LanguageSystem';

// These two previews mount real renderers (WebGL / three.js), which jsdom
// cannot provide and which would fetch a 5MB .glb on import.
jest.mock('./HelmetViewer', () => () => <div data-testid="helmet-viewer-mock" />);
jest.mock('./PixelLiquidBackground', () => () => (
  <div data-testid="pixel-liquid-mock" />
));

beforeEach(() => {
  window.history.replaceState({}, '', '/components');
  window.Prism = {
    highlightAllUnder: jest.fn(),
    plugins: {
      toolbar: {},
      lineNumbers: {},
      copyToClipboard: true,
    },
    languages: {
      javascript: {},
    },
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
});

afterEach(() => {
  document
    .querySelectorAll('[data-prism-docs="true"]')
    .forEach((element) => element.remove());
  window.history.replaceState({}, '', '/');
  delete window.Prism;
});

test('renders component navigation, preview, prompt, and Prism-ready code', async () => {
  render(<ComponentDocsPage />);

  expect(
    screen.getByRole('heading', { name: 'Component Documentation' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Component documentation' })
  ).toBeInTheDocument();
  expect(screen.getByText('Mouse Spotlight Reveal')).toBeInTheDocument();
  expect(screen.getByText('AI Prompt')).toBeInTheDocument();

  const codeBlocks = document.querySelectorAll('pre.line-numbers code');
  expect(codeBlocks).toHaveLength(3);
  expect(codeBlocks[0]).toHaveClass('line-numbers', 'language-html');
  expect(codeBlocks[1]).toHaveClass('line-numbers', 'language-css');
  expect(codeBlocks[2]).toHaveClass('line-numbers', 'language-javascript');
  expect(PRISM_STYLES).toHaveLength(3);
  expect(PRISM_SCRIPTS).toHaveLength(8);
  expect(
    PRISM_STYLES.every((asset) => asset.integrity.startsWith('sha384-'))
  ).toBe(true);
  expect(
    PRISM_SCRIPTS.every((asset) => asset.integrity.startsWith('sha384-'))
  ).toBe(true);
  await waitFor(() => {
    expect(window.Prism.highlightAllUnder).toHaveBeenCalled();
  });
});

test('tracks the spotlight and switches documented components', () => {
  render(<ComponentDocsPage />);
  const spotlight = screen.getByTestId('docs-spotlight');
  jest.spyOn(spotlight, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 50,
    width: 400,
    height: 400,
    right: 500,
    bottom: 450,
    x: 100,
    y: 50,
    toJSON: () => {},
  });

  fireEvent(
    spotlight,
    new MouseEvent('pointermove', {
      bubbles: true,
      clientX: 300,
      clientY: 150,
    })
  );
  expect(spotlight).toHaveClass('is-active');
  expect(spotlight.style.getPropertyValue('--docs-spotlight-x')).toBe('200px');
  expect(spotlight.style.getPropertyValue('--docs-spotlight-y')).toBe('100px');

  fireEvent.pointerLeave(spotlight);
  expect(spotlight).not.toHaveClass('is-active');
  fireEvent.click(spotlight);
  expect(spotlight).toHaveAttribute('aria-pressed', 'true');
  expect(spotlight).toHaveClass('is-pinned');

  const navigation = screen.getByRole('navigation', {
    name: 'Component documentation',
  });
  fireEvent.click(
    within(navigation).getByRole('link', { name: 'Terminal Form' })
  );
  expect(
    screen.getByRole('heading', { name: 'Terminal Feedback Form' })
  ).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
});

test('opens and closes the mobile component menu', async () => {
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  render(<ComponentDocsPage />);
  const toggle = screen.getByRole('button', {
    name: 'Toggle component navigation',
  });
  const sidebar = document.querySelector('.docs-sidebar');

  expect(sidebar).toHaveAttribute('inert');
  expect(sidebar).toHaveAttribute('aria-hidden', 'true');

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(sidebar).toHaveClass('is-open');
  expect(sidebar).not.toHaveAttribute('inert');
  expect(
    screen.getByRole('link', { name: 'Spotlight Avatar' })
  ).toHaveFocus();

  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    expect(sidebar).toHaveAttribute('inert');
  });
});

test('documents every configured component', () => {
  expect(COMPONENTS.map((component) => component.id)).toEqual([
    'spotlight-avatar',
    'terminal-form',
    'liquid-background',
    'custom-cursor',
    'web-shimeji',
    'helmet-model',
  ]);

  // Every entry has to be fully wired or it renders a blank doc: a preview,
  // an index that matches its position, and at least one code snippet.
  COMPONENTS.forEach((component, position) => {
    expect(component.index).toBe(String(position + 1).padStart(2, '0'));
    expect(component.code.length).toBeGreaterThan(0);
    expect(component.titleKey).toBeTruthy();
    expect(component.shortTitleKey).toBeTruthy();
    expect(component.descriptionKey).toBeTruthy();
    expect(component.promptKey).toBeTruthy();
  });
});

test('renders a preview and translated copy for every documented component', () => {
  const { container } = render(
    <LanguageProvider>
      <ComponentDocsPage />
    </LanguageProvider>
  );
  const navigation = screen.getByRole('navigation', {
    name: 'Component documentation',
  });

  COMPONENTS.forEach((component) => {
    fireEvent.click(
      within(navigation).getByRole('link', { name: component.shortTitle })
    );
    expect(
      screen.getByRole('heading', { name: component.title })
    ).toBeInTheDocument();
    // A missing translation key would surface as the raw key on screen.
    expect(container.textContent).not.toContain('docs_');
    expect(container.querySelector('.preview-box')?.children.length).toBe(1);
  });
});

test('refreshes the Prism copy toolbar label after switching language', async () => {
  window.Prism.highlightAllUnder.mockImplementation((root) => {
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('code-toolbar')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-toolbar';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar';
      const button = document.createElement('button');
      button.className = 'copy-to-clipboard-button';
      const label = document.createElement('span');
      label.textContent = pre.dataset.prismjsCopy;
      const successLabel = pre.dataset.prismjsCopySuccess;
      button.addEventListener('click', () => {
        label.textContent = successLabel;
      });
      button.appendChild(label);
      toolbar.appendChild(button);
      wrapper.appendChild(toolbar);
    });
  });

  render(
    <LanguageProvider>
      <LanguageToggle />
      <ComponentDocsPage />
    </LanguageProvider>
  );
  await waitFor(() => {
    expect(window.Prism.highlightAllUnder).toHaveBeenCalledTimes(1);
  });
  const englishButton = document.querySelector('.copy-to-clipboard-button');
  expect(englishButton).toHaveTextContent('Copy');

  fireEvent.click(screen.getByRole('button', { name: 'Use Thai' }));

  await waitFor(() => {
    expect(window.Prism.highlightAllUnder).toHaveBeenCalledTimes(2);
  });
  expect(document.body.contains(englishButton)).toBe(false);

  const thaiButton = document.querySelector('.copy-to-clipboard-button');
  expect(thaiButton).toHaveTextContent('คัดลอก');
  fireEvent.click(thaiButton);
  expect(thaiButton).toHaveTextContent('คัดลอกแล้ว! ✅');
});
