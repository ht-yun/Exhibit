module.exports = {
  apps : [
    {
      name      : "FeishuSyncLocal",
      script    : "./server.js",
      cwd       : "./FeishuSyncLocal",
      watch     : false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      log_date_format : "YYYY-MM-DD HH:mm:ss",
      error_file      : "../logs/sync_error.log",
      out_file        : "../logs/sync_out.log",
      restart_delay   : 4000
    },
    {
      name      : "FeishuDisplayPortal",
      script    : "./server.js",
      cwd       : "./FeishuDisplayPortal",
      watch     : false,
      env: {
        NODE_ENV: "production",
        PORT: 4000
      },
      log_date_format : "YYYY-MM-DD HH:mm:ss",
      error_file      : "../logs/portal_error.log",
      out_file        : "../logs/portal_out.log",
      restart_delay   : 4000
    }
  ]
};
