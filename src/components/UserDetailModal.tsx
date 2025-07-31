import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  role: 'master' | 'technician' | 'client';
  active: boolean;
  created_at: string;
  user_email?: string;
}

interface UserDetailModalProps {
  user: UserProfile;
  open: boolean;
  onClose: () => void;
  onEdit: (user: UserProfile) => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onResetPassword: (user: UserProfile) => void;
  onChangeEmail: (user: UserProfile) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  open,
  onClose,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onChangeEmail
}) => {
  const getRoleBadge = (role: string) => {
    const variants = {
      master: 'default',
      technician: 'secondary',
      client: 'outline'
    } as const;
    
    const labels = {
      master: 'Master',
      technician: 'Técnico',
      client: 'Cliente'
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Detalhes do Usuário</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(user.id, user.active)}>
                  {user.active ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => onResetPassword(user)}>
                  <Key className="w-4 h-4 mr-2" />
                  Resetar Senha
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeEmail(user)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Alterar Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  user.active ? 'bg-primary' : 'bg-muted'
                }`}>
                  {user.active ? (
                    <UserCheck className="w-6 h-6 text-white" />
                  ) : (
                    <UserX className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(user.role)}
                    {!user.active && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.user_email}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Função: {getRoleBadge(user.role)}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => onEdit(user)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;