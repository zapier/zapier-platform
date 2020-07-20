const perform = async (z, bundle) => {
  const url = 'https://api.tumblr.com/v2/user/likes';
  const response = await z.request(url);
  const result = response.data;
  return result.response.liked_posts || [];
};

module.exports = {
  key: 'like',
  noun: 'Like',

  display: {
    label: 'New Like',
    description: 'Triggers when you like a post.',
  },

  operation: {
    perform,
    sample: {
      blog_name: 'citriccomics',
      id: 3507845453,
      post_url: 'https://citriccomics.tumblr.com/post/3507845453',
      type: 'text',
      date: '2011-02-25 20:27:00 GMT',
      timestamp: 1298665620,
      state: 'published',
      format: 'html',
      reblog_key: 'b0baQtsl',
      tags: ['tumblrize', 'milky dog', 'mini comic'],
      note_count: 14,
      title: 'Milky Dog',
      body: '<p>Example body.</p>',
    },
  },
};
