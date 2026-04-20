export const PASSWORD_RESET_NOTIFIER = Symbol('PASSWORD_RESET_NOTIFIER');

export interface PasswordResetNotifier {
  sendPasswordReset(to: string, token: string): Promise<void>;
}