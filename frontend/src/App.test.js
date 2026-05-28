import { render } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => {
  const mock = require('./react-router-dom-mock');
  return mock;
});


test('app renders without crashing', () => {
  render(<App />);
});


