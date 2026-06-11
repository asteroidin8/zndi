import m0000 from './0000_parallel_umar.sql';

export const migrations = {
  journal: {
    version: '7',
    dialect: 'sqlite',
    entries: [
      {
        idx: 0,
        version: '7',
        when: 1718000000000,
        tag: '0000_parallel_umar',
        breakpoints: true,
      },
    ],
  },
  migrations: { '0000_parallel_umar': m0000 },
};
