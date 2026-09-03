import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Ongoing from './pages/Ongoing';
import Complete from './pages/Complete';
import AnimeDetail from './pages/AnimeDetail';
import Watch from './pages/Watch';
import History from './pages/History';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ongoing" element={<Ongoing />} />
          <Route path="/complete" element={<Complete />} />
          <Route path="/anime/:slug" element={<AnimeDetail />} />
          <Route path="/watch/:episodeSlug" element={<Watch />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
