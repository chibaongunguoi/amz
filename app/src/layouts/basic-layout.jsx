import React from 'react'
import Header from '../components/features/Header'
import Footer from '../components/features/Footer'
import FloatButtonPage from '../components/features/FloatButtonPage'

function BasicLayout({ children }) {
  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#F3F3F3'
        }}
      >
        <Header />
      </div>
      <div className="max-w-[1400px] mx-auto px-2 md:px-3 lg:px-0">
        {children}
        <Footer />
      </div>
      <FloatButtonPage />
    </div>
  )
}

export default BasicLayout