import type { User } from '../../types/auth/user';

/**
 * Fastest-legal-path arrangement for "an account exists" — API-backed, used by the `setup` fixture
 * when account existence is a precondition, not the thing under test. Login itself always goes through
 * the UI (LoginForm) — automationexercise.com's API verifies credentials but issues no session token,
 * so it cannot seed a browser session. See tasks/api-spike-findings.md.
 */
export interface AccountArranger {
  createAccount(user: User): Promise<void>;
}
