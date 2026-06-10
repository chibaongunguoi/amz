import React from 'react'
import { useDispatch } from 'react-redux'
import { login } from '../../store/slices/authSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import AMZLogo from '../../assets/amzLogo.jpg'
import OptimizedImage from '@/components/common/OptimizedImage'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const nextPath = params.get('next') || '/admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')
    
    try {
      await dispatch(login(email, password))
      navigate(nextPath.startsWith('/') ? nextPath : '/admin', { replace: true })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="amz-login-page">
      <div className="amz-login-shell">
        <div className="amz-login-card">
          <div className="amz-login-brand">
            <OptimizedImage src={AMZLogo} alt="AMZTECH" width={80} height={80} sizes="80px" className="amz-login-logo" />
            <div>
              <p>Khu vực quản trị</p>
              <h1>AMZTECH Admin</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="amz-login-form">
            <div>
              <label>Tài khoản</label>
              <input
                type="text"
                name="email"
                required
                autoComplete="username"
                placeholder="admin@amztech.vn"
              />
            </div>

            <div>
              <label>Mật khẩu</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button
              type="submit"
              className="amz-login-submit"
            >
              Đăng nhập
            </button>
          </form>

          <a className="amz-login-back" href="/">
            Quay lại website
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
