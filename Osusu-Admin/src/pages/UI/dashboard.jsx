import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import supabase from '@/lib/supabase';
import UsersPage from './Views/users';
import GroupView from './Views/Group/groupView';
import PaymentsView from './Views/Payments/paymentsView';
import Overview from './Views/AdminOverview/overview';
import { AdminView } from './Views/Admin';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, 
  Users, 
  UserPlus, 
  CreditCard, 
  Settings, 
  LogOut,
  Shield,
  Menu,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleLogout = () => {
    navigate('/login');
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview userRole={role}/>;
      case 'users':
        return <UsersPage/>;
      case 'group':
        return <GroupView/>;
      case 'payments':
        return <PaymentsView/>;
      case 'admin':
        return <AdminView/>;
      case 'settings':
        return <div>Settings content goes here.</div>;
      default:
        return null;
    }
  };

  return (
    <div className='w-full h-full sm:h-screen flex relative'>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-grey-300 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-50
        w-64 lg:w-[20%] bg-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className='p-4 lg:p-6 border-b'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 lg:w-10 lg:h-10 bg-green-600 rounded-lg flex items-center justify-center'>
                <Home className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <div>
                <h1 className='text-lg lg:text-2xl font-bold text-gray-900'>Choco Osusu</h1>
                <p className='text-xs lg:text-sm text-muted-foreground hidden sm:block'>Your money is safe with us...</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Header */}
        <div className='p-4'>
          <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
            Navigation
          </h3>
        </div>

        {/* Navigation Items */}
        <div className='flex flex-col gap-1 px-4 flex-1'>
          <Button
            variant={activeSection === 'overview' ? 'default' : 'ghost'}
            onClick={() => handleSectionChange('overview')}
            className={`justify-start gap-2 h-10 ${activeSection === 'overview' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
          >
            <Home className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Button>
          <Button
            variant={activeSection === 'users' ? 'default' : 'ghost'}
            onClick={() => handleSectionChange('users')}
            className={`justify-start gap-2 h-10 ${activeSection === 'users' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm">Users</span>
          </Button>
          <Button
            variant={activeSection === 'group' ? 'default' : 'ghost'}
            onClick={() => handleSectionChange('group')}
            className={`justify-start gap-2 h-10 ${activeSection === 'group' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
          >
            <UserPlus className="h-4 w-4" />
            <span className="text-sm">Create Group</span>
          </Button>
          <Button
            variant={activeSection === 'payments' ? 'default' : 'ghost'}
            onClick={() => handleSectionChange('payments')}
            className={`justify-start gap-2 h-10 ${activeSection === 'payments' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">Payments</span>
          </Button>
          <Button
            variant={activeSection === 'admin' ? 'default' : 'ghost'}
            onClick={() => handleSectionChange('admin')}
            className={`justify-start gap-2 h-10 ${activeSection === 'admin' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm">Admin Management</span>
          </Button>
          <Button
            variant={activeSection === 'settings' ? 'default' : 'ghost'}
            onClick={() => handleSectionChange('settings')}
            className={`justify-start gap-2 h-10 ${activeSection === 'settings' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </Button>
        </div>
        
        {/* User Profile */}
        <div className='mt-auto p-4 border-t'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-600 text-white font-medium">
                    A
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className='text-sm font-medium'>Admin User</p>
                  <p className='text-xs text-muted-foreground'>{role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Main Content */}
      <div className='flex-1 lg:w-[80%] bg-[#F5F6FA] flex flex-col h-screen'>
        {/* Top Header */}
        <div className='h-14 lg:h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6'>
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-base lg:text-lg font-semibold">
            {activeSection === 'overview' && 'Dashboard Overview'}
            {activeSection === 'users' && 'User Management'}
            {activeSection === 'group' && 'Group Management'}
            {activeSection === 'payments' && 'Payment Management'}
            {activeSection === 'admin' && 'Admin Management'}
            {activeSection === 'settings' && 'Settings'}
          </h1>
          
          {/* Mobile user avatar */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-600 text-white font-medium text-xs">
                      A
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="px-2 py-1.5">
                  <p className='text-sm font-medium'>Admin User</p>
                  <p className='text-xs text-muted-foreground'>{role}</p>
                </div>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Content Area */}
        <div className='flex-1 overflow-y-auto p-3 lg:p-4'>
          {renderSection()}
        </div>
      </div>
    </div>
  )
}

export default Dashboard