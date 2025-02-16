const axios = require('axios');
const { stripIndents } = require('common-tags');
const { Toolkit } = require('actions-toolkit');

// Run your GitHub Action!
Toolkit.run(async tools => {
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

  function fetchLastDeployment() {
    return zeitAPIClient
      .get(`/v5/now/deployments?teamId=${actionConfig.teamId}`)
      .then(({ data }) => {
        return data.deployments.filter(
          d => d.name === actionConfig.projectName
        )[0];
      });
  }

  const deployment = await fetchLastDeployment();

  const { data: comments } = await tools.github.issues.listComments({
    ...tools.context.repo,
    issue_number: tools.context.payload.pull_request.number,
  });

  const commentFirstSentence = `**${deployment.name}** ready!`;
  const zeitPreviewURLComment = comments.find(comment =>
    comment.body.startsWith(commentFirstSentence)
  );

  const commentBody = stripIndents`
    ${commentFirstSentence}

    commit ${deployment.meta.commit}
    
    https://${deployment.url}
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
