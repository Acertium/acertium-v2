import BottomNav from "./bottom-nav";

// Layout de la app con barra de navegación inferior fija.
// El padding inferior deja hueco para que la barra no tape el contenido.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
