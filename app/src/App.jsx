import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';

import { ScrollToTop } from './components/common';
import AppRoute from './configs/router';
import { DataProvider } from './providers/DataProvider';

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {AppRoute.map((route, index) => {
          const Layout = route.layout || React.Fragment;
          const Page = route.page;
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <Layout>
                  <Page />
                </Layout>
              }
            />
          );
        })}
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </Router>
  );
}

export default App;
