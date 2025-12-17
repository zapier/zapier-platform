# dynamic-dropdown

This example integration demonstrates how to create **dynamic dropdowns** (also known as dynamic choices) in Zapier integrations.

## Dynamic Dropdown Patterns

There are two ways to implement dynamic dropdowns:

### 1. Trigger-based (Legacy Pattern)

Uses a separate trigger to fetch choices. Reference it with the `dynamic` property:

```javascript
{
  key: 'species_id',
  type: 'integer',
  label: 'Species',
  dynamic: 'species.id.name',  // Format: "triggerKey.idField.labelField"
}
```

The trigger (`species`) fetches data, and Zapier uses `id` for the value and `name` for the display label.

### 2. Perform-based (New Pattern)

Uses a function to fetch choices directly. Define it with `choices.perform`:

```javascript
{
  key: 'planet_id',
  type: 'integer',
  label: 'Home Planet',
  choices: {
    perform: getPlanetChoices,
  },
}
```

The perform function must return:

```javascript
{
  results: [
    { id: '1', label: 'Tatooine' },
    { id: '2', label: 'Alderaan' },
  ],
  paging_token: 'https://api.example.com/planets?page=2',  // or null if no more pages
}
```

#### Pagination Support

The perform function receives `bundle.meta.paging_token` for subsequent page requests:

```javascript
const getPlanetChoices = async (z, bundle) => {
  // First request: paging_token is undefined
  // Subsequent requests: paging_token is the value you returned previously
  const url = bundle.meta.paging_token || 'https://api.example.com/planets';

  const response = await z.request({ url });

  return {
    results: response.data.results.map((item) => ({
      id: item.id,
      label: item.name,
    })),
    // Return null when there are no more pages
    paging_token: response.data.next,
  };
};
```

## This Example

This integration uses the [Star Wars API](https://swapi.dev/) to demonstrate:

- **Species dropdown** - Trigger-based pattern using the `species` trigger
- **Planet dropdown** - Perform-based pattern with pagination

## Getting Started

```bash
# Install dependencies
npm install

# Run tests
zapier test

# Push to Zapier
zapier push
```

Find out more on the latest docs: https://github.com/zapier/zapier-platform/blob/main/packages/cli/README.md
