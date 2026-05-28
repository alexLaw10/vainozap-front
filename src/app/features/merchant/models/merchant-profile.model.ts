export interface MerchantProfile {
  email: string;
  nomeProprietario: string | null;
  telefone: string | null;
  planoTipo: string;
  trialEndsAt: string | null;  // ISO-8601 LocalDateTime from backend
}
