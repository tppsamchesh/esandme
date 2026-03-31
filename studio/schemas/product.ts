import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: Rule => Rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'price', title: 'Price (pence)', type: 'number', validation: Rule => Rule.required() }),
    defineField({ name: 'comparePrice', title: 'Compare at Price (pence)', type: 'number' }),
    defineField({ name: 'images', title: 'Images', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      to: [{ type: 'collection' }]
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'size', title: 'Size', type: 'string' },
          { name: 'colour', title: 'Colour', type: 'string' },
          { name: 'sku', title: 'SKU', type: 'string' },
          { name: 'price', title: 'Price override (pence)', type: 'number' },
          { name: 'stock', title: 'Stock', type: 'number' },
        ]
      }]
    }),
    defineField({
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'author', title: 'Author', type: 'string' },
          { name: 'rating', title: 'Rating (1-5)', type: 'number' },
          { name: 'body', title: 'Review', type: 'text' },
          { name: 'date', title: 'Date', type: 'date' },
        ]
      }]
    }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text' }),
  ]
})
