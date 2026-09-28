import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Cowork Criativo', description: 'Da hipótese ao próximo teste. Workspace de criativos para e-commerce.' , icons: {icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>}
