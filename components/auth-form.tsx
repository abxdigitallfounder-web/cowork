'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

export function AuthForm({ mode }: { mode: 'entrar' | 'criar' }) {
  const criando = mode === 'criar';
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const result = criando
        ? await authClient.signUp.email({ email: email.trim().toLowerCase(), password, name: name.trim() || email.split('@')[0] })
        : await authClient.signIn.email({ email: email.trim().toLowerCase(), password });
      if (result.error) { setError(result.error.message || 'Não foi possível continuar.'); setLoading(false); return }
      // Recarrega a página inteira de propósito: assim o servidor já responde o
      // primeiro request com o cookie de sessão recém-criado.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/';
    } catch {
      setError('Não foi possível falar com o servidor. Tente de novo.');
      setLoading(false);
    }
  };

  return <div className="auth-shell">
    <form className="auth-card" onSubmit={submit}>
      <div className="brand auth-brand"><span className="brand-mark">C<span>•</span></span><div><strong>Cowork</strong><small>CREATIVE OPS</small></div></div>
      <h1>{criando ? 'Criar sua conta' : 'Entrar no workspace'}</h1>
      <p className="auth-lead">{criando
        ? 'Depois de criar a conta, um administrador libera sua função na equipe.'
        : 'Use o e-mail e a senha da sua conta do workspace.'}</p>
      {criando && <label className="field"><span>Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como a equipe te chama" autoComplete="name" />
      </label>}
      <label className="field"><span>E-mail</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" autoComplete="email" />
      </label>
      <label className="field"><span>Senha</span>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={criando ? 'new-password' : 'current-password'} />
      </label>
      {error && <div className="auth-error">{error}</div>}
      <button className="primary auth-submit" type="submit" disabled={loading}>
        {loading ? 'Aguarde...' : criando ? 'Criar conta' : 'Entrar'} <ArrowRight size={16} />
      </button>
      <div className="auth-switch">
        {criando
          ? <>Já tem conta? <Link href="/entrar">Entrar</Link></>
          : <>Ainda não tem conta? <Link href="/criar-conta">Criar conta</Link></>}
      </div>
    </form>
  </div>;
}
