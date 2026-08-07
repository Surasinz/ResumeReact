// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// React Router's request helpers use the browser encoding APIs. JSDOM in
// react-scripts 5 does not expose them, so mirror the Node implementations.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
window.scrollTo = jest.fn();
