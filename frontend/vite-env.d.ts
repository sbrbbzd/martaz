/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMAGE_SERVER_URL: string;
  readonly VITE_IMAGE_SERVER_HOST: string;
  readonly VITE_IMAGE_SERVER_PORT: string;
  readonly VITE_IMAGE_SERVER_PATH: string;
  readonly DEV: boolean;
  // Add other environment variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}