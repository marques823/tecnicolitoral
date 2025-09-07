import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home,
  Ticket,
  Users,
  UserCheck,
  BarChart3,
  Tags,
  Settings,
  Crown,
  Sliders,
  FileText,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavigationMenu() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    const commonItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Ticket, label: 'Chamados', path: '/tickets' }
    ];

    // Apenas administradores da empresa podem acessar clientes
    if (profile?.role === 'company_admin') {
      commonItems.push({ icon: UserCheck, label: 'Clientes', path: '/clients' });
    }

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
        { icon: BarChart3, label: 'Relatórios', path: '/reports' },
        { icon: FileText, label: 'Notas Técnicas', path: '/technical-notes' }
      );
    }
    
    if (profile?.role === 'system_owner') {
      roleSpecificItems.push(
        { icon: Shield, label: 'System Owner', path: '/super-admin' }
      );
    }

    const allItems = [...commonItems, ...roleSpecificItems, 
      { icon: Settings, label: 'Configurações', path: '/settings' }
    ];

    return allItems;
  };

  if (!profile) return null;

  return (
    <nav className="bg-background border-b border-border sticky top-[73px] z-40 lg:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {getMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] h-14 px-2 py-1 shrink-0",
                  "text-xs gap-1",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] leading-none text-center max-w-[50px] truncate">
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}