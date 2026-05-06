import { act, renderHook } from '@testing-library/react-native';
import { usePanicHold } from '../src/hooks/usePanicHold';

describe('usePanicHold', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does NOT call onConfirm when cancelled before 3s', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => usePanicHold(onConfirm, 3000));

    act(() => { result.current.start(); });
    act(() => { jest.advanceTimersByTime(1500); });
    act(() => { result.current.cancel(); });
    act(() => { jest.runAllTimers(); });

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm after holding >= 3s', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => usePanicHold(onConfirm, 3000));

    act(() => { result.current.start(); });
    act(() => { jest.advanceTimersByTime(3100); });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not activate twice on rapid double press', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => usePanicHold(onConfirm, 3000));

    act(() => {
      result.current.start();
      result.current.start();
    });
    act(() => { jest.advanceTimersByTime(3100); });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('can start again after a cancelled hold', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => usePanicHold(onConfirm, 3000));

    act(() => { result.current.start(); });
    act(() => { jest.advanceTimersByTime(1000); });
    act(() => { result.current.cancel(); });

    act(() => { result.current.start(); });
    act(() => { jest.advanceTimersByTime(3100); });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
