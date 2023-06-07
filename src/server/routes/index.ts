import { Path } from '../../types';
import ping from './ping';

const routes: Path[] = [
  {
    handlers: ping,
    path: '/ping',
  },
];

export default routes;
