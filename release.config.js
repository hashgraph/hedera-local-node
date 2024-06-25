const config = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        'preset': 'conventionalcommits',
        'releaseRules': [{ breaking: true, release: 'minor' }]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        'preset': 'conventionalcommits',
      }
    ],
    [
      '@semantic-release/changelog',
      {
        'changelogFile': 'CHANGELOG.md',
        'changelogTitle': 'Hedera Local Node\'s CHANGELOG'
      }
    ],
    '@semantic-release/git',
    "@semantic-release/github"
  ]
};

module.exports = config;
