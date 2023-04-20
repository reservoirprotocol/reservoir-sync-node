import { Path } from '../../types';
import ping from './ping';
import sync from './sync';

const routes: Path[] = [
  {
    handlers: sync,
    path: '/sync',
  },
  {
    handlers: ping,
    path: '/ping',
  },
];

export default routes;
