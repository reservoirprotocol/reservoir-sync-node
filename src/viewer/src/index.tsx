import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Chart, registerables } from 'chart.js';
import { SWRConfig } from 'swr';
Chart.register(...registerables);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <SWRConfig
      value={{
        fetcher: (resource, init) => {
          const authorizationPassword =
            window.localStorage.getItem('authorization');
          const options = init ?? {};
          if (!options.headers) {
            options.headers = {};
          }
          options.withCredentials = true;
          options.credentials = 'include';
          options.headers['Authorization'] = authorizationPassword;
          options.referrerPolicy = 'origin';
          return fetch(resource, options).then((res) => res.json());
        },
      }}
    >
      <App />
    </SWRConfig>
  </React.StrictMode>
);
