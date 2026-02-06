import { OvertimeRecord, User } from '../types';

class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Función auxiliar para validar conectividad antes de peticiones
const validateNetwork = () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new APIError("Sin conexión a red. Por favor, activa WiFi o Datos Móviles para sincronizar los registros.");
  }
};

export const SheetsAPI = {
  async fetchRecords(scriptUrl: string, user: User): Promise<OvertimeRecord[]> {
    validateNetwork();
    try {
      // SECURITY: Pass user context to the backend. 
      // The backend script should use these parameters to filter data server-side.
      // ?action=getRecords&username=XXX&role=XXX
      const url = `${scriptUrl}?action=getRecords&username=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user.rol)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new APIError(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      
      // Detect HTML response (Wrong URL or Permissions)
      if (text.trim().startsWith('<')) {
         throw new APIError("Error de configuración: La URL devuelve una página web (HTML). Verifica que: 1. Los permisos del script sean 'Cualquier usuario' (Anyone). 2. La URL termine en '/exec'.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new APIError("La respuesta del servidor no es un JSON válido.");
      }
      
      // Check for specific script error object
      if (data && data.error) {
        throw new APIError(data.error);
      }

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => ({
        ...item,
        cedula: String(item.cedula || ''), // Force string conversion for safety
        cantidadHE: Number(item.cantidadHE) || 0,
        cantidadHR: Number(item.cantidadHR) || 0,
        timestamp: Number(item.timestamp) || 0
      }));
    } catch (error) {
      console.error("Fetch error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("No se pudieron cargar los datos. Verifica tu conexión a internet.");
    }
  },

  async login(scriptUrl: string, username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    validateNetwork();
    try {
      const url = `${scriptUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
         throw new APIError("No se pudo conectar con el servidor de autenticación.");
      }

      const text = await response.text();
      
      // Detect HTML response without crashing
      if (text.trim().startsWith('<')) {
         return { 
           success: false, 
           message: "Error de configuración: El script devolvió HTML. Asegúrate de que los permisos de implementación sean 'Cualquier usuario' (Anyone)." 
         };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { success: false, message: "Respuesta inválida del servidor (JSON malformado)." };
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof APIError) return { success: false, message: error.message };
      return { success: false, message: "Error de conexión desconocido" };
    }
  },

  async registerUser(scriptUrl: string, user: { username: string; password: string; nombre: string }): Promise<void> {
    validateNetwork();
    try {
      // Note: no-cors mode limits error handling capabilities
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'register', ...user })
      });
    } catch (error) {
      console.error("Register error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("Error de red al intentar registrar el usuario.");
    }
  },

  async saveRecord(scriptUrl: string, record: OvertimeRecord): Promise<void> {
    validateNetwork();
    try {
      // Note: no-cors means we can't read the response status
      // We assume success if the network call doesn't throw
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(record)
      });
    } catch (error) {
      console.error("Save error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("No se pudo conectar con Google Sheets. Verifica tu conexión.");
    }
  },

  async deleteRecord(scriptUrl: string, id: string): Promise<void> {
    validateNetwork();
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action: 'delete', id })
      });
    } catch (error) {
      console.error("Delete error:", error);
      if (error instanceof APIError) throw error;
      throw new APIError("No se pudo eliminar el registro. Verifica tu conexión.");
    }
  }
};