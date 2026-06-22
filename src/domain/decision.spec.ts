import { Decision } from './decision';

describe('Decision', () => {
  describe('allow', () => {
    it('creates allow decision with default reason', () => {
      const decision = Decision.allow();
      expect(decision.decision).toBe('allow');
      expect(decision.reason).toBe('allowed');
      expect(decision.explanation).toBeUndefined();
      expect(decision.isAllowed()).toBe(true);
    });

    it('creates allow decision with custom reason and explanation', () => {
      const decision = Decision.allow('allowed_by_default', 'Enabled by default');
      expect(decision.decision).toBe('allow');
      expect(decision.reason).toBe('allowed_by_default');
      expect(decision.explanation).toBe('Enabled by default');
      expect(decision.isAllowed()).toBe(true);
    });
  });

  describe('deny', () => {
    it('creates deny decision with reason', () => {
      const decision = Decision.deny('disabled_by_user');
      expect(decision.decision).toBe('deny');
      expect(decision.reason).toBe('disabled_by_user');
      expect(decision.explanation).toBeUndefined();
      expect(decision.isAllowed()).toBe(false);
    });

    it('creates deny decision with reason and explanation', () => {
      const decision = Decision.deny(
        'blocked_by_global_policy',
        'Blocked by global policy',
      );
      expect(decision.decision).toBe('deny');
      expect(decision.reason).toBe('blocked_by_global_policy');
      expect(decision.explanation).toBe('Blocked by global policy');
      expect(decision.isAllowed()).toBe(false);
    });
  });
});
