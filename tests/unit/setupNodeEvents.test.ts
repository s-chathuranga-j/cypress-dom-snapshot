import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { setupSnapshotPlugin, handleAfterSpec } from '../../src/plugin/setupNodeEvents';
import { DEFAULT_CONFIG } from '../../src/plugin/types';

describe('setupSnapshotPlugin', () => {
  let onMock: jest.Mock;
  let configMock: any;

  beforeEach(() => {
    onMock = jest.fn();
    configMock = {
      projectRoot: '/root',
      env: {}
    };
  });

  it('should register task unconditionally', () => {
    setupSnapshotPlugin(onMock, configMock);
    expect(onMock).toHaveBeenCalledWith('task', expect.any(Object));
  });

  it('should NOT register after:spec by default', () => {
    setupSnapshotPlugin(onMock, configMock);
    const registeredEvents = onMock.mock.calls.map(call => call[0]);
    expect(registeredEvents).not.toContain('after:spec');
  });

  it('should register after:spec if afterSnapshot is provided', () => {
    setupSnapshotPlugin(onMock, configMock, {
      afterSnapshot: async () => {}
    });
    const registeredEvents = onMock.mock.calls.map(call => call[0]);
    expect(registeredEvents).toContain('after:spec');
  });

  it('should NOT register after:spec if skipHooks is true even if afterSnapshot is provided', () => {
    setupSnapshotPlugin(onMock, configMock, {
      afterSnapshot: async () => {},
      skipHooks: true
    });
    const registeredEvents = onMock.mock.calls.map(call => call[0]);
    expect(registeredEvents).not.toContain('after:spec');
  });

  it('handleAfterSpec should call afterSnapshot if provided', async () => {
    const afterSnapshotMock = jest.fn() as any;
    const spec = { relative: 'spec.cy.ts' } as any;
    const results = {} as any;
    
    await handleAfterSpec(spec, results, configMock, {
      afterSnapshot: afterSnapshotMock
    });
    
    expect(afterSnapshotMock).toHaveBeenCalled();
  });
});
