import { Route, Routes } from 'react-router';
import { Shell } from '@/components/layout/Shell';
import { CONTEUDO } from '@/content/registry';
import { Decisoes } from '@/features/decisoes/Decisoes';
import { DECISOES_ATIVAS } from '@/lib/recursos';
import { LabPagina } from '@/features/labs/LabPagina';
import { NaoMigrado } from '@/features/labs/NaoMigrado';
import { Home } from '@/features/inicio/Home';
import { ExemploPaginas } from '@/features/paginas/ExemploPaginas';
import { LABS } from '@/lib/labs';

export function App() {
  // one live connection for the whole app
  return (
    <>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          {DECISOES_ATIVAS && <Route path="decisoes" element={<Decisoes />} />}
          <Route path="exemplo-paginas/*" element={<ExemploPaginas />} />
          {LABS.map((lab) => (
            <Route
              key={lab.id}
              path={`${lab.id}/*`}
              // a lab with a folder in src/content is migrated; the others still point to the old lab
              element={
                CONTEUDO[lab.id] ? <LabPagina lab={lab} conteudo={CONTEUDO[lab.id]!} /> : <NaoMigrado lab={lab} />
              }
            />
          ))}
          <Route path="*" element={<NaoMigrado />} />
        </Route>
      </Routes>
    </>
  );
}
