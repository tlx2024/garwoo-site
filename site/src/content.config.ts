import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  // Starlight 文档：src/content/docs/docs/** → /docs/**
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
