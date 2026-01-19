import { shallowRef } from 'vue';

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function useUndoRedo<State>(options: {
  maxHistorySize: number;
  getState: () => State;
  applyState: (state: State) => void;
  onAfterRestore?: () => void;
}) {
  const historyStack = shallowRef<State[]>([]);
  const redoStack = shallowRef<State[]>([]);

  function saveStateToHistory() {
    const snapshot = deepClone(options.getState());
    historyStack.value.push(snapshot);
    if (historyStack.value.length > options.maxHistorySize) {
      historyStack.value.shift();
    }
    redoStack.value = [];
  }

  function undo() {
    if (historyStack.value.length === 0) return;
    redoStack.value.push(deepClone(options.getState()));
    const previousState = historyStack.value.pop() as State;
    options.applyState(previousState);
    options.onAfterRestore?.();
  }

  function redo() {
    if (redoStack.value.length === 0) return;
    historyStack.value.push(deepClone(options.getState()));
    const nextState = redoStack.value.pop() as State;
    options.applyState(nextState);
    options.onAfterRestore?.();
  }

  return {
    historyStack,
    redoStack,
    saveStateToHistory,
    undo,
    redo
  };
}
