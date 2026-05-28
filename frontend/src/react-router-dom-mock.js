// Jest mock for react-router-dom.
// CRA/Jest in this repo is failing to resolve ESM builds of react-router-dom v7.
// This lightweight mock keeps unit tests from crashing; it is not used in dev/build.

module.exports = {
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element || null,
  Navigate: ({ to }) => null,
  useNavigate: () => () => {},
  useLocation: () => ({ pathname: '/' }),
};

