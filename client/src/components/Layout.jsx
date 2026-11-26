import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BedDouble, CalendarCheck, LayoutDashboard, LogOut, Search, Users } from 'lucide-react';
import { useAuth } from '../auth';
import { Avatar } from './ui';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/guests', label: 'Guests', icon: Users },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onSearch = (e) => {
    setQuery(e.target.value);
    // Searching from the dashboard jumps to the page that lists the results
    if (pathname === '/' && e.target.value) navigate('/bookings');
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="logo" aria-label="Haveli">H</div>
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setQuery('')}
              className={({ isActive }) => (isActive ? 'on' : '')}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <label className="search">
            <Search size={18} />
            <input value={query} onChange={onSearch} placeholder="Search guests, rooms or bookings" aria-label="Search" />
          </label>
          <div className="user-chip">
            <Avatar name={user.name} />
            <div className="who">
              <b>{user.name}</b>
              <span>{user.role === 'admin' ? 'Admin' : 'Receptionist'}</span>
            </div>
            <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="page"><Outlet context={{ query: query.trim().toLowerCase() }} /></main>
      </div>
    </div>
  );
}
