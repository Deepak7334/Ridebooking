import React from 'react';

export const BrowserRouter = ({ children }) => <>{children}</>;
export const Routes = () => null;
export const Route = () => null;
export const Navigate = () => null;
export const Link = ({ children, ...props }) => <a {...props}>{children}</a>;
export const useNavigate = () => () => {};
export const useLocation = () => ({ pathname: '/', state: null });
export const useParams = () => ({});
