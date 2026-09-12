module.exports = {
  apps: [
    {
      name: "svgtoken-owlbear-extension",
      script: "server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "5197",
        GENERATED_TOKEN_DIR: "data/generated-tokens",
      },
    },
  ],
};
