import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import AccordionPopulator from './pages/AccordionPopulator';
import IconListPopulator from './pages/IconListPopulator';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="accordion" element={<AccordionPopulator />} />
          <Route path="icon-list" element={<IconListPopulator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
