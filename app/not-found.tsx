'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-black text-gradient">404</h1>
        <p className="text-xl text-muted-foreground">Pagina nao encontrada</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 gradient-primary text-white rounded-lg font-bold"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
