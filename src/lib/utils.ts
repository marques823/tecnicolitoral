import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para validar CNPJ
export function validateCNPJ(cnpj: string): boolean {
  // Remove formatação
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let peso = 2;
  
  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cleanCNPJ.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  let resto = soma % 11;
  let dv1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cleanCNPJ.charAt(12)) !== dv1) return false;
  
  // Segundo dígito verificador
  soma = 0;
  peso = 2;
  
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cleanCNPJ.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  resto = soma % 11;
  let dv2 = resto < 2 ? 0 : 11 - resto;
  
  return parseInt(cleanCNPJ.charAt(13)) === dv2;
}

// Função para formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
