import axios from 'axios';
import { BASE_URL } from '../config/api';
import type { TrustContact } from '../types';

const TRUST_API = BASE_URL;

export const trustGroupService = {
  /**
   * GET api/auth/users/{userId}/trust-group
   * Obtiene la lista de contactos de confianza del usuario.
   */
  async getContacts(userId: string): Promise<TrustContact[]> {
    const { data } = await axios.get<TrustContact[]>(
      `${TRUST_API}/Auth/users/${userId}/trust-group`,
      { timeout: 8000 },
    );
    return data;
  },

  /**
   * POST api/auth/users/{userId}/trust-group
   * Agrega un nuevo contacto de confianza (límite: 5).
   */
  async addContact(
    userId: string,
    nombre: string,
    correo: string,
  ): Promise<TrustContact> {
    const { data } = await axios.post<TrustContact>(
      `${TRUST_API}/Auth/users/${userId}/trust-group`,
      { nombre, correo },
      { timeout: 8000 },
    );
    return data;
  },

  /**
   * DELETE api/auth/users/{userId}/trust-group/{contactId}
   * Elimina un contacto de confianza del usuario.
   */
  async removeContact(userId: string, contactId: number): Promise<void> {
    await axios.delete(
      `${TRUST_API}/Auth/users/${userId}/trust-group/${contactId}`,
      { timeout: 8000 },
    );
  },
};
