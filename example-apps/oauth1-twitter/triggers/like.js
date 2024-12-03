module.exports = {
  key: 'like',
  noun: 'Like',

  display: {
    label: 'New Like',
    description: 'Triggers when you like a tweet.'
  },

  operation: {
    perform: {
      url: 'https://api.twitter.com/1.1/favorites/list.json'
    },
    sample: {
      coordinates: null,
      truncated: false,
      favorited: true,
      created_at: 'Tue Sep 04 15:55:52 +0000 2012',
      id_str: '243014525132091393',
      in_reply_to_user_id_str: null,
      entities: {
        urls: [],
        hashtags: [],
        user_mentions: []
      },
      text:
        "Note to self:  don't die during off-peak hours on a holiday weekend.",
      contributors: null,
      id: 243014525132091400,
      retweet_count: 0,
      in_reply_to_status_id_str: null,
      geo: null,
      retweeted: false,
      in_reply_to_user_id: null,
      in_reply_to_screen_name: null,
      source: 'web',
      user: {
        profile_sidebar_fill_color: '252429',
        profile_background_tile: true,
        profile_sidebar_border_color: '181A1E',
        name: 'Sean Cook',
        profile_image_url:
          'https://a0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG',
        location: 'San Francisco',
        created_at: 'Sat May 09 17:58:22 +0000 2009',
        follow_request_sent: false,
        is_translator: false,
        id_str: '38895958',
        profile_link_color: '2FC2EF',
        entities: {
          description: {
            urls: []
          }
        },
        favourites_count: 594,
        url: null,
        default_profile: false,
        contributors_enabled: true,
        profile_image_url_https:
          'https://si0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG',
        utc_offset: -28800,
        id: 38895958,
        listed_count: 191,
        profile_use_background_image: true,
        followers_count: 10659,
        protected: false,
        profile_text_color: '666666',
        lang: 'en',
        profile_background_color: '1A1B1F',
        time_zone: 'Pacific Time (US & Canada)',
        verified: false,
        profile_background_image_url_https:
          'https://si0.twimg.com/profile_background_images/495742332/purty_wood.png',
        description:
          'I taught your phone that thing you like.  The Mobile Partner Engineer @Twitter. ',
        geo_enabled: true,
        notifications: false,
        default_profile_image: false,
        friends_count: 1186,
        profile_background_image_url:
          'https://a0.twimg.com/profile_background_images/495742332/purty_wood.png',
        statuses_count: 2629,
        following: true,
        screen_name: 'theSeanCook',
        show_all_inline_media: true
      },
      place: {
        name: 'San Francisco',
        country_code: 'US',
        country: 'United States',
        attributes: {},
        url: 'https://api.twitter.com/1/geo/id/5a110d312052166f.json',
        id: '5a110d312052166f',
        bounding_box: {
          coordinates: [
            [
              [-122.51368188, 37.70813196],
              [-122.35845384, 37.70813196],
              [-122.35845384, 37.83245301],
              [-122.51368188, 37.83245301]
            ]
          ],
          type: 'Polygon'
        },
        full_name: 'San Francisco, CA',
        place_type: 'city'
      },
      in_reply_to_status_id: null
    }
  }
};
