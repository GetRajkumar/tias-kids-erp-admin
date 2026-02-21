import { useState } from 'react';
import { Bell, LogOut, User, Menu, KeyRound, Building2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../contexts/TenantContext';
import { AppDispatch } from '../../store';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { toast } from '../ui/toast';
import { authApi } from '../../services/api';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { adminTenants, adminSelectedTenantId, setAdminSelectedTenantId } = useTenant();

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const resetPwdForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdError('');
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (!currentPassword) { setPwdError('Enter current password'); return; }
    if (newPassword.length < 6) { setPwdError('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Passwords do not match'); return; }
    try {
      setChangingPwd(true);
      await authApi.changePassword(currentPassword, newPassword);
      toast({ title: 'Password changed successfully', status: 'success' });
      setShowChangePwd(false);
      resetPwdForm();
    } catch (e: any) {
      setPwdError(e.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPwd(false);
    }
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 lg:left-64">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold text-gray-700">
            Admin Portal
          </span>
          {isSuperAdmin && adminTenants.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <Building2 className="h-4 w-4 text-gray-400 hidden sm:block" />
              <select
                value={adminSelectedTenantId}
                onChange={(e) => setAdminSelectedTenantId(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[220px]"
              >
                <option value="">-- Select School --</option>
                {adminTenants.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} {!t.isActive ? ' [Inactive]' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 focus:outline-none">
                <Avatar name={fullName} size="sm" />
                <span className="hidden text-sm font-medium text-gray-700 sm:inline-block">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setShowChangePwd(true); resetPwdForm(); }}>
                <KeyRound className="h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Modal
        open={showChangePwd}
        onOpenChange={(open) => { setShowChangePwd(open); if (!open) resetPwdForm(); }}
        title="Change Password"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowChangePwd(false)}>
              Cancel
            </Button>
            <Button loading={changingPwd} onClick={handleChangePassword}>
              Change Password
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {pwdError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pwdError}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
};
