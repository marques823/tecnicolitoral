import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  LogOut, 
  Ticket, 
  User,
  Shield,
  Menu,
  X,
  Home,
  Users,
  Tags,
  BarChart3,
  Crown,
  Sliders,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user, profile, company, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <header className="bg-background border-b border-border px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">TicketFlow</span>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
          </div>
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50">
            <div className="p-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/auth')}
              >
                Login
              </Button>
            </div>
          </div>
        )}
      </header>
    );
  }

  const getMenuItems = () => {
    const commonItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Ticket, label: 'Chamados', path: '/tickets' },
      { icon: Settings, label: 'Configurações', path: '/settings' }
    ];

    const roleSpecificItems = [];
    
    if (profile?.role === 'company_admin') {
      roleSpecificItems.push(
        { icon: BarChart3, label: 'Relatórios', path: '/reports' },
        { icon: Users, label: 'Usuários', path: '/users' },
        { icon: Tags, label: 'Categorias', path: '/categories' },
        { icon: Crown, label: 'Planos', path: '/plans' },
        { icon: Sliders, label: 'Campos Custom', path: '/custom-fields' },
        { icon: FileText, label: 'Notas Técnicas', path: '/technical-notes' }
      );
    }
    
    if (profile?.role === 'technician') {
      roleSpecificItems.push(
        { icon: BarChart3, label: 'Relatórios', path: '/reports' }
      );
    }
    
    if (profile?.role === 'system_owner') {
      roleSpecificItems.push(
        { icon: Shield, label: 'Super Admin', path: '/super-admin' }
      );
    }

    return [...commonItems.slice(0, 2), ...roleSpecificItems, ...commonItems.slice(2)];
  };

  return (
    <>
      <header className="bg-background border-b border-border px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {company?.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={`${company.name} Logo`}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback para o ícone se a imagem não carregar
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Ticket className={cn("w-6 h-6 text-primary", company?.logo_url && "hidden")} />
            <span className="font-bold text-lg">
              {company?.name || 'TicketFlow'}
            </span>
          </div>
          
          {/* Desktop User Info */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4" />
              <span className="truncate max-w-32">{profile?.name || user.email}</span>
              <span className="text-muted-foreground text-xs">
                 ({profile?.role === 'company_admin' ? 'Admin da Empresa' : 
                  profile?.role === 'technician' ? 'Técnico' : 
                  profile?.role === 'system_owner' ? 'System Owner' : 'Cliente'})
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
          
          {/* Mobile/Tablet Menu Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <User className="w-4 h-4" />
              <span className="truncate max-w-20">{profile?.name?.split(' ')[0] || 'Usuário'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-background border-r border-border z-40 overflow-y-auto">
        <div className="p-4">
          {/* User Info in Sidebar */}
          <div className="flex items-center space-x-3 mb-6 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">{profile?.name || user.email}</p>
              <p className="text-xs text-muted-foreground">
                 {profile?.role === 'company_admin' ? 'Admin da Empresa' : 
                  profile?.role === 'technician' ? 'Técnico' : 
                  profile?.role === 'system_owner' ? 'System Owner' : 'Cliente'}
              </p>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {getMenuItems().map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start h-11"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Button>
            ))}
            
            <div className="pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sair
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-[73px] left-0 h-[calc(100vh-73px)] w-80 max-w-[80vw] bg-background border-r border-border z-50 lg:hidden overflow-y-auto">
            <div className="p-4">
              {/* User Info in Mobile */}
              <div className="flex items-center space-x-3 mb-6 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{profile?.name || user.email}</p>
                  <p className="text-xs text-muted-foreground">
                     {profile?.role === 'company_admin' ? 'Admin da Empresa' : 
                      profile?.role === 'technician' ? 'Técnico' : 
                      profile?.role === 'system_owner' ? 'System Owner' : 'Cliente'}
                  </p>
                </div>
              </div>
              
              {/* Navigation Menu */}
              <nav className="space-y-2">
                {getMenuItems().map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start h-11"
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                ))}
                
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}