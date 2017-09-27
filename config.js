const selectedUsers = [
  'astanehchess', 'penguingim1', 'chess-network', 'fishyvischy', 'thibault',
  'programfox', 'isaacly', 'revoof', 'arex', 'lance5500', 'arka50', 'lovlas', 'tonyro',
  'lakinwecker', 'toadofsky', 'veloce', 'clarkey', 'flugsio', 'happy0', 'freefal',
  'kingscrusher-youtube', 'rzenaikrzys', 'vsim', 'bosspotato', 'opperwezen', 'sparklehorse'];

const selectedTeams = ['iran', 'kristos-team-chess-players', 'russian-chess-players', 'coders'];

function transformUser(u) {
  u.sha512 = false;
  u.salt = '';
  u.password = '11a6efa91890f4fdbdddf3c344d40b8a96eb5d5d'; // 'password'
}

module.exports = {
  source: 'mongodb://91.121.143.131:28945/lichess',
  dest: 'mongodb://localhost:27017/lichess',
  ensureIndexes: false,
  plan: [{
    name: 'Selected users',
    coll: 'user4',
    match: { _id: { $in: [...selectedUsers, 'lichess'] } },
    transform: transformUser
  }, {
    coll: 'flag'
  }, {
    coll: 'video'
  }, {
    coll: 'trophy'
  }, {
    coll: 'qa_question'
  }, {
    coll: 'qa_answer'
  }, {
    coll: 'study',
    sort: { likes: -1 },
    limit: 500
  }, {
    coll: 'study',
    match: { ownerId: { $in: selectedUsers.filter(u => u !== 'lance5500') } }
  }, {
    coll: 'bookmark',
    match: { u: { $in: selectedUsers } }
  }, {
    coll: 'config',
    match: { _id: { $in: selectedUsers } }
  }, {
    coll: 'history3',
    match: { _id: { $in: selectedUsers } }
  }, {
    coll: 'timeline_entry',
    match: { users: { $in: selectedUsers } },
    sort: { date: -1 },
    limit: 1000
  }, {
    coll: 'tournament_leaderboard',
    match: { u: { $in: selectedUsers } }
  }, ...[1,2,3,4,5,11,12,13,14,15,16,17,18].map(pt => {
    return {
      name: 'Ranking of perf ' + pt,
      coll: 'ranking',
      match: {
        stable: true,
        perf: pt
      },
      sort: { rating: -1 },
      limit: 100
    };
  }), {
    coll: 'pref',
    match: { _id: { $in: selectedUsers } }
  }, {
    coll: 'crosstable2',
    match: {
      '$or': selectedUsers.map(u => ({
        _id: { $regex: `^${u}/` }
      }))
    }
  }, {
    coll: 'activity',
    match: {
      '$or': selectedUsers.map(u => ({
        _id: { $regex: `^${u}:` }
      }))
    }
  }, {
    coll: 'study_chapter',
    each: {
      from: {
        coll: 'study'
      },
      foreignField: '_id',
      match(foreignFieldValues) {
        return { studyId: { $in: foreignFieldValues }};
      }
    }
  }, {
    name: 'Users of studies',
    coll: 'user4',
    each: {
      from: { coll: 'study' },
      distinct: 'uids',
      match(uids) {
        return { _id: { $in: uids }};
      }
    },
    transform: transformUser
  }, {
    coll: 'simul',
    sort: { createdAt: -1 },
    limit: 1000
  }, {
    name: 'Users of simul hosts',
    coll: 'user4',
    each: {
      from: {
        coll: 'simul'
      },
      foreignField: 'hostId',
      match(foreignFieldValues) {
        return { _id: { $in: foreignFieldValues }};
      }
    },
    transform: transformUser
  }, {
    coll: 'relation',
    match: {
      $or: [
        { u1: { $in: selectedUsers } },
        { u2: { $in: selectedUsers } }
      ]
    }
  }, {
    coll: 'tournament_player',
    each: {
      from: { coll: 'tournament2' },
      foreignField: '_id',
      match(foreignFieldValues) {
        return { tid: { $in: foreignFieldValues }};
      }
    }
  }, {
    coll: 'tournament2',
    sort: { startsAt: -1 },
    limit: 1000
  }, {
    coll: 'tournament_player',
    each: {
      from: { coll: 'tournament2' },
      foreignField: '_id',
      match(foreignFieldValues) {
        return { tid: { $in: foreignFieldValues }};
      }
    }
  }, {
    coll: 'tournament_pairing',
    each: {
      from: { coll: 'tournament2' },
      foreignField: '_id',
      match(foreignFieldValues) {
        return { tid: { $in: foreignFieldValues }};
      }
    }
  }, {
    name: 'Users of tournaments',
    coll: 'user4',
    each: {
      from: { coll: 'tournament_player' },
      foreignField: 'uid',
      match(foreignFieldValues) {
        return { _id: { $in: foreignFieldValues }};
      }
    },
    transform: transformUser
  }, {
    coll: 'team'
  }, {
    coll: 'team_member',
    match: {
      team: { $in: selectedTeams }
    }
  }, {
    coll: 'f_categ'
  }, {
    coll: 'f_topic',
    sort: { createdAt: -1 },
    limit: 5000
  }, {
    coll: 'f_post',
    sort: { createdAt: -1 },
    limit: 30000
  }, {
    coll: 'report',
    sort: { createdAt: -1 },
    limit: 10000
  }, {
    name: 'Users of reports',
    coll: 'user4',
    each: {
      from: { coll: 'report' },
      distinct: 'user',
      match(uids) { return { _id: { $in: uids }}; }
    },
    transform: transformUser
  }, {
    coll: 'modlog',
    sort: { date: -1 },
    limit: 5000
  }, {
    name: 'Users of modlogs: mods',
    coll: 'user4',
    each: {
      from: { coll: 'modlog' },
      distinct: 'mod',
      match(uids) { return { _id: { $in: uids }}; }
    },
    transform: transformUser
  }, {
    name: 'Users of modlogs: convicts',
    coll: 'user4',
    each: {
      from: { coll: 'modlog' },
      distinct: 'user',
      match(uids) { return { _id: { $in: uids }}; }
    },
    transform: transformUser
  }, {
    name: 'Users of forum posts',
    coll: 'user4',
    each: {
      from: { coll: 'f_post' },
      foreignField: 'userId',
      match(foreignFieldValues) {
        return { _id: { $in: foreignFieldValues }};
      }
    },
    transform: transformUser
  }, {
    name: 'Games of selected users',
    coll: 'game5',
    match: { us: { $in: selectedUsers } }
  }, {
    name: 'Games of strong standard users',
    coll: 'game5',
    each: {
      from: {
        coll: 'user4',
        match: { engine: false, booster: false },
        sort: { 'perfs.standard.gl.r': -1 },
        limit: 100
      },
      foreignField: '_id',
      match(foreignFieldValues) {
        return { us: { $in: foreignFieldValues }};
      }
    }
  }, {
    coll: 'analysis2',
    each: {
      from: {
        coll: 'game5',
        match: { an: true },
        limit: 10000
      },
      foreignField: '_id',
      match(foreignFieldValues) {
        return { _id: { $in: foreignFieldValues }};
      }
    }
  }]
};
