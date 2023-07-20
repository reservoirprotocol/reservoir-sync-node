import { Path } from '../../types';
import ping from './ping';
import sync from './sync';
import viewer from './viewer';

const routes: Path[] = [
  {
    handlers: ping,
    path: '/ping',
  },
  {
    handlers: sync,
    path: '/sync',
  },
  {
    handlers: viewer,
    path: '/viewer',
  },
];

export default routes;
