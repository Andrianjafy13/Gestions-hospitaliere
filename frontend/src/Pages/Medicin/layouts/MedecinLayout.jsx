import NavBarMed from "../NavBar";


export default function MedecinLayout({ children }) {
  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBarMed />

      <main className="ml-64 pt-20 p-6">
        {children}
      </main>
    </div>
  );
}