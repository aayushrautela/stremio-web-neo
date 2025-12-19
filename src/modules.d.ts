declare module '*.less' {
    const resource: Record<string, string>;
    export = resource;
}

declare function require(path: string): string;

declare module 'stremio-router';
declare module 'stremio/components/NavBar';
declare module 'stremio/components/ModalDialog';
