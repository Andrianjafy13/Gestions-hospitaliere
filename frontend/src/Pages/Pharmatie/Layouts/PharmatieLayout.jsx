import NavBarRecep from "../NavBar";


export default function PharmaLayout({ children }) {
  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBarRecep />

      <main className="ml-64 pt-20 p-6">
        {children}
      </main>
    </div>
  );
}