# now-deploy-preview-comment

> Github action to comment with the now.sh deployment preview URL
>
> Inspired by netlify.com deployment preview comments

## Requirements

* `ZEIT_TOKEN` => The token used for deployment and query the zeit.co API
* `ZEIT_TEAMID` => This is required if your deployment is made on team project.
* `PROJECT_NAME` => This is required to ensure deployments are only referenced for a specific project.

## Example

* This is a complete `.github/workflow/deploy-preview.yml` example.

```yaml
name: deploy website preview
on: [pull_request]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: deploy now
        env:
          ZEIT_TOKEN: ${{ secrets.ZEIT_TOKEN }}
        run: now --no-clipboard -t ${ZEIT_TOKEN} -m commit=${GITHUB_SHA} -m branch=${GITHUB_REF}
      - uses: iam4x/now-deploy-preview-comment@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ZEIT_TOKEN: ${{ secrets.ZEIT_TOKEN }}
          ZEIT_TEAMID: team_XXXXXXXXXXX
```
