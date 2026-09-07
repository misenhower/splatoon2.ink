// A fake SplatNet for the Worker specs: enough of every endpoint for all eight updaters.
export const SESSIONS = { NA: 'na-session', EU: 'eu-session', JP: 'jp-session' };

const stage = (id, name) => ({ id, name, image: `/images/stage/${id}.png` });
const rotation = start => ({
  id: start, start_time: start, end_time: start + 7200,
  stage_a: stage('0', 'The Reef'), stage_b: stage('1', 'Musselforge Fitness'),
  game_mode: { key: 'regular', name: 'Regular Battle' },
  rule: { key: 'turf_war', name: 'Turf War', multiline_name: 'Turf\nWar' },
});
const gear = { kind: 'head', id: '1', name: 'Fake Hat', image: '/images/gear/1.png', brand: { id: '0', name: 'Brand', image: '/images/brand/0.png', frequent_skill: { id: '0', name: 'Skill', image: '/images/skill/0.png' } } };
const festival = id => ({ festival_id: id, names: { alpha_short: 'A', bravo_short: 'B' }, times: { start: 3600, end: 7200 }, images: { alpha: '/images/festival/a.png', bravo: '/images/festival/b.png', panel: '/images/festival/p.png' }, special_stage: stage('100', 'Shifty Station') });

export const ROUTES = {
  '/api/schedules': () => ({ regular: [rotation(3600)], gachi: [rotation(3600)], league: [rotation(3600)] }),
  '/api/data/stages': () => ({ stages: [stage('0', 'The Reef'), stage('1', 'Musselforge Fitness')] }),
  '/api/coop_schedules': () => ({ schedules: [{ start_time: 3600, end_time: 7200 }], details: [{ start_time: 3600, end_time: 7200, stage: { name: 'Spawning Grounds', image: '/images/coop_stage/a.png' }, weapons: [null] }] }),
  '/api/timeline': () => ({ coop: { importance: 1, reward_gear: { available_time: 0, gear } }, weapon_availability: null }),
  '/api/festivals/active': () => ({ festivals: [festival(2)] }),
  '/api/festivals/pasts': () => ({ festivals: [festival(1)], results: [{ festival_id: 1 }] }),
  '/api/festivals/1/rankings': () => ({ rankings: [] }),
  '/api/onlineshop/merchandises': () => ({ merchandises: [{ end_time: 7200, gear, skill: { id: '0', name: 'Skill', image: '/images/skill/0.png' } }] }),
};

/** Install on global fetch (e.g. vi.stubGlobal('fetch', fakeSplatNet())). Records every request. */
export function fakeSplatNet(routes = ROUTES) {
  const requests = [];
  const fetch = async (input, init = {}) => {
    const url = new URL(input);
    const headers = new Headers(init.headers);
    requests.push({ path: url.pathname, language: headers.get('Accept-Language'), cookie: headers.get('Cookie') });
    if (url.pathname.startsWith('/images/'))
      return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { headers: { 'content-type': 'image/png' } });
    const route = routes[url.pathname];
    if (!route)
      return new Response('not found', { status: 404 });
    const result = await route();
    return result instanceof Response ? result : Response.json(result);
  };
  fetch.requests = requests;
  return fetch;
}

export function setSessionEnvironment() {
  process.env.NINTENDO_SESSION_ID_NA = SESSIONS.NA;
  process.env.NINTENDO_SESSION_ID_EU = SESSIONS.EU;
  process.env.NINTENDO_SESSION_ID_JP = SESSIONS.JP;
}
