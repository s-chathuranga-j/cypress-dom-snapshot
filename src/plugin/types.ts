export interface SnapshotPluginConfig {
  /**
   * Base directory for snapshots
   * @default 'cypress/snapshots'
   */
  snapshotDir?: string;

  /**
   * Output formats to generate
   * @default ['html', 'json']
   */
  formats?: Array<'html' | 'json'>;

  /**
   * Capture only on test failure (recommended)
   * @default true
   */
  captureOnFailure?: boolean;

  /**
   * Capture on test success as well
   * @default false
   */
  captureOnSuccess?: boolean;

  /**
   * Include computed styles inline
   * @default true
   */
  includeStyles?: boolean;

  /**
   * Include pseudo-elements (::before, ::after)
   * @default false - can significantly increase file size
   */
  includePseudoElements?: boolean;

  /**
   * Specific CSS properties to include (null = all)
   * Useful for reducing file size
   * @default null
   */
  cssPropertiesToInclude?: string[] | null;

  /**
   * Attempt to capture iframe contents
   * Only same-origin iframes can be captured
   * @default true
   */
  captureIframes?: boolean;

  /**
   * Attempt to capture shadow DOM contents
   * Only open shadow roots can be captured
   * @default true
   */
  captureShadowDom?: boolean;

  /**
   * Maximum snapshot file size (bytes)
   * Prevents extremely large files
   * @default 50MB
   */
  maxSnapshotSize?: number;

  /**
   * Enable plugin logging
   * @default true
   */
  verbose?: boolean;

  /**
   * Custom file naming function
   * Allows complete control over file paths
   */
  fileNameGenerator?: (options: FileNamingOptions) => string;

  /**
   * Hook called before snapshot is saved
   * Allows modification of snapshot data
   */
  beforeSnapshot?: (snapshot: DOMSnapshot) => DOMSnapshot | Promise<DOMSnapshot>;

  /**
   * Hook called after snapshot is saved
   */
  afterSnapshot?: (filePaths: string[]) => void | Promise<void>;
}

export interface DOMSnapshot {
  timestamp: number;
  url: string;
  html: string;
  iframes: IframeSnapshot[];
  shadowDoms: ShadowDomSnapshot[];
  metadata: PageMetadata;
}

export interface IframeSnapshot {
  index: number;
  selector: string;
  html?: string;
  url: string;
  error?: string;
}

export interface ShadowDomSnapshot {
  hostSelector: string;
  mode: string;
  html: string;
}

export interface PageMetadata {
  pageTitle: string;
  viewport: {
    width: number;
    height: number;
  };
  scrollPosition: {
    x: number;
    y: number;
  };
  externalStylesheets: string[];
}

export interface TestInfo {
  title: string;
  titlePath: string[];
  file: string;
  duration: number;
  state: string;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

export interface SnapshotMetadata {
  version: string;
  timestamp: number;
  timestampISO: string;
  test: {
    title: string;
    titlePath: string[];
    file: string;
    duration: number;
    state: string;
    error?: {
      message: string;
      stack?: string;
      name: string;
    };
  };
  page: {
    url: string;
    title: string;
    viewport: {
      width: number;
      height: number;
    };
    scrollPosition: {
      x: number;
      y: number;
    };
    userAgent: string;
  };
  dom: {
    elementCount: number;
    iframeCount: number;
    shadowDomCount: number;
    hasExternalStyles: boolean;
    externalStylesheets: string[];
  };
  cypress: {
    version: string;
    browser: {
      name: string;
      version: string;
    };
  };
  snapshot: {
    htmlFile: string | null;
    htmlSize: number;
  };
}

export interface FileNamingOptions {
  testTitle: string;
  testTitlePath: string[];
  specFile: string;
  timestamp: number;
  index?: number;
}

export interface SerializationOptions {
  includeComputedStyles?: boolean;
  includePseudoElements?: boolean;
  propertiesToInclude?: string[] | null;
}

// Default configuration
export const DEFAULT_CONFIG: Required<Omit<
  SnapshotPluginConfig,
  'fileNameGenerator' | 'beforeSnapshot' | 'afterSnapshot'
>> = {
  snapshotDir: 'cypress/snapshots',
  formats: ['html', 'json'],
  captureOnFailure: true,
  captureOnSuccess: false,
  includeStyles: true,
  includePseudoElements: false,
  cssPropertiesToInclude: null,
  captureIframes: true,
  captureShadowDom: true,
  maxSnapshotSize: 50 * 1024 * 1024, // 50MB
  verbose: true
};
