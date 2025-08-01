import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home,
  Ticket,
  Users,
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

    const roleSpecificItems = [];
    
    if (profile?.role === 'master') {
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
    
    if (profile?.role === 'super_admin') {
      roleSpecificItems.push(
        { icon: Shield, label: 'Super Admin', path: '/super-admin' }
      );
    }

    const allItems = [...commonItems, ...roleSpecificItems, 
      { icon: Settings, label: 'Configurações', path: '/settings' }
    ];

    return allItems;
  };

  if (!profile) return null;

  return (
    <nav className="bg-background border-b border-border sticky top-[73px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2">
          {getMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center space-x-2 whitespace-nowrap shrink-0",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}