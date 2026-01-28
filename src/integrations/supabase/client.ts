import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase - Edita estos valores con tus credenciales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''; // COLOCA TU URL AQUI
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''; // COLOCA TU ANON KEY AQUI

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase: Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas. ' +
    'Por favor, agrégalas o edita este archivo directamente.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
