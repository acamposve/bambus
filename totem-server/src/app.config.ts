type AppConfig = {
  env: string;
  port: number | string;
  db: {
    host: string;
    port: number | string;
    user: string;
    pass: string;
  };
  cvuTesting: boolean;
  sareaTesting: boolean;

  alerts: {
    threshold: {
      email: number[]; // reporta por email cuando queden X tags
    };
    email: string;
  };

  ngage: {
    host: string;
    campaignId: any;
    from: {
      email: string;
      name: string;
    };
  };
};

const config: AppConfig = {
  env: process.env.env || 'stg',
  port: process.env.port || 12345,
  db: {
    host: process.env.dbhost || '192.168.1.201',
    port: process.env.dbport || 3306,
    user: process.env.dbuser || 'ngrock',
    pass: process.env.dbpass || 'el4denOs',
  },
  sareaTesting: false,
  cvuTesting: false,
  alerts: {
    threshold: {
      email: [40, 30, 20, 10],
    },
    email: 'totem@sarea.com.uy',
  },

  ngage: {
    host: process.env.ngageHost || 'http://192.168.1.201:7002',
    campaignId: process.env.ngageCampaign || 4,
    from: {
      email: process.env.ngageFrom || 'noreply@tingelmar.com',
      name: process.env.ngageName || 'Tingelmar',
    },
  },
};

export { config };
