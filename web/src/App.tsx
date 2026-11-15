import { Route, Routes } from 'react-router';
import { Shell } from '@/components/layout/Shell';
import { Arquivo } from '@/features/arquivo/Arquivo';
import { FabricaPage } from '@/features/fabrica/FabricaPage';
import { NaoMigrado } from '@/features/labs/NaoMigrado';
import { Home } from '@/features/mapa/Home';
import { ExemploPaginas } from '@/features/paginas/ExemploPaginas';
import { FabricaContext } from '@/lib/fabrica-context';
import { LABS } from '@/lib/labs';
import { useFabrica } from '@/lib/useFabrica';

export function App() {
  // one live connection for the whole app
  const quadro = useFabrica();
  return (
    <FabricaContext value={quadro}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="fabrica" element={<FabricaPage />} />
          <Route path="arquivo" element={<Arquivo />} />
          <Route path="exemplo-paginas/*" element={<ExemploPaginas />} />
          {LABS.map((lab) => (
            <Route key={lab.id} path={`${lab.id}/*`} element={<NaoMigrado lab={lab} />} />
          ))}
          <Route path="*" element={<NaoMigrado />} />
        </Route>
      </Routes>
    </FabricaContext>
  );
}
