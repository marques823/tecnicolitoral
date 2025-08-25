import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCompanyTheme = () => {
  const { company } = useAuth();

  useEffect(() => {
    const applyCompanyTheme = async () => {
      if (!company?.id) return;

      try {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('primary_color, secondary_color, custom_css')
          .eq('id', company.id)
          .single();

        if (error) throw error;

        if (companyData) {
          const root = document.documentElement;
          
          // Função para converter hex para hsl
          const hexToHsl = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;

            if (max !== min) {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
              }
              h /= 6;
            }

            return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
          };

          // Aplicar cores personalizadas
          if (companyData.primary_color) {
            const primaryHsl = hexToHsl(companyData.primary_color);
            root.style.setProperty('--primary', primaryHsl);
            
            // Criar uma versão mais clara para primary-glow
            const primaryRgb = {
              r: parseInt(companyData.primary_color.slice(1, 3), 16),
              g: parseInt(companyData.primary_color.slice(3, 5), 16),
              b: parseInt(companyData.primary_color.slice(5, 7), 16),
            };
            
            // Aumentar a luminosidade em 20%
            const glowRgb = {
              r: Math.min(255, primaryRgb.r + 51),
              g: Math.min(255, primaryRgb.g + 51),
              b: Math.min(255, primaryRgb.b + 51),
            };
            
            const glowHex = '#' + [glowRgb.r, glowRgb.g, glowRgb.b].map(x => {
              const hex = x.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            }).join('');
            
            const glowHsl = hexToHsl(glowHex);
            root.style.setProperty('--primary-glow', glowHsl);
          }

          if (companyData.secondary_color) {
            const secondaryHsl = hexToHsl(companyData.secondary_color);
            root.style.setProperty('--secondary', secondaryHsl);
          }

          // Aplicar CSS personalizado
          if (companyData.custom_css) {
            // Remover style tag anterior se existir
            const existingStyle = document.getElementById('company-custom-css');
            if (existingStyle) {
              existingStyle.remove();
            }

            // Criar novo style tag
            const styleTag = document.createElement('style');
            styleTag.id = 'company-custom-css';
            styleTag.textContent = companyData.custom_css;
            document.head.appendChild(styleTag);
          }
        }
      } catch (error) {
        console.error('Erro ao aplicar tema da empresa:', error);
      }
    };

    // Aplicar tema imediatamente se já temos dados da empresa
    if (company?.id) {
      applyCompanyTheme();
    }
  }, [company?.id]);

  // Cleanup function para remover estilos personalizados
  useEffect(() => {
    return () => {
      const customStyle = document.getElementById('company-custom-css');
      if (customStyle) {
        customStyle.remove();
      }
    };
  }, []);
};