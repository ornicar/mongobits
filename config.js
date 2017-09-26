module.exports = {
  source: 'mongodb://91.121.143.131:28945/lichess',
  dest: 'mongodb://localhost:27017/lichess',
  plan: [{
    skip: true,
    coll: 'user4',
    match: {
      _id: { '$in': ['thibault', 'astanehchess', 'penguingim1', 'chess-network', 'fishyvischy'] }
    }
  }, {
    coll: 'game5',
    each: {
      coll: 'user4',
      foreignField: '_id',
      match(foreignFieldValues) {
        return { us: { '$in': foreignFieldValues }};
      }
    }
  }]
};
/* plan: {
 *   coll: string,
 *   match?: mongodb selector object,
 *   limit?: number,
 *   each: {
 *     coll: string,
 *     foreignField: string,
 *     match: [string] => object selector
 *   }
 * }
 */
