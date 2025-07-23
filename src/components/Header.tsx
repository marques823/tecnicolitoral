import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  LogOut, 
  Ticket, 
  User,
  Shield
} from 'lucide-react';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <header className="bg-background border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">TicketFlow</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/create-super-admin')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Criar Admin
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background border-b border-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Ticket className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">TicketFlow</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4" />
            <span>{profile?.name || user.email}</span>
            <span className="text-muted-foreground">
              ({profile?.role === 'master' ? 'Master' : 
                profile?.role === 'technician' ? 'Técnico' : 
                profile?.role === 'super_admin' ? 'Super Admin' : 'Cliente'})
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            
            {profile?.role === 'super_admin' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/super-admin')}
              >
                <Shield className="w-4 h-4 mr-2" />
                Super Admin
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}