import { defineCollection, z } from 'astro:content'

export const collections = {
  photos: defineCollection({
    type: 'content',
    schema: z.object({
      id: z.string(),
      title: z.string(),
      tags: z.array(z.string()),
      date: z.string(),
      image: z.object({
        src: z.string().url(),
        width: z.number(),
        height: z.number(),
      }),
    })
  }),
}
