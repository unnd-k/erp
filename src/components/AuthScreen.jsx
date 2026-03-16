import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    setLoading(true); setError(''); setSuccess('')
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return setError(error.message.includes('Invalid login') ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error.message)
        onLogin(data.user)
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) return setError(error.message)
        setSuccess('가입 완료! 바로 로그인해보세요.')
        setIsLogin(true)
      }
    } catch { setError('오류가 발생했습니다. 다시 시도해주세요.') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <img src="https://unnd.kr/img/unnd_logo.svg" alt="unnd" />
          <span>Studio Unnamed</span>
        </div>
        <div className="auth-title">{isLogin ? '로그인' : '회원가입'}</div>
        <div className="auth-sub">{isLogin ? '프로젝트 관리 앱에 오신 것을 환영합니다' : '새 계정을 만들어주세요'}</div>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <div className="input-group">
          <label>이메일</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 입력" />
        </div>
        <div className="input-group">
          <label>비밀번호</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 입력" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? (isLogin ? '로그인 중...' : '가입 중...') : (isLogin ? '로그인' : '회원가입')}
        </button>
        <div className="auth-toggle">
          {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}>
            {isLogin ? '회원가입' : '로그인'}
          </span>
        </div>
      </div>
    </div>
  )
}
