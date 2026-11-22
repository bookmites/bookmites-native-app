// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_black_raider.sql';
import m0001 from './0001_happy_nitro.sql';
import m0002 from './0002_neat_tyger_tiger.sql';
import m0003 from './0003_sweet_ghost_rider.sql';
import m0004 from './0004_in_house_reader_cfi.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
  },
};