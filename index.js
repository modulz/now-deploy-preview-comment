const axios = require('axios');
const { stripIndents } = require('common-tags');
const { Toolkit } = require('actions-toolkit');

const actionConfig = {
  zeitToken: process.env.ZEIT_TOKEN,
  teamId: process.env.ZEIT_TEAMID,
  projectName: process.env.PROJECT_NAME,
};

if (!actionConfig.zeitToken) {
  throw new Error(`ZEIT_TOKEN environment variable is not set`);
}

const zeitAPIClient = axios.create({
  baseURL: 'https://api.zeit.co',
  headers: { Authorization: `Bearer ${actionConfig.zeitToken}` },
});

// Run your GitHub Action!
Toolkit.run(async tools => {
  function fetchLastDeployment() {
    return zeitAPIClient
      .get(`/v5/now/deployments?teamId=${actionConfig.teamId}`)
      .then(({ data }) => {
        return data.deployments.filter(
          d => d.name === actionConfig.projectName
        )[0];
      });
  }

  let deploymentUrl;
  let deploymentCommit;
  let deploymentProjectName;

  const deployment = await fetchLastDeployment();
  if (deployment) {
    deploymentProjectName = deployment.name;
    deploymentUrl = deployment.url;
    deploymentCommit = deployment.meta.commit;
  }

  const { data: comments } = await tools.github.issues.listComments({
    ...tools.context.repo,
    issue_number: tools.context.payload.pull_request.number,
  });

  const commentFirstSentence = `Deploy preview for _${deploymentProjectName}_ ready!`;
  const zeitPreviewURLComment = comments.find(comment =>
    comment.body.startsWith(commentFirstSentence)
  );

  const commentBody = stripIndents`
    ${commentFirstSentence}

    Built with commit ${deploymentCommit}

    https://${deploymentUrl}
  `;

  if (zeitPreviewURLComment) {
    await tools.github.issues.updateComment({
      ...tools.context.repo,
      comment_id: zeitPreviewURLComment.id,
      body: commentBody,
    });
  } else {
    await tools.github.issues.createComment({
      ...tools.context.repo,
      issue_number: tools.context.payload.pull_request.number,
      body: commentBody,
    });
  }
});
