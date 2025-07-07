import './style/ThemeToggle.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon } from '@fortawesome/free-solid-svg-icons';
import { faSun } from '@fortawesome/free-regular-svg-icons';

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
      <span className={`slider ${theme}`}>
        <span className="icon">
          <FontAwesomeIcon icon={theme === 'dark' ? faMoon : faSun} />
        </span>
      </span>
    </label>
  );
}

export default ThemeToggle;
