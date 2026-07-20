import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

export default function DashboardLayout({
  title,
  subtitle,
  userName,
  userRole,
  menuItems,
  sections,
  defaultSection = 'overview',
  onAction,
}) {
  const [activeSection, setActiveSection] = useState(defaultSection);
  const contentPanelRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const activeContent = useMemo(() => {
    return sections.find((section) => section.id === activeSection) || sections[0];
  }, [activeSection, sections]);

  const handleAction = (action) => {
    if (action.targetSection) {
      setActiveSection(action.targetSection);
    }
    onAction?.(action);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const scrollVertical = (direction) => {
    const delta = direction === 'up' ? -300 : 300;
    window.scrollBy({ top: delta, behavior: 'smooth' });
  };

  const scrollHorizontal = (direction) => {
    const delta = direction === 'left' ? -300 : 300;
    const scrollTarget = contentPanelRef.current?.querySelector('.institutions-list');

    if (scrollTarget) {
      scrollTarget.scrollBy({ left: delta, behavior: 'smooth' });
      return;
    }

    window.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand-block">
          <div className="brand-icon">◼</div>
          <div>
            <div className="brand-title">ATTENDANCE</div>
            <div className="brand-subtitle">CONTROL CENTER</div>
          </div>
        </div>

        <div className="nav-heading">Navigation</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
            type="button"
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <button className="menu-item logout" onClick={handleLogout} type="button">
          <span className="menu-icon">⎋</span>
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <div className="eyebrow">{title}</div>
            <h1>{subtitle}</h1>
          </div>
          <div className="profile-pill">
            <div className="avatar">{userName?.charAt(0) || 'U'}</div>
            <div>
              <div className="profile-name">{userName}</div>
              <div className="profile-role">{userRole}</div>
            </div>
          </div>
        </header>

        <section className="stat-grid">
          {activeContent.stats.map((stat) => {
            if (stat.targetSection) {
              return (
                <button
                  key={stat.label}
                  type="button"
                  className="stat-card"
                  onClick={() => setActiveSection(stat.targetSection)}
                >
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </button>
              );
            }

            return (
              <div key={stat.label} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            );
          })}
        </section>

        <section className="content-grid">
          <div className="panel panel-large" ref={contentPanelRef}>
            <div className="panel-heading">
              <div>
                <div className="panel-title">{activeContent.title}</div>
                <div className="panel-subtitle">{activeContent.description}</div>
              </div>
              <div className="panel-pill">{activeContent.badge}</div>
            </div>

            <div className="panel-body">{activeContent.body}</div>
          </div>

          <div className="panel panel-side">
            <div className="panel-heading">
              <div>
                <div className="panel-title">Quick Actions</div>
                <div className="panel-subtitle">Keep the workflow moving</div>
              </div>
            </div>

            <div className="action-list">
              {activeContent.actions.map((action) => (
                <button
                  key={action.label}
                  className="action-btn"
                  type="button"
                  onClick={() => handleAction(action)}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
