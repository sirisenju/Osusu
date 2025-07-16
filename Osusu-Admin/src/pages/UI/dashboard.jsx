import React, { useState, useEffect } from 'react'
import Header from '../../components/header'
import { useNavigate, useLocation } from 'react-router-dom'
import supabase from '@/lib/supabase';
import UsersPage from './Views/users';
import GroupView from './Views/Group/groupView';
import { Button } from '@/components/ui/button';
import Overview from './Views/AdminOverview/overview';

const sidebarItems = [
  { key: 'overview', label: 'Home' },
  { key: 'users', label: 'Users' },
  { key: 'group', label: 'Create Group' },
  { key: 'settings', label: 'Settings' },
];

function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'admin'; // fallback if not provided

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview userRole={role}/>;
      case 'users':
        return <UsersPage/>;
      case 'group':
        return <GroupView/>;
      case 'settings':
        return <div>Settings content goes here.</div>;
      default:
        return null;
    }
  };

  // Calculate main area width based on sidebar state
  const mainAreaWidth = showRightSidebar ? 'w-[60%]' : 'w-[80%]';

  return (
    <div className='w-full h-screen flex'>
      <div className='w-[20%] bg-[#FFFFFF] flex flex-col'>
        <div className='p-4'>
          <h1 className='text-3xl font-medium'>Choco Osusu</h1>
          <p>Your money is safe with us...</p>
        </div>

        <p className='text-[15px] font-light'>Overview</p>
        <div className='flex flex-col gap-2 px-4'>
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`text-left py-2 px-3 rounded transition-colors font-medium ${activeSection === item.key ? 'bg-green-600 text-white' : 'hover:bg-green-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`${mainAreaWidth} bg-[#F5F6FA]`}>
        <Header onToggleSidebar={() => setShowRightSidebar(v => !v)} />
        <div className='p-4'>
          {renderSection()}
        </div>
      </div>
      {showRightSidebar && (
        <div className='w-[20%] bg-purple-600'>
          side bar
        </div>
      )}
    </div>
  )
}

export default Dashboard