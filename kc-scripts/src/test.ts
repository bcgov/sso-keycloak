import { createContainer } from './container';

const container = createContainer();
container(async () => {
  console.log('negajjangeda');
  throw Error('asdfasdf');
});
