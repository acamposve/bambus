module.exports = {
  apps: [
    {
      name: 'totem-server',
      script: './dist/src/main.js',
      watch: true,
      exec_interpreter: '/usr/local/nvm/versions/node/v14.17.5/bin/node',
      env_production: {
        PORT: '12345',
        env: 'prod',
        dbport: 3306,
        dbhost: 'dbw',
        dbname: 'totems',
        dbuser: 'ngrock',
        dbpass: 'el4denOs',
        ngageHost: 'http://localhost:7000',
        ngageFrom: 'totem@bambus.tech',
        ngageName: 'Totem',
      },
      instances: 1,
      exec_mode: 'cluster',
    },
  ],
  deploy: {
    hulk: {
      user: 'operador',
      host: ['179.27.145.110'],
      port: '821',
      ref: 'origin/master',
      repo: 'git@hulk:bambustech/totem-server.git',
      path: '/opt/bambustech/apps/totem-server/',
      'post-deploy': 'npm install && npm run build && pm2 restart ecosystem.config.js --env production',
    },
  },
};
