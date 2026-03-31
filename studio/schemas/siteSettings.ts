import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'announcementBar', title: 'Announcement Bar', type: 'string' }),
    defineField({ name: 'freeDeliveryThreshold', title: 'Free Delivery Threshold (pence)', type: 'number' }),
    defineField({
      name: 'nav',
      title: 'Navigation',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'href', title: 'Link', type: 'string' },
        ]
      }]
    }),
  ]
})
