import { Path } from '../../types';
import ping from './ping';
import sync from './sync';

const routes: Path[] = [
  {
    handlers: ping,
    path: '/ping',
  },
  {
    handlers: sync,
    path: '/sync',
  },
];

export default routes;
