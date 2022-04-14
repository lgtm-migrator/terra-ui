// This test is owned by the Data Catalog Team.
const _ = require('lodash/fp')
const { linkDataToWorkspace } = require('../../utils/catalog-utils')
const { click, clickable, findText, noSpinnersAfter, select } = require('../../utils/integration-utils')
const { withWorkspace } = require('../../utils/integration-helpers')
const { withUserToken } = require('../../utils/terra-sa-utils')


const testCatalogFlowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workspaceName }) => {
  await linkDataToWorkspace(page, testUrl, token)
  await click(page, clickable({ textContains: 'Start with an existing workspace' }))
  await select(page, 'Select a workspace', `${workspaceName}`)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Import' })) })
  await findText(page, `${billingProject}/${workspaceName}`)
  await findText(page, 'Select a data type')
})

const testCatalog = {
  name: 'run-catalog',
  fn: testCatalogFlowFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = {
  testCatalog
}