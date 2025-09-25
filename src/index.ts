import { Retrieve } from './retrieve';
import { List, Options } from './types';

export { Retrieve } from './retrieve';
export { Tse, List, Options } from './types';

export async function retrieve(options?: Partial<Options>): Promise<List> {
  const retrieve = new Retrieve(options);
  return await retrieve.withRetry();
}