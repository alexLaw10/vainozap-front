export interface NotificationModel {
  id: string;
  tenantId: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  pedidoId: string | null;
  criadoEm: string;
}
