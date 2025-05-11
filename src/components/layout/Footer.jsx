import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto mr-2" />
              <span className="text-lg font-semibold">Sistema de Avaliação Física</span>
            </div>
            <p className="mt-2 text-sm">
              Acompanhe sua evolução física e alcance seus objetivos.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-12">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Navegação</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm hover:text-white">
                    Início
                  </Link>
                </li>
                <li>
                  <Link href="/aluno/dashboard" className="text-sm hover:text-white">
                    Área do Aluno
                  </Link>
                </li>
                <li>
                  <Link href="/admin/dashboard" className="text-sm hover:text-white">
                    Área do Administrador
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Suporte</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Fale Conosco
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm hover:text-white">
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Sistema de Avaliação Física. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}