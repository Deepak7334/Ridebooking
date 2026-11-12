jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Polyline: () => null,
  useMap: () => ({ flyTo: () => {}, fitBounds: () => {} }),
}), { virtual: true });

jest.mock('react-router-dom', () => require('./react-router-dom-mock'), { virtual: true });

import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('app renders without crashing', () => {
  render(<App />);
});
