// Static marketing builds must never acquire browser business credentials.
export function artifactProblems(text, target) {
  const problems = [];
  if (/https?:\/\/(?:127\.0\.0\.1|localhost):/.test(text))
    problems.push('local preview origin leaked into a distributable build');
  if (!target.preview && /https:\/\/[\w.-]+\.(?:example|invalid|test)(?=[/:"\s<]|$)/.test(text))
    problems.push('placeholder origin leaked into a production build');
  if (/\/account\/v1\/|\/cloud\/v1\/|\/oauth\/token|\brefresh_token\b|\bclient_secret\b/.test(text))
    problems.push('browser business API or credential contract leaked into the static site');
  return problems;
}
