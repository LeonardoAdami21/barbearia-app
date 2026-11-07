const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailValido = (email: string) => EMAIL.test(email.trim());

/** Mesmas regras da API: 8 a 72 caracteres (o bcrypt ignora o que passa de 72 bytes). */
export function erroDeSenha(senha: string): string | undefined {
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (senha.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  return undefined;
}
