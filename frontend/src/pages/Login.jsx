import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginStaff, loginStudentPassword } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { decodeJwtPayload } from '../utils/jwt';
import './Login.css';

const institutions = [
  { id: '1', name: 'Anna University' },
  { id: '2', name: 'XYZ Engineering College' },
  { id: '3', name: 'ABC Polytechnic' },
  { id: '7', name: 'Demo Institution QA' },
];

export default function Login() {
  const [loginMode, setLoginMode] = useState('faculty');
  const [institutionId, setInstitutionId] = useState('1');
  const [institutionQuery, setInstitutionQuery] = useState('Anna University');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const clearLoginError = () => {
    if (error) setError('');
  };

  const filteredInstitutions = useMemo(() => {
    const query = institutionQuery.trim().toLowerCase();
    if (!query) return institutions;
    return institutions.filter((item) => item.name.toLowerCase().includes(query));
  }, [institutionQuery]);

  const isExactInstitutionMatch = useMemo(() => {
    const query = institutionQuery.trim().toLowerCase();
    if (!query) return false;
    return institutions.some((item) => item.name.toLowerCase() === query);
  }, [institutionQuery]);

  useEffect(() => {
    const query = institutionQuery.trim().toLowerCase();
    const exactMatch = institutions.find((item) => item.name.toLowerCase() === query);

    if (exactMatch) {
      setInstitutionId(exactMatch.id);
    }
  }, [institutionQuery]);

  const handleInstitutionSelect = (item) => {
    setInstitutionId(item.id);
    setInstitutionQuery(item.name);
    clearLoginError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const query = institutionQuery.trim().toLowerCase();
      const exactMatch = institutions.find((item) => item.name.toLowerCase() === query);
      const resolvedInstitutionId = exactMatch ? exactMatch.id : institutionId;

      const data = loginMode === 'student'
        ? await loginStudentPassword(Number(resolvedInstitutionId), email, password)
        : await loginStaff(Number(resolvedInstitutionId), email, password);
      login(data.access_token);

      const payload = decodeJwtPayload(data.access_token);
      const role = payload?.role?.toLowerCase();

      if (loginMode === 'student') navigate('/student');
      else if (role === 'super_master') navigate('/super-master');
      else if (role === 'master') navigate('/institution-master');
      else if (role === 'admin') navigate('/admin');
      else if (role === 'hod') navigate('/hod');
      else if (role === 'staff') navigate('/staff');
      else navigate('/student');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === 'Incorrect email or password') {
        setError('Invalid email or password. Please check and try again.');
      } else if (detail === 'Student is not verified for login') {
        setError('Student account is not verified for this institution.');
      } else if (detail === 'Student not found or not yet verified') {
        setError('Student account is not verified yet. Complete OTP verification first.');
      } else if (detail === 'New or unrecognized device — OTP re-verification required') {
        setError('This device is not recognized. Please complete OTP re-verification.');
      } else {
        setError('Login failed. Check institution, email, and password.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">◼</div>
        <h1 className="login-title">University Portal</h1>
        <p className="login-subtitle">
          {loginMode === 'student'
            ? 'Secure student access to attendance dashboard.'
            : 'Secure access for faculty and administration.'}
        </p>

        <div className="mode-switch" role="tablist" aria-label="Login mode">
          <button
            type="button"
            className={`mode-btn ${loginMode === 'faculty' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('faculty');
              clearLoginError();
            }}
          >
            Faculty / Admin
          </button>
          <button
            type="button"
            className={`mode-btn ${loginMode === 'student' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('student');
              clearLoginError();
            }}
          >
            Student
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="institution" className="input-group autocomplete-group">
            <span>Institution</span>
            <div className="autocomplete-wrapper">
              <input
                id="institution"
                value={institutionQuery}
                onChange={(e) => {
                  setInstitutionQuery(e.target.value);
                  setInstitutionId('');
                  clearLoginError();
                }}
                placeholder="Type or select institution"
                autoComplete="off"
              />
              {!isExactInstitutionMatch && filteredInstitutions.length > 0 && (
                <div className="autocomplete-list">
                  {filteredInstitutions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="autocomplete-item"
                      onClick={() => handleInstitutionSelect(item)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>

          <label htmlFor="email" className="input-group">
            <span>Email Address</span>
            <input 
              id="email"
              value={email} 
              onChange={(e) => {
                setEmail(e.target.value);
                clearLoginError();
              }} 
              placeholder="email@university.edu" 
              autoComplete="username" 
            />
          </label>

          <label htmlFor="password" className="input-group">
            <span>Password</span>
            <div className="password-wrapper">
              <input 
                id="password"
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearLoginError();
                }} 
                placeholder="Enter your password" 
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password" 
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◉' : '○'}
              </button>
            </div>
          </label>

          <div className="forgot-password-row">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setShowForgotPassword((prev) => !prev)}
            >
              Forgot password?
            </button>
          </div>

          {showForgotPassword ? (
            <div className="forgot-password-help" role="status">
              <p>Reset access process:</p>
              <p>1. Master/Admin/HOD/Staff: contact your institution admin to reset your account password.</p>
              <p>2. Student accounts: use Student mode and correct institution, or use OTP re-activation via staff dashboard.</p>
            </div>
          ) : null}

          {error && <p className="login-error">{error}</p>}
          <button className="login-button" type="submit">ACCESS CONSOLE</button>
        </form>

        <div className="login-footer">Authenticated entry • Monochrome control interface</div>
      </div>
    </div>
  );
}
