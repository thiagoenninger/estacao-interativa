import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { sharedTouchGate } from '@/interaction';

afterEach(cleanup);

configure({ asyncUtilTimeout: 5000 });

afterEach(() => sharedTouchGate.reset());
