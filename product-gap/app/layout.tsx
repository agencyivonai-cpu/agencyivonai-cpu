import './globals.css';

export const metadata = {
  title: 'Product Gap',
  description: 'Autonomous product opportunity engine'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
