import 'dotenv/config';
import { Server } from './Server';
import { stdin, stdout } from 'node:process';

stdin.pipe(stdout);

const config = {
  port: Number(process.env.PORT) as number,
  authorization: process.env.AUTHORIZATION as string,
};

Server.construct(config);
Server.launch();
