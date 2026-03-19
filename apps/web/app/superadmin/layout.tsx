import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Shield, Users, Building, Activity, LayoutDashboard, ArrowLeft } from 'lucide-react';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return false;

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return false;
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) return false;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, isActive: true }
    });

    if (user?.role === 'superadmin' && user?.isActive) {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSuperAdmin = await checkSuperAdmin();

  // Strict SSR Shield
  if (!isSuperAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 min-h-screen text-slate-300 flex flex-col">
        <div className="p-6 flex items-center space-x-3 text-white border-b border-slate-800">
          <Shield className="h-6 w-6 text-indigo-400" />
          <span className="font-bold text-lg tracking-wider">SUPERADMIN</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <Link href="/superadmin" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/superadmin/users" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Users className="h-5 w-5" />
            <span>Usuários</span>
          </Link>
          <Link href="/superadmin/tenants" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Building className="h-5 w-5" />
            <span>Tenants & Billing</span>
          </Link>
          <Link href="/superadmin/audit" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Activity className="h-5 w-5" />
            <span>Audit Logs</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard" className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Sistema</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
