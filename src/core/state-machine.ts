/**
 * State Machine - Manages application state transitions
 * Ensures only valid state transitions occur
 */

import { eventBus, AppState } from './event-bus';

interface StateTransition {
  from: AppState;
  to: AppState;
  onEnter?: () => void | Promise<void>;
  onExit?: () => void | Promise<void>;
}

class StateMachine {
  private currentState: AppState = 'idle';
  private transitions: Map<string, StateTransition> = new Map();
  private isTransitioning = false;

  constructor() {
    this.defineTransitions();
  }

  private defineTransitions(): void {
    // From idle state
    this.addTransition('idle', 'menu-open');
    this.addTransition('idle', 'code-fixer-running');
    this.addTransition('idle', 'environment-running');
    this.addTransition('idle', 'organizer-running');
    this.addTransition('idle', 'error');

    // From menu-open state
    this.addTransition('menu-open', 'idle');
    this.addTransition('menu-open', 'code-fixer-running');
    this.addTransition('menu-open', 'environment-running');
    this.addTransition('menu-open', 'organizer-running');
    this.addTransition('menu-open', 'error');

    // From error state (can always reset to idle)
    this.addTransition('error', 'idle');
    this.addTransition('error', 'menu-open');

    // From any running state back to idle when feature completes
    this.addTransition('code-fixer-running', 'idle');
    this.addTransition('environment-running', 'idle');
    this.addTransition('organizer-running', 'idle');
  }

  /**
   * Define a valid state transition
   */
  private addTransition(from: AppState, to: AppState): void {
    const key = `${from} -> ${to}`;
    this.transitions.set(key, {
      from,
      to,
    });
  }

  /**
   * Attempt to transition to a new state
   */
  async setState(newState: AppState): Promise<boolean> {
    // Prevent re-entrance
    if (this.isTransitioning) {
      console.warn(`Already transitioning, ignoring setState(${newState})`);
      return false;
    }

    // Check if transition is valid
    const transitionKey = `${this.currentState} -> ${newState}`;
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      console.warn(`Invalid state transition: ${transitionKey}`);
      eventBus.emit({
        type: 'LOG',
        message: `Invalid state transition: ${this.currentState} -> ${newState}`,
        level: 'warn',
      });
      return false;
    }

    try {
      this.isTransitioning = true;

      // Call exit handler from current state
      if (transition.onExit) {
        await transition.onExit();
      }

      const previousState = this.currentState;
      this.currentState = newState;

      // Call enter handler for new state
      if (transition.onEnter) {
        await transition.onEnter();
      }

      // Emit state change event
      eventBus.emit({
        type: 'STATE_CHANGED',
        state: newState,
      });

      console.log(`State transition: ${previousState} -> ${newState}`);

      return true;
    } catch (error) {
      console.error(`Error during state transition to ${newState}:`, error);
      this.currentState = 'error';
      eventBus.emit({
        type: 'LOG',
        message: `State transition error: ${error}`,
        level: 'error',
      });
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Get current state
   */
  getState(): AppState {
    return this.currentState;
  }

  /**
   * Check if currently in a specific state
   */
  isInState(state: AppState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if transition is valid (without executing it)
   */
  canTransition(to: AppState): boolean {
    const key = `${this.currentState} -> ${to}`;
    return this.transitions.has(key);
  }

  /**
   * Get all valid next states
   */
  getValidNextStates(): AppState[] {
    const validStates: AppState[] = [];
    this.transitions.forEach((transition) => {
      if (transition.from === this.currentState) {
        validStates.push(transition.to);
      }
    });
    return validStates;
  }
}

export const stateMachine = new StateMachine();
