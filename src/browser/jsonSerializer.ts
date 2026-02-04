import { DOMSnapshot, TestInfo, SnapshotMetadata } from '../plugin/types';

const PLUGIN_VERSION = '1.0.0';

export function generateMetadata(
  domSnapshot: DOMSnapshot,
  testInfo: TestInfo,
  cypressVersion: string,
  browserInfo: { name: string; version: string }
): SnapshotMetadata {
  return {
    version: PLUGIN_VERSION,
    timestamp: domSnapshot.timestamp,
    timestampISO: new Date(domSnapshot.timestamp).toISOString(),
    test: {
      title: testInfo.title,
      titlePath: testInfo.titlePath,
      file: testInfo.file,
      duration: testInfo.duration,
      state: testInfo.state,
      error: testInfo.error
        ? {
            message: testInfo.error.message,
            stack: testInfo.error.stack,
            name: testInfo.error.name
          }
        : undefined
    },
    page: {
      url: domSnapshot.url,
      title: domSnapshot.metadata.pageTitle,
      viewport: domSnapshot.metadata.viewport,
      scrollPosition: domSnapshot.metadata.scrollPosition,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    },
    dom: {
      elementCount: countElements(domSnapshot.html),
      iframeCount: domSnapshot.iframes.length,
      shadowDomCount: domSnapshot.shadowDoms.length,
      hasExternalStyles: domSnapshot.metadata.externalStylesheets.length > 0,
      externalStylesheets: domSnapshot.metadata.externalStylesheets
    },
    cypress: {
      version: cypressVersion,
      browser: browserInfo
    },
    snapshot: {
      htmlFile: null, // Set by snapshotManager
      htmlSize: 0 // Set by snapshotManager
    }
  };
}

function countElements(html: string): number {
  // Count opening tags in HTML string (works in both browser and Node)
  const tagMatches = html.match(/<[a-zA-Z][^>]*>/g);
  return tagMatches ? tagMatches.length : 0;
}
