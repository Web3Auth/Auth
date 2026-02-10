import { JRPCNotification, JRPCParams, JRPCRequest } from "../jrpc/interfaces";

export function isJRPCNotification<T extends JRPCParams>(request: JRPCNotification<T> | JRPCRequest<T>): request is JRPCNotification<T> {
  return !request.id;
}
