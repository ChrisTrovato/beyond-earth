# Working on Beyond Earth

1. Choose one useful improvement: fix a bug, explain a concept, improve accessibility, add a source, or test a model assumption.
2. Create a branch: `git switch -c improve-descriptive-name`.
3. Make the change in `site/`, and update relevant tests or documentation.
4. Run `node scripts/check.cjs` and inspect the affected flow in a browser at desktop and phone widths.
5. Copy the entry template below into `WORKLOG.md`. Record actual work, not just time spent.
6. Review `git diff` and `git status --short`, then stage the specific changed files.
7. Commit with a concrete message, push the branch, and open a pull request. Merge reviewed work into `main`.

```sh
git add site/example.js tests/test-example.cjs WORKLOG.md
git commit -m "Fix the example behavior and document the result"
git push -u origin improve-descriptive-name
```

The example paths are placeholders; stage only files you actually changed. Keep credentials, private notes, and personal exports out of commits. `.gitignore` protects common local files, but review the diff too.

## Daily work-log template

```md
## YYYY-MM-DD — A concrete result
- Question or problem:
- What changed:
- Evidence (test result, screenshot, measurement, or commit/PR link):
- What I learned / can now explain:
- Next useful step:
```

Useful work can be an explanation, experiment, documentation improvement, or fix. Commit meaningful changes when they happen. Do not create empty commits or backdate activity to simulate a daily streak.

## Contribution attribution

GitHub attributes commits using the commit email and qualifying branches, including the repository's default branch. Use the GitHub-provided no-reply address from your account's email settings if you want email privacy. The local checkout prepared for this project uses a repository-local no-reply identity; this does not alter other repositories or your global Git settings.

[GitHub contribution rules](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference) · [Commit email settings](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)

## Deployment

The current public deployment remains on Vercel. GitHub import alone does not connect automatic production deployments. If setting up deployment from this repository, choose `site` as the Vercel Root Directory, framework Other, and no install/build command. Keep the existing domain's path-routing configuration in place.
