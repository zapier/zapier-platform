// triggers on board with a certain tag
const triggerBoard = async (z, bundle) => {
  const url = 'https://trello.com/1/members/me/boards';
  const response = await z.request(url);
  return response.data;
};

module.exports = {
  key: 'board',
  noun: 'New Board',

  display: {
    label: 'Get Board',
    description: 'Triggers on a new board.',
  },

  operation: {
    perform: triggerBoard,
    // https://developers.trello.com/reference#board-object
    sample: {
      id: '5612e4f91b25c15e873722b8',
      name: 'Employee Manual',
      desc: '',
      descData: null,
      closed: false,
      idOrganization: '54b58957112602c9a0be7aa3',
      invited: false,
      limits: {
        attachments: {
          perBoard: {
            status: 'ok',
            disableAt: 34200,
            warnAt: 32400,
          },
        },
        boards: {
          totalMembersPerBoard: {
            status: 'ok',
            disableAt: 1520,
            warnAt: 1440,
          },
        },
        cards: {
          openPerBoard: {
            status: 'ok',
            disableAt: 4750,
            warnAt: 4500,
          },
          totalPerBoard: {
            status: 'ok',
            disableAt: 1900000,
            warnAt: 1800000,
          },
        },
        checklists: {
          perBoard: {
            status: 'ok',
            disableAt: 1900000,
            warnAt: 1800000,
          },
        },
        customFields: {
          perBoard: {
            status: 'ok',
            disableAt: 48,
            warnAt: 45,
          },
        },
        labels: {
          perBoard: {
            status: 'ok',
            disableAt: 950,
            warnAt: 900,
          },
        },
        lists: {
          openPerBoard: {
            status: 'ok',
            disableAt: 475,
            warnAt: 450,
          },
          totalPerBoard: {
            status: 'ok',
            disableAt: 2850,
            warnAt: 2700,
          },
        },
      },
      memberships: [
        {
          id: '5612e4fb1b25c15e8737234b',
          idMember: '53baf533e697a982248cd73f',
          memberType: 'admin',
          unconfirmed: false,
        },
        {
          id: '5925e4fc63096260c349cbd4',
          idMember: '53cd82cd7ed746db278c4f32',
          memberType: 'normal',
          unconfirmed: false,
        },
      ],
      pinned: false,
      starred: false,
      url: 'https://trello.com/b/HbTEX5hb/employee-manual',
      prefs: {
        permissionLevel: 'public',
        voting: 'disabled',
        comments: 'members',
        invitations: 'members',
        selfJoin: true,
        cardCovers: true,
        cardAging: 'regular',
        calendarFeedEnabled: false,
        background: '5925b78fa1bd45e1bfb835da',
        backgroundImage:
          'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/2560x1707/f3c8b6101072d80565d9b6368f05b19d/photo-1495571758719-6ec1e876d6ae',
        backgroundImageScaled: [
          {
            width: 140,
            height: 100,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/140x100/5afcd242d52da7ad4827966d8c896c00/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 256,
            height: 192,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/256x192/d297510e553abc340fb0de3570445f03/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 480,
            height: 480,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/480x480/08b5996b0a87a0f3dd80af488d99194a/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 960,
            height: 960,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/960x960/7cb60ad23bdee1ca45a7c5e4e0c07968/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 1024,
            height: 1024,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/1024x1024/dca79e47ce10cd2c985dc4ba61abd9cc/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 2048,
            height: 2048,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/2048x2048/b5a88d70569d9ded2af259e8d332c346/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 1280,
            height: 1280,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/1280x1280/c9ae077543d6c41ea2d48d84fdc12484/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 1920,
            height: 1920,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/1920x1920/cc85a9a12195863a1ff2193b5bb3a651/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 2560,
            height: 1600,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/2560x1600/de59d9e742f2de51d4284c6fd7c07f5d/photo-1495571758719-6ec1e876d6ae.jpg',
          },
          {
            width: 2560,
            height: 1707,
            url:
              'https://trello-backgrounds.s3.amazonaws.com/SharedBackground/2560x1707/f3c8b6101072d80565d9b6368f05b19d/photo-1495571758719-6ec1e876d6ae',
          },
        ],
        backgroundTile: false,
        backgroundBrightness: 'light',
        backgroundBottomColor: '#332b09',
        backgroundTopColor: '#d3c4a9',
        canBePublic: false,
        canBeOrg: false,
        canBePrivate: false,
        canInvite: true,
      },
      invitations: [],
      shortLink: 'HbTEX5hb',
      subscribed: false,
      labelNames: {
        green: '',
        yellow: 'good to go',
        orange: '',
        red: '',
        purple: '',
        blue: '',
        sky: '',
        lime: '',
        pink: '',
        black: '',
      },
      powerUps: [],
      dateLastActivity: '2016-01-07T21:24:47.855Z',
      dateLastView: '2018-03-12T14:15:20.234Z',
      shortUrl: 'https://trello.com/b/HbTEX5hb',
      idTags: [],
      datePluginDisable: null,
    },
  },
};
